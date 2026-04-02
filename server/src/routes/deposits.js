import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Deposit } from '../models/Deposit.js';
import { Member } from '../models/Member.js';
import { Transaction } from '../models/Transaction.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLog.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const filter = { samityCode: req.samityCode };
  if (req.user.role === 'member' && req.user.memberId) {
    filter.memberId = req.user.memberId;
  }
  if (req.query.status && ['pending', 'approved', 'rejected'].includes(req.query.status)) {
    filter.status = req.query.status;
  }
  if (req.query.memberId && ['admin', 'accountant'].includes(req.user.role)) {
    filter.memberId = req.query.memberId;
  }
  const deposits = await Deposit.find(filter).sort({ createdAt: -1 }).limit(500).lean();
  res.json({ deposits });
});

router.post(
  '/',
  requireRoles('member', 'admin', 'accountant'),
  body('amount').isFloat({ gt: 0 }),
  body('month').matches(/^\d{4}-\d{2}$/),
  body('paymentMethod').isIn(['cash', 'bank']),
  body('note').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    let memberId = req.user.memberId;
    if (['admin', 'accountant'].includes(req.user.role) && req.body.memberId) {
      memberId = req.body.memberId;
    }
    if (!memberId) return res.status(400).json({ message: 'memberId required' });
    const member = await Member.findOne({ _id: memberId, samityCode: req.samityCode });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    const deposit = await Deposit.create({
      memberId,
      amount: Number(req.body.amount),
      month: req.body.month,
      paymentMethod: req.body.paymentMethod,
      note: req.body.note || '',
      status: 'pending',
      samityCode: req.samityCode,
    });
    await logActivity({
      actorId: req.user.id,
      action: 'deposit_submit',
      entity: 'Deposit',
      entityId: deposit._id,
      samityCode: req.samityCode,
    });
    res.status(201).json({ deposit });
  }
);

router.patch(
  '/:id/approve',
  requireRoles('admin', 'accountant'),
  param('id').isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const deposit = await Deposit.findOne({
      _id: req.params.id,
      samityCode: req.samityCode,
      status: 'pending',
    });
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });
    deposit.status = 'approved';
    deposit.reviewedBy = req.user.id;
    deposit.reviewedAt = new Date();
    await deposit.save();
    await Transaction.create({
      account: deposit.paymentMethod,
      type: 'deposit_in',
      amount: Math.abs(deposit.amount),
      description: `Deposit approved ${deposit.month}`,
      referenceModel: 'Deposit',
      referenceId: deposit._id,
      createdBy: req.user.id,
      occurredAt: new Date(),
      samityCode: req.samityCode,
    });
    await logActivity({
      actorId: req.user.id,
      action: 'deposit_approve',
      entity: 'Deposit',
      entityId: deposit._id,
      samityCode: req.samityCode,
    });
    res.json({ deposit });
  }
);

router.patch(
  '/:id/reject',
  requireRoles('admin', 'accountant'),
  param('id').isMongoId(),
  body('reason').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const deposit = await Deposit.findOne({
      _id: req.params.id,
      samityCode: req.samityCode,
      status: 'pending',
    });
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });
    deposit.status = 'rejected';
    deposit.rejectedReason = req.body.reason || '';
    deposit.reviewedBy = req.user.id;
    deposit.reviewedAt = new Date();
    await deposit.save();
    await logActivity({
      actorId: req.user.id,
      action: 'deposit_reject',
      entity: 'Deposit',
      entityId: deposit._id,
      samityCode: req.samityCode,
    });
    res.json({ deposit });
  }
);

export default router;
