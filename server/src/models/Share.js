import mongoose from 'mongoose';

const shareSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    delta: { type: Number, required: true },
    previousShares: { type: Number, required: true },
    newShares: { type: Number, required: true },
    note: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    samityCode: { type: String, default: 'default', index: true },
  },
  { timestamps: true }
);

shareSchema.index({ memberId: 1, createdAt: -1 });

export const Share = mongoose.model('Share', shareSchema);
