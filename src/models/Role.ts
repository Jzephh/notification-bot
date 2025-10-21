import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  companyId: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>({
  companyId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, required: false, default: '' },
  color: { type: String, required: false, default: '#1976d2' },
}, {
  timestamps: true,
});

// Compound index to ensure unique role names per company
RoleSchema.index({ companyId: 1, name: 1 }, { unique: true });

// Clear any existing model to avoid conflicts
if (mongoose.models.Role) {
  delete mongoose.models.Role;
}

export default mongoose.model<IRole>('Role', RoleSchema);
