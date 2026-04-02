import { Router } from 'express';
import { param, query, validationResult } from 'express-validator';
import { Member } from '../models/Member.js';
import { Deposit } from '../models/Deposit.js';
import { Investment } from '../models/Investment.js';
import { Transaction } from '../models/Transaction.js';
import { Distribution } from '../models/Distribution.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import {
  getMemberApprovedDepositsTotal,
  getMemberDistributionTotal,
  getMemberDueAdvance,
  computeAccountBalances,
  getTotalShares,
} from '../services/memberFinance.js';

const router = Router();
router.use(authenticate);

router.get('/dashboard/admin', requireRoles('admin', 'accountant'), async (req, res) => {
  const samityCode = req.samityCode;
  const [memberCount, pendingDeposits, investments, balances, totalShares, distAgg] = await Promise.all([
    Member.countDocuments({ status: 'active', samityCode }),
    Deposit.countDocuments({ status: 'pending', samityCode }),
    Investment.find({ samityCode }).lean(),
    computeAccountBalances(samityCode),
    getTotalShares(samityCode),
    Distribution.aggregate([
      { $match: { samityCode } },
      { $group: { _id: null, total: { $sum: '$totalProfitOrLoss' } } },
    ]),
  ]);
  let totalInvested = 0;
  let realizedPL = 0;
  for (const inv of investments) {
    totalInvested += inv.amount;
    for (const r of inv.returns || []) {
      if (r.returnType === 'profit') realizedPL += r.amount;
      else realizedPL -= r.amount;
    }
  }
  res.json({
    totalMembers: memberCount,
    pendingDeposits,
    totalFund: balances.total,
    cash: balances.cash,
    bank: balances.bank,
    totalInvestmentPrincipal: totalInvested,
    investmentCount: investments.length,
    realizedProfitLossFromInvestments: realizedPL,
    cumulativeDistributedPL: distAgg[0]?.total || 0,
    totalShares,
  });
});

router.get(
  '/member/:id/statement',
  param('id').isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const m = await Member.findOne({ _id: req.params.id, samityCode: req.samityCode }).lean();
    if (!m) return res.status(404).json({ message: 'Not found' });
    if (req.user.role === 'member' && req.user.memberId !== m._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!['admin', 'accountant', 'member'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const deposits = await Deposit.find({ memberId: m._id, samityCode: req.samityCode })
      .sort({ createdAt: -1 })
      .lean();
    const distributions = await Distribution.find({
      samityCode: req.samityCode,
      'allocations.memberId': m._id,
    })
      .sort({ createdAt: -1 })
      .lean();
    const allocRows = distributions.map((d) => {
      const row = d.allocations.find((a) => a.memberId.toString() === m._id.toString());
      return {
        date: d.createdAt,
        label: d.label,
        totalPL: d.totalProfitOrLoss,
        memberAmount: row?.amount,
        shareRatio: row?.shareRatio,
      };
    });
    const totalDeposited = await getMemberApprovedDepositsTotal(m._id, req.samityCode);
    const profitLoss = await getMemberDistributionTotal(m._id, req.samityCode);
    const dueAdvance = await getMemberDueAdvance(m, req.samityCode);
    res.json({
      member: m,
      deposits,
      distributions: allocRows,
      totalDeposited,
      profitLoss,
      currentBalance: totalDeposited + profitLoss,
      dueAdvance,
    });
  }
);

router.get(
  '/monthly',
  requireRoles('admin', 'accountant'),
  query('month').matches(/^\d{4}-\d{2}$/),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const month = req.query.month;
    const deposits = await Deposit.find({
      samityCode: req.samityCode,
      month,
    })
      .populate('memberId', 'name memberNumber')
      .lean();
    const approved = deposits.filter((d) => d.status === 'approved');
    const pending = deposits.filter((d) => d.status === 'pending');
    const totalApproved = approved.reduce((s, d) => s + d.amount, 0);
    res.json({ month, deposits, summary: { totalApproved, countApproved: approved.length, countPending: pending.length } });
  }
);

router.get('/investments', requireRoles('admin', 'accountant'), async (req, res) => {
  const list = await Investment.find({ samityCode: req.samityCode }).sort({ date: -1 }).lean();
  const summary = list.reduce(
    (acc, i) => {
      acc.principal += i.amount;
      for (const r of i.returns || []) {
        if (r.returnType === 'profit') acc.profit += r.amount;
        else acc.loss += r.amount;
      }
      return acc;
    },
    { principal: 0, profit: 0, loss: 0 }
  );
  res.json({ investments: list, summary });
});

router.get('/cash-bank', requireRoles('admin', 'accountant'), async (req, res) => {
  const balances = await computeAccountBalances(req.samityCode);
  const transactions = await Transaction.find({ samityCode: req.samityCode })
    .sort({ occurredAt: -1 })
    .limit(300)
    .lean();
  res.json({ balances, transactions });
});

export default router;
