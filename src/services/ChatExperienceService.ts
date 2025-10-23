import { getWhopSdk } from '@/lib/whop';

export interface ChatExperience {
  id: string;
  name: string;
  appName: string;
}

export class ChatExperienceService {
  private companyId: string;
  private whopSdk: ReturnType<typeof getWhopSdk>;

  constructor(companyId: string) {
    this.companyId = companyId;
    this.whopSdk = getWhopSdk();
  }

  /**
   * Discover all chat experiences for the company
   */
  async discoverChatExperiences(): Promise<ChatExperience[]> {
    try {
      console.log(`🔍 Discovering chat experiences for company: ${this.companyId}`);
      
      const experiences = await this.whopSdk.experiences.listExperiences({
        companyId: this.companyId,
      });

      const chatExperiences = experiences.experiencesV2.nodes
        .filter((exp: { app: { name: string }; name: string }) => 
          exp.app.name.toLowerCase().includes('chat') || 
          exp.name.toLowerCase().includes('chat')
        )
        .map((exp: { id: string; name: string; app: { name: string } }) => ({
          id: exp.id,
          name: exp.name,
          appName: exp.app.name,
        }));

      console.log(`📡 Found ${chatExperiences.length} chat experiences:`, 
        chatExperiences.map((exp: ChatExperience) => `${exp.name} (${exp.id})`));

      return chatExperiences;
    } catch (error) {
      console.error('❌ Failed to discover chat experiences:', error);
      throw error;
    }
  }

  /**
   * Get messages from a specific chat experience
   */
  async getMessagesFromChat(experienceId: string) {
    try {
      const result = await this.whopSdk.messages.listMessagesFromChat({
        chatExperienceId: experienceId,
      });

      return result.posts || [];
    } catch (error) {
      console.error(`❌ Failed to get messages from chat ${experienceId}:`, error);
      throw error;
    }
  }

  /**
   * Get the latest message ID from a chat experience
   */
  async getLatestMessageId(experienceId: string): Promise<string | null> {
    try {
      const messages = await this.getMessagesFromChat(experienceId);
      return messages.length > 0 ? messages[0].id : null;
    } catch (error) {
      console.error(`❌ Failed to get latest message ID from ${experienceId}:`, error);
      return null;
    }
  }
}
