import mongoose, { Document, Schema } from 'mongoose';

export interface ILastMessage extends Document {
  companyId: string;
  experienceId: string;
  experienceName: string;
  lastMessageId: string;
  lastMessageTimestamp: number;
  createdAt: Date;
  updatedAt: Date;
}

const LastMessageSchema = new Schema<ILastMessage>({
  companyId: { type: String, required: true, index: true },
  experienceId: { type: String, required: true, index: true },
  experienceName: { type: String, required: true },
  lastMessageId: { type: String, required: true },
  lastMessageTimestamp: { type: Number, required: true },
}, {
  timestamps: true,
});

// Compound index to ensure unique last message per experience per company
LastMessageSchema.index({ companyId: 1, experienceId: 1 }, { unique: true });

// Clear any existing model to avoid conflicts
if (mongoose.models.LastMessage) {
  delete mongoose.models.LastMessage;
}

export default mongoose.model<ILastMessage>('LastMessage', LastMessageSchema);
