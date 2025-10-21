import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  companyId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    companyId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

// Ensure unique role names per company
RoleSchema.index({ companyId: 1, name: 1 }, { unique: true });

export default (mongoose.models.Role as mongoose.Model<IRole>) ||
  mongoose.model<IRole>('Role', RoleSchema);


