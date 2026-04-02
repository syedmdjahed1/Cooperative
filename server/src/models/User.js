import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'accountant', 'member'],
      default: 'member',
    },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

export const User = mongoose.model('User', userSchema);
