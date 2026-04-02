import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Member } from '../models/Member.js';
import { Distribution } from '../models/Distribution.js';
import { Investment } from '../models/Investment.js';
import mongoose from 'mongoose';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { getTotalShares } from '../services/memberFinance.js';
import { logActivity } from '../utils/activityLog.js';

const router = Router();
router.use(authenticate);

router.get('/', requireRoles('admin', 'accountant'), async (req, res) => {
  const list = await Distribution.find({ samityCode: req.samityCode })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  res.json({ distributions: list });
});

router.post(
  '/',
  requireRoles('admin', 'accountant'),
  body('label').optional().isString(),
  body('totalProfitOrLoss').isFloat(),
  body('investmentId').optional().isMongoId(),
  body('returnId').optional().isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const totalPL = Number(req.body.totalProfitOrLoss);
    const totalShares = await getTotalShares(req.samityCode);
    if (totalShares <= 0) return res.status(400).json({ message: 'No active shares' });
    const members = await Member.find({ status: 'active', samityCode: req.samityCode }).lean();
    const allocations = members
      .filter((m) => m.shares > 0)
      .map((m) => {
        const ratio = m.shares / totalShares;
        const amount = Math.round(totalPL * ratio * 100) / 100;
        return {
          memberId: m._id,
          shares: m.shares,
          shareRatio: ratio,
          amount,
        };
      });
    const dist = await Distribution.create({
      label: req.body.label || '',
      totalProfitOrLoss: totalPL,
      totalShares,
      allocationSign: totalPL >= 0 ? 1 : -1,
      allocations,
      investmentReturnRef:
        req.body.investmentId && req.body.returnId
          ? {
              investmentId: new mongoose.Types.ObjectId(req.body.investmentId),
              returnId: new mongoose.Types.ObjectId(req.body.returnId),
            }
          : undefined,
      createdBy: req.user.id,
      samityCode: req.samityCode,
    });
    await logActivity({
      actorId: req.user.id,
      action: 'distribution_create',
      entity: 'Distribution',
      entityId: dist._id,
      samityCode: req.samityCode,
    });
    res.status(201).json({ distribution: dist });
  }
);

router.post(
  '/from-investment',
  requireRoles('admin', 'accountant'),
  body('investmentId').isMongoId(),
  body('returnId').isMongoId(),
  body('label').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const inv = await Investment.findOne({ _id: req.body.investmentId, samityCode: req.samityCode });
    if (!inv) return res.status(404).json({ message: 'Investment not found' });
    const ret = inv.returns.id(req.body.returnId);
    if (!ret) return res.status(404).json({ message: 'Return not found' });
    const totalPL = ret.returnType === 'profit' ? Number(ret.amount) : -Number(ret.amount);
    const totalShares = await getTotalShares(req.samityCode);
    if (totalShares <= 0) return res.status(400).json({ message: 'No active shares' });
    const members = await Member.find({ status: 'active', samityCode: req.samityCode }).lean();
    const allocations = members
      .filter((m) => m.shares > 0)
      .map((m) => {
        const ratio = m.shares / totalShares;
        const amount = Math.round(totalPL * ratio * 100) / 100;
        return {
          memberId: m._id,
          shares: m.shares,
          shareRatio: ratio,
          amount,
        };
      });
    const dist = await Distribution.create({
      label: req.body.label || `Distribution for ${inv.title}`,
      totalProfitOrLoss: totalPL,
      totalShares,
      allocationSign: totalPL >= 0 ? 1 : -1,
      allocations,
      investmentReturnRef: {
        investmentId: inv._id,
        returnId: ret._id,
      },
      createdBy: req.user.id,
      samityCode: req.samityCode,
    });
    await logActivity({
      actorId: req.user.id,
      action: 'distribution_from_investment',
      entity: 'Distribution',
      entityId: dist._id,
      samityCode: req.samityCode,
    });
    res.status(201).json({ distribution: dist });
  }
);

export default router;
