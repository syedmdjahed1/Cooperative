import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Member } from '../models/Member.js';
import { Share } from '../models/Share.js';
import { Deposit } from '../models/Deposit.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import {
  getMemberApprovedDepositsTotal,
  getMemberDistributionTotal,
  getMemberDueAdvance,
  getTotalShares,
} from '../services/memberFinance.js';
import { Settings } from '../models/Settings.js';
import { logActivity } from '../utils/activityLog.js';

const router = Router();

router.use(authenticate);

router.get('/me/summary', async (req, res) => {
    let targetId = req.user.memberId;
    if (!targetId) {
      if (req.query.memberId) targetId = req.query.memberId;
      else {
        const first = await Member.findOne({
          samityCode: req.samityCode,
          status: 'active',
        })
          .sort({ createdAt: 1 })
          .select('_id')
          .lean();
        if (!first) return res.status(404).json({ message: 'No members yet' });
        targetId = first._id.toString();
      }
    }
    const member = await Member.findOne({
      _id: targetId,
      samityCode: req.samityCode,
    }).lean();
    if (!member) return res.status(404).json({ message: 'Member not found' });
    const settings = await Settings.findOne({ samityCode: req.samityCode }).lean();
    const totalDeposited = await getMemberApprovedDepositsTotal(member._id, req.samityCode);
    const profitLoss = await getMemberDistributionTotal(member._id, req.samityCode);
    const dueAdvance = await getMemberDueAdvance(member, req.samityCode);
    const par = settings?.shareParValue ?? 0;
    const shareValue = par > 0 ? member.shares * par : null;
    const recentDeposits = await Deposit.find({ memberId: member._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.json({
      member,
      totalDeposited,
      profitLoss,
      currentBalance: totalDeposited + profitLoss,
      shareValue,
      dueAdvance,
      recentDeposits,
    });
});

router.get(
  '/',
  requireRoles('admin', 'accountant'),
  query('status').optional().isIn(['active', 'inactive']),
  async (req, res) => {
    const filter = { samityCode: req.samityCode };
    if (req.query.status) filter.status = req.query.status;
    const members = await Member.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ members });
  }
);

router.get('/:id/shares', requireRoles('admin', 'accountant'), param('id').isMongoId(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const logs = await Share.find({ memberId: req.params.id, samityCode: req.samityCode })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ logs });
});

router.get('/:id', param('id').isMongoId(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const m = await Member.findOne({ _id: req.params.id, samityCode: req.samityCode }).lean();
  if (!m) return res.status(404).json({ message: 'Not found' });
  const totalDeposited = await getMemberApprovedDepositsTotal(m._id, req.samityCode);
  const profitLoss = await getMemberDistributionTotal(m._id, req.samityCode);
  const dueAdvance = await getMemberDueAdvance(m, req.samityCode);
  res.json({ member: m, totalDeposited, profitLoss, dueAdvance });
});

router.post(
  '/',
  requireRoles('admin'),
  body('name').trim().notEmpty(),
  body('phone').optional().isString(),
  body('address').optional().isString(),
  body('shares').isFloat({ min: 0 }),
  body('joiningFee').optional().isFloat({ min: 0 }),
  body('joiningFeePaid').optional().isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, phone, address, shares, joiningFee, joiningFeePaid } = req.body;
    const count = await Member.countDocuments({ samityCode: req.samityCode });
    const memberNumber = `M-${String(count + 1).padStart(5, '0')}`;
    const member = await Member.create({
      memberNumber,
      name,
      phone,
      address,
      shares: Number(shares),
      joiningFee: joiningFee ?? 0,
      joiningFeePaid: joiningFeePaid ?? false,
      samityCode: req.samityCode,
    });
    await Share.create({
      memberId: member._id,
      delta: Number(shares),
      previousShares: 0,
      newShares: Number(shares),
      note: 'Initial',
      updatedBy: req.user.id,
      samityCode: req.samityCode,
    });
    await logActivity({
      actorId: req.user.id,
      action: 'create_member',
      entity: 'Member',
      entityId: member._id,
      samityCode: req.samityCode,
    });
    res.status(201).json({ member });
  }
);

router.patch(
  '/:id',
  requireRoles('admin'),
  param('id').isMongoId(),
  body('name').optional().trim().notEmpty(),
  body('phone').optional().isString(),
  body('address').optional().isString(),
  body('shares').optional().isFloat({ min: 0 }),
  body('joiningFee').optional().isFloat({ min: 0 }),
  body('joiningFeePaid').optional().isBoolean(),
  body('status').optional().isIn(['active', 'inactive']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const m = await Member.findOne({ _id: req.params.id, samityCode: req.samityCode });
    if (!m) return res.status(404).json({ message: 'Not found' });
    const prevShares = m.shares;
    if (typeof req.body.name === 'string') m.name = req.body.name;
    if (typeof req.body.phone === 'string') m.phone = req.body.phone;
    if (typeof req.body.address === 'string') m.address = req.body.address;
    if (req.body.joiningFee != null) m.joiningFee = Number(req.body.joiningFee);
    if (req.body.joiningFeePaid != null) m.joiningFeePaid = !!req.body.joiningFeePaid;
    if (req.body.status) m.status = req.body.status;
    if (req.body.shares != null) {
      const next = Number(req.body.shares);
      const delta = next - prevShares;
      m.shares = next;
      if (delta !== 0) {
        await Share.create({
          memberId: m._id,
          delta,
          previousShares: prevShares,
          newShares: next,
          note: req.body.shareNote || '',
          updatedBy: req.user.id,
          samityCode: req.samityCode,
        });
      }
    }
    await m.save();
    await logActivity({
      actorId: req.user.id,
      action: 'update_member',
      entity: 'Member',
      entityId: m._id,
      samityCode: req.samityCode,
    });
    res.json({ member: m });
  }
);

export default router;
