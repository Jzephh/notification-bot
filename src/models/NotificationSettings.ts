import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationSettings extends Document {
  companyId: string;
  experienceId: string;
  experienceName: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSettingsSchema = new Schema<INotificationSettings>({
  companyId: { type: String, required: true, unique: true },
  experienceId: { type: String, required: true },
  experienceName: { type: String, required: true },
}, {
  timestamps: true,
});

export default mongoose.model<INotificationSettings>('NotificationSettings', NotificationSettingsSchema);


