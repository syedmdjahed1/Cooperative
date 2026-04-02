import mongoose from 'mongoose';

const returnSchema = new mongoose.Schema(
  {
    returnType: { type: String, enum: ['profit', 'loss'], required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { _id: true }
);

const investmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    description: { type: String, default: '' },
    account: { type: String, enum: ['cash', 'bank'], default: 'bank' },
    returns: [returnSchema],
    samityCode: { type: String, default: 'default', index: true },
  },
  { timestamps: true }
);

export const Investment = mongoose.model('Investment', investmentSchema);
