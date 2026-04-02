import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Transaction } from '../models/Transaction.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLog.js';

const router = Router();
router.use(authenticate);

router.get('/', requireRoles('admin', 'accountant'), async (req, res) => {
  const { account, type } = req.query;
  const filter = { samityCode: req.samityCode };
  if (account) filter.account = account;
  if (type) filter.type = type;
  const transactions = await Transaction.find(filter).sort({ occurredAt: -1 }).limit(500).lean();
  res.json({ transactions });
});

router.post(
  '/withdrawal',
  requireRoles('admin', 'accountant'),
  body('account').isIn(['cash', 'bank']),
  body('amount').isFloat({ gt: 0 }),
  body('description').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const t = await Transaction.create({
      account: req.body.account,
      type: 'withdrawal',
      amount: Math.abs(Number(req.body.amount)),
      description: req.body.description || 'Withdrawal',
      createdBy: req.user.id,
      samityCode: req.samityCode,
    });
    await logActivity({
      actorId: req.user.id,
      action: 'withdrawal',
      entity: 'Transaction',
      entityId: t._id,
      samityCode: req.samityCode,
    });
    res.status(201).json({ transaction: t });
  }
);

router.post(
  '/expense',
  requireRoles('admin', 'accountant'),
  body('account').isIn(['cash', 'bank']),
  body('amount').isFloat({ gt: 0 }),
  body('description').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const t = await Transaction.create({
      account: req.body.account,
      type: 'expense',
      amount: Math.abs(Number(req.body.amount)),
      description: req.body.description || 'Expense',
      createdBy: req.user.id,
      samityCode: req.samityCode,
    });
    await logActivity({
      actorId: req.user.id,
      action: 'expense',
      entity: 'Transaction',
      entityId: t._id,
      samityCode: req.samityCode,
    });
    res.status(201).json({ transaction: t });
  }
);

router.post(
  '/transfer',
  requireRoles('admin', 'accountant'),
  body('from').isIn(['cash', 'bank']),
  body('to').isIn(['cash', 'bank']),
  body('amount').isFloat({ gt: 0 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    if (req.body.from === req.body.to) return res.status(400).json({ message: 'from/to must differ' });
    const amt = Math.abs(Number(req.body.amount));
    const type =
      req.body.from === 'cash' && req.body.to === 'bank'
        ? 'transfer_cash_bank'
        : 'transfer_bank_cash';
    const t1 = await Transaction.create({
      account: req.body.from,
      type,
      amount: amt,
      description: `Transfer to ${req.body.to}`,
      createdBy: req.user.id,
      samityCode: req.samityCode,
    });
    const t2 = await Transaction.create({
      account: req.body.to,
      type,
      amount: amt,
      description: `Transfer from ${req.body.from}`,
      createdBy: req.user.id,
      samityCode: req.samityCode,
    });
    res.status(201).json({ out: t1, in: t2 });
  }
);

export default router;
