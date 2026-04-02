import mongoose from 'mongoose';
import { Deposit } from '../models/Deposit.js';
import { Distribution } from '../models/Distribution.js';
import { Settings } from '../models/Settings.js';
import { Member } from '../models/Member.js';
import { Transaction } from '../models/Transaction.js';

export async function getMemberApprovedDepositsTotal(memberId, samityCode) {
  const agg = await Deposit.aggregate([
    {
      $match: {
        memberId: memberId,
        status: 'approved',
        samityCode,
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return agg[0]?.total || 0;
}

export async function getMemberDistributionTotal(memberId, samityCode) {
  const mid = memberId?.toString?.() ?? memberId;
  const docs = await Distribution.find({ samityCode }).lean();
  let sum = 0;
  for (const d of docs) {
    const row = d.allocations?.find((a) => {
      const aid = a.memberId instanceof mongoose.Types.ObjectId ? a.memberId.toString() : String(a.memberId);
      return aid === mid;
    });
    if (row) sum += row.amount;
  }
  return sum;
}

export function monthsBetween(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(
    1,
    (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1
  );
}

export async function getMemberDueAdvance(member, samityCode) {
  const settings = await Settings.findOne({ samityCode }).lean();
  const monthly = settings?.monthlyInstallment || 0;
  if (!monthly) {
    return { expected: 0, due: 0, advance: 0, paid: 0 };
  }
  const joined = member.joinedAt || member.createdAt || new Date();
  const now = new Date();
  const m = monthsBetween(joined, now);
  const expected = m * monthly + (member.joiningFee && !member.joiningFeePaid ? member.joiningFee : 0);
  const paid = await getMemberApprovedDepositsTotal(member._id, samityCode);
  const net = paid - expected;
  return {
    expected,
    paid,
    due: net < 0 ? -net : 0,
    advance: net > 0 ? net : 0,
    monthsElapsed: m,
    monthlyInstallment: monthly,
  };
}

export async function getTotalShares(samityCode) {
  const agg = await Member.aggregate([
    { $match: { status: 'active', samityCode } },
    { $group: { _id: null, total: { $sum: '$shares' } } },
  ]);
  return agg[0]?.total || 0;
}

export async function computeAccountBalances(samityCode) {
  const signForBalance = (t) => {
    const amt = Math.abs(t.amount);
    if (t.type === 'transfer_cash_bank') {
      if (t.account === 'cash') return -amt;
      if (t.account === 'bank') return amt;
    }
    if (t.type === 'transfer_bank_cash') {
      if (t.account === 'bank') return -amt;
      if (t.account === 'cash') return amt;
    }
    const out = ['withdrawal', 'investment_out', 'expense', 'distribution'];
    const inn = ['deposit_in', 'investment_return', 'joining_fee', 'adjustment'];
    if (out.includes(t.type)) return -amt;
    if (inn.includes(t.type)) return amt;
    return t.amount;
  };

  const txs = await Transaction.find({ samityCode }).lean();
  let cash = 0;
  let bank = 0;
  for (const t of txs) {
    const delta = signForBalance(t);
    if (t.account === 'cash') cash += delta;
    if (t.account === 'bank') bank += delta;
  }
  return { cash, bank, total: cash + bank };
}
