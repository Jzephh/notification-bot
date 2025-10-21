import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  companyId: string;
  userId: string;
  username: string;
  name: string;
  avatarUrl?: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    companyId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    name: { type: String, required: true },
    avatarUrl: String,
    roles: { type: [String], default: [] },
  },
  { timestamps: true }
);

UserSchema.index({ companyId: 1, userId: 1 }, { unique: true });

export default (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema);


