import { connectDB } from '@/lib/mongodb';
import LastMessage from '@/models/LastMessage';

export class LastMessageService {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  /**
   * Get the last message ID for a specific experience
   */
  async getLastMessageId(experienceId: string): Promise<string | null> {
    try {
      await connectDB();
      
      const lastMessage = await LastMessage.findOne({
        companyId: this.companyId,
        experienceId: experienceId
      });

      return lastMessage ? lastMessage.lastMessageId : null;
    } catch (error) {
      console.error(`❌ Error getting last message ID for ${experienceId}:`, error);
      return null;
    }
  }

  /**
   * Update the last message ID for a specific experience
   */
  async updateLastMessageId(
    experienceId: string, 
    experienceName: string, 
    messageId: string, 
    timestamp: number
  ): Promise<void> {
    try {
      await connectDB();
      
      await LastMessage.findOneAndUpdate(
        {
          companyId: this.companyId,
          experienceId: experienceId
        },
        {
          companyId: this.companyId,
          experienceId: experienceId,
          experienceName: experienceName,
          lastMessageId: messageId,
          lastMessageTimestamp: timestamp
        },
        { upsert: true, new: true }
      );

      console.log(`📝 Updated last message ID for ${experienceName}: ${messageId}`);
    } catch (error) {
      console.error(`❌ Error updating last message ID for ${experienceId}:`, error);
    }
  }

  /**
   * Clear all last message tracking for fresh start
   */
  async clearAllMessageTracking(): Promise<void> {
    try {
      await connectDB();
      
      await LastMessage.deleteMany({
        companyId: this.companyId
      });

      console.log('🗑️ Cleared all last message tracking');
    } catch (error) {
      console.error('❌ Error clearing message tracking:', error);
    }
  }

  /**
   * Get all tracked experiences
   */
  async getAllTrackedExperiences(): Promise<Array<{
    experienceId: string;
    experienceName: string;
    lastMessageId: string;
    lastMessageTimestamp: number;
  }>> {
    try {
      await connectDB();
      
      const lastMessages = await LastMessage.find({
        companyId: this.companyId
      }).sort({ updatedAt: -1 });

      return lastMessages.map(msg => ({
        experienceId: msg.experienceId,
        experienceName: msg.experienceName,
        lastMessageId: msg.lastMessageId,
        lastMessageTimestamp: msg.lastMessageTimestamp
      }));
    } catch (error) {
      console.error('❌ Error getting tracked experiences:', error);
      return [];
    }
  }
}
