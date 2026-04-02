import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    samityCode: { type: String, default: 'default', unique: true },
    monthlyInstallment: { type: Number, default: 0, min: 0 },
    shareParValue: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'BDT' },
  },
  { timestamps: true }
);

export const Settings = mongoose.model('Settings', settingsSchema);
