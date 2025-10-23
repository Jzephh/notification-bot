import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  companyId: string;
  roleName: string;
  message: string;
  sentBy: string; // User ID who sent the notification
  sentTo: string[]; // Array of user IDs who received the notification
  readBy: string[]; // Array of user IDs who have read the notification
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  companyId: { type: String, required: true, index: true },
  roleName: { type: String, required: true },
  message: { type: String, required: true },
  sentBy: { type: String, required: true },
  sentTo: [{ type: String }],
  readBy: [{ type: String }], // Array of user IDs who have read this notification
}, {
  timestamps: true,
});

// Clear any existing model to avoid conflicts
if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

export default mongoose.model<INotification>('Notification', NotificationSchema);
