import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    account: { type: String, enum: ['cash', 'bank'], required: true },
    type: {
      type: String,
      enum: [
        'deposit_in',
        'withdrawal',
        'investment_out',
        'investment_return',
        'expense',
        'distribution',
        'transfer_cash_bank',
        'transfer_bank_cash',
        'joining_fee',
        'adjustment',
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    description: { type: String, default: '' },
    referenceModel: { type: String },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    occurredAt: { type: Date, default: Date.now },
    samityCode: { type: String, default: 'default', index: true },
  },
  { timestamps: true }
);

transactionSchema.index({ account: 1, occurredAt: -1 });
transactionSchema.index({ type: 1, occurredAt: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
