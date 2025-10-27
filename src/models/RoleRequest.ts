import mongoose, { Document, Schema } from 'mongoose';

export interface IRoleRequest extends Document {
  companyId: string;
  userId: string;
  username: string;
  roleName: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string; // userId who requested
  handledBy?: string; // userId of admin who handled
  handledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RoleRequestSchema = new Schema<IRoleRequest>({
  companyId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  username: { type: String, required: true },
  roleName: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedBy: { type: String, required: true },
  handledBy: String,
  handledAt: Date,
}, {
  timestamps: true,
});

// Compound index to prevent duplicate pending requests
RoleRequestSchema.index({ userId: 1, roleName: 1, status: 1 }, { unique: false });

export default mongoose.model<IRoleRequest>('RoleRequest', RoleRequestSchema);
