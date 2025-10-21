import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  companyId: string;
  userId: string;
  username: string;
  name: string;
  avatarUrl?: string;
  subscribedRoles: string[]; // Array of role names user is subscribed to
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  companyId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  username: { type: String, required: true },
  name: { type: String, required: true },
  avatarUrl: String,
  subscribedRoles: [String],
  isAdmin: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// Compound index for efficient queries
UserSchema.index({ companyId: 1, userId: 1 }, { unique: true });

export const User = (mongoose.models && mongoose.models.User) || mongoose.model<IUser>('User', UserSchema);
