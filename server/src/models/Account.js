import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    key: { type: String, enum: ['cash', 'bank'], required: true },
    name: { type: String, required: true },
    samityCode: { type: String, default: 'default' },
  },
  { timestamps: true }
);

accountSchema.index({ key: 1, samityCode: 1 }, { unique: true });

export const Account = mongoose.model('Account', accountSchema);
