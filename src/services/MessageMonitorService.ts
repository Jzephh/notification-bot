import { ChatExperienceService, ChatExperience } from './ChatExperienceService';
import { LastMessageService } from './LastMessageService';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import Role from '@/models/Role';
import Notification from '@/models/Notification';

export interface ProcessedMessage {
  id: string;
  content: string;
  userId: string;
  username: string;
  experienceId: string;
  experienceName: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  messageType: string;
  isDeleted: boolean;
  user: {
    id: string;
    username: string;
  };
}

export class MessageMonitorService {
  private companyId: string;
  private chatExperienceService: ChatExperienceService;
  private lastMessageService: LastMessageService;
  private chatExperiences: ChatExperience[] = [];
  private isRunning: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(companyId: string) {
    this.companyId = companyId;
    this.chatExperienceService = new ChatExperienceService(companyId);
    this.lastMessageService = new LastMessageService(companyId);
  }

  /**
   * Start monitoring chat experiences for role mentions
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Message monitoring is already running');
      return;
    }

    try {
      await connectDB();
      
      // Discover chat experiences
      this.chatExperiences = await this.chatExperienceService.discoverChatExperiences();
      
      if (this.chatExperiences.length === 0) {
        console.log('⚠️ No chat experiences found');
        return;
      }

      console.log(`📡 Monitoring ${this.chatExperiences.length} chat experiences for role mentions`);

      // Initialize baseline for new experiences (existing ones will use database)
      await this.initializeNewExperiences();

      // Start polling every 10 seconds
      this.isRunning = true;
      this.pollingInterval = setInterval(() => {
        this.pollAllExperiences().catch(console.error);
      }, 3000);

      console.log('✅ Message monitoring started - watching for @rolename mentions');
      
    } catch (error) {
      console.error('❌ Failed to start message monitoring:', error);
      this.isRunning = false;
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Message monitoring stopped');
  }

  /**
   * Initialize baseline for new experiences (only if not already tracked)
   */
  private async initializeNewExperiences(): Promise<void> {
    for (const experience of this.chatExperiences) {
      try {
        // Check if this experience is already being tracked
        const existingLastMessageId = await this.lastMessageService.getLastMessageId(experience.id);
        
        if (!existingLastMessageId) {
          // This is a new experience, set baseline to most recent message
          const latestMessageId = await this.chatExperienceService.getLatestMessageId(experience.id);
          if (latestMessageId) {
            // Get the message timestamp
            const messages = await this.chatExperienceService.getMessagesFromChat(experience.id);
            const latestMessage = messages.find((msg: ChatMessage) => msg.id === latestMessageId);
            const timestamp = latestMessage ? parseInt(latestMessage.createdAt) : Date.now();
            
            await this.lastMessageService.updateLastMessageId(
              experience.id,
              experience.name,
              latestMessageId,
              timestamp
            );
            console.log(`🎯 Set baseline for new experience ${experience.name}: ${latestMessageId}`);
          }
        } else {
          console.log(`📋 Experience ${experience.name} already tracked, continuing from last position`);
        }
      } catch (error) {
        console.error(`❌ Failed to initialize baseline for ${experience.name}:`, error);
      }
    }
  }

  /**
   * Poll all chat experiences for new messages
   */
  private async pollAllExperiences(): Promise<void> {
    if (!this.isRunning) return;

    const promises = this.chatExperiences.map(experience => 
      this.pollExperience(experience)
    );

    await Promise.allSettled(promises);
  }

  /**
   * Poll a single experience for new messages
   */
  private async pollExperience(experience: ChatExperience): Promise<void> {
    try {
      const messages = await this.chatExperienceService.getMessagesFromChat(experience.id);
      
      if (!messages || messages.length === 0) {
        return;
      }

      // Get the last seen message ID from database
      const lastSeenId = await this.lastMessageService.getLastMessageId(experience.id);
      const newMessages: ProcessedMessage[] = [];

      // Find new messages (messages after the last seen ID)
      for (const message of messages) {
        // Skip if this is the last message we've seen
        if (lastSeenId && message.id === lastSeenId) {
          break;
        }

        // Skip bot messages and system messages
        if (message.messageType === 'automated' || message.messageType === 'system') {
          continue;
        }

        // Skip deleted messages
        if (message.isDeleted) {
          continue;
        }

        newMessages.push({
          id: message.id,
          content: message.content,
          userId: message.user.id,
          username: message.user.username,
          experienceId: experience.id,
          experienceName: experience.name,
          timestamp: parseInt(message.createdAt),
        });
      }

      // Update last seen message ID in database
      if (messages.length > 0) {
        const latestMessage = messages[0];
        await this.lastMessageService.updateLastMessageId(
          experience.id,
          experience.name,
          latestMessage.id,
          parseInt(latestMessage.createdAt)
        );
      }

      // Process new messages for role mentions
      for (const message of newMessages) {
        await this.processMessage(message);
      }

    } catch (error) {
      console.error(`❌ Error polling ${experience.name}:`, error);
    }
  }

  /**
   * Process a message for role mentions
   */
  private async processMessage(message: ProcessedMessage): Promise<void> {
    try {
      // Check if user is admin
      const user = await User.findOne({ 
        userId: message.userId,
        companyId: this.companyId 
      });

      if (!user || !user.isAdmin) {
        return; // Only admins can trigger role notifications
      }

      // Extract role mentions from message content
      const roleMentions = this.extractRoleMentions(message.content);
      
      if (roleMentions.length === 0) {
        return;
      }

      console.log(`🔔 Admin ${message.username} mentioned roles: ${roleMentions.join(', ')}`);

      // Process each role mention
      for (const roleName of roleMentions) {
        await this.sendRoleNotification(roleName, message);
      }

    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  }

  /**
   * Extract role mentions from message content
   * Looks for @rolename patterns
   */
  private extractRoleMentions(content: string): string[] {
    const roleMentionRegex = /@(\w+)/g;
    const matches = content.match(roleMentionRegex);
    
    if (!matches) {
      return [];
    }

    // Extract role names (remove @ symbol)
    return matches.map(match => match.substring(1).toLowerCase().trim());
  }

  /**
   * Send notification to users with the specified role
   */
  private async sendRoleNotification(roleName: string, message: ProcessedMessage): Promise<void> {
    try {
      // Find the role
      const role = await Role.findOne({ 
        companyId: this.companyId,
        name: roleName
      });

      if (!role) {
        console.log(`⚠️ Role '${roleName}' not found`);
        return;
      }

      // Get all users who have this role assigned
      const users = await User.find({ 
        companyId: this.companyId,
        roles: roleName
      });

      if (users.length === 0) {
        console.log(`⚠️ No users found with role '${roleName}'`);
        return;
      }

      // Create notification record
      const notification = new Notification({
        companyId: this.companyId,
        roleName: roleName,
        message: `@${roleName} mentioned by Admin in ${message.experienceName},
        the article: ${message.content}`,
        sentBy: message.userId,
        sentTo: users.map(u => u.userId)
      });

      await notification.save();

      console.log(`✅ Sent notification to ${users.length} users for role '${roleName}'`);
      
    } catch (error) {
      console.error(`❌ Error sending notification for role '${roleName}':`, error);
    }
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    isRunning: boolean;
    chatExperiences: ChatExperience[];
    experienceCount: number;
  } {
    return {
      isRunning: this.isRunning,
      chatExperiences: this.chatExperiences,
      experienceCount: this.chatExperiences.length,
    };
  }

  /**
   * Clear all message tracking (useful for fresh start)
   */
  async clearMessageTracking(): Promise<void> {
    await this.lastMessageService.clearAllMessageTracking();
    console.log('🗑️ Cleared all message tracking - will start fresh on next poll');
  }
}
