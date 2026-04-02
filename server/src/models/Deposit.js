import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    amount: { type: Number, required: true, min: 0 },
    month: { type: String, required: true },
    paymentMethod: { type: String, enum: ['cash', 'bank'], required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    note: { type: String, default: '' },
    rejectedReason: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    samityCode: { type: String, default: 'default', index: true },
  },
  { timestamps: true }
);

depositSchema.index({ memberId: 1, month: 1 });
depositSchema.index({ status: 1, createdAt: -1 });

export const Deposit = mongoose.model('Deposit', depositSchema);
