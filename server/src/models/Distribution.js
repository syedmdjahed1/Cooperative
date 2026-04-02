import mongoose from 'mongoose';

const allocationSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    shares: { type: Number, required: true },
    shareRatio: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const distributionSchema = new mongoose.Schema(
  {
    label: { type: String, default: '' },
    totalProfitOrLoss: { type: Number, required: true },
    totalShares: { type: Number, required: true },
    allocationSign: { type: Number, enum: [1, -1], default: 1 },
    allocations: [allocationSchema],
    investmentReturnRef: {
      investmentId: mongoose.Schema.Types.ObjectId,
      returnId: mongoose.Schema.Types.ObjectId,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    samityCode: { type: String, default: 'default', index: true },
  },
  { timestamps: true }
);

export const Distribution = mongoose.model('Distribution', distributionSchema);
