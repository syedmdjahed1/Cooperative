import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    memberNumber: { type: String, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, default: '' },
    shares: { type: Number, required: true, min: 0, default: 0 },
    joiningFee: { type: Number, default: 0 },
    joiningFeePaid: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    joinedAt: { type: Date, default: Date.now },
    samityCode: { type: String, default: 'default', index: true },
  },
  { timestamps: true }
);

memberSchema.index({ phone: 1, samityCode: 1 });

export const Member = mongoose.model('Member', memberSchema);
