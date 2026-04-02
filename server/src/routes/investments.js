import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Investment } from '../models/Investment.js';
import { Transaction } from '../models/Transaction.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLog.js';

const router = Router();
router.use(authenticate);

router.get('/', requireRoles('admin', 'accountant', 'member'), async (req, res) => {
  const list = await Investment.find({ samityCode: req.samityCode }).sort({ date: -1 }).lean();
  if (req.user.role === 'member') {
    return res.json({
      investments: list.map((i) => ({
        _id: i._id,
        title: i.title,
        amount: i.amount,
        date: i.date,
        description: i.description,
      })),
    });
  }
  res.json({ investments: list });
});

router.post(
  '/',
  requireRoles('admin', 'accountant'),
  body('title').trim().notEmpty(),
  body('amount').isFloat({ gt: 0 }),
  body('date').optional().isISO8601(),
  body('description').optional().isString(),
  body('account').optional().isIn(['cash', 'bank']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const account = req.body.account || 'bank';
    const inv = await Investment.create({
      title: req.body.title,
      amount: Number(req.body.amount),
      date: req.body.date ? new Date(req.body.date) : new Date(),
      description: req.body.description || '',
      account,
      samityCode: req.samityCode,
    });
    await Transaction.create({
      account,
      type: 'investment_out',
      amount: Math.abs(inv.amount),
      description: `Investment: ${inv.title}`,
      referenceModel: 'Investment',
      referenceId: inv._id,
      createdBy: req.user.id,
      occurredAt: inv.date,
      samityCode: req.samityCode,
    });
    await logActivity({
      actorId: req.user.id,
      action: 'investment_create',
      entity: 'Investment',
      entityId: inv._id,
      samityCode: req.samityCode,
    });
    res.status(201).json({ investment: inv });
  }
);

router.post(
  '/:id/returns',
  requireRoles('admin', 'accountant'),
  param('id').isMongoId(),
  body('returnType').isIn(['profit', 'loss']),
  body('amount').isFloat({ gt: 0 }),
  body('date').optional().isISO8601(),
  body('note').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const inv = await Investment.findOne({ _id: req.params.id, samityCode: req.samityCode });
    if (!inv) return res.status(404).json({ message: 'Not found' });
    const ret = {
      returnType: req.body.returnType,
      amount: Number(req.body.amount),
      date: req.body.date ? new Date(req.body.date) : new Date(),
      note: req.body.note || '',
    };
    inv.returns.push(ret);
    await inv.save();
    const last = inv.returns[inv.returns.length - 1];
    if (ret.returnType === 'profit') {
      await Transaction.create({
        account: inv.account,
        type: 'investment_return',
        amount: Math.abs(ret.amount),
        description: `Investment profit: ${inv.title}`,
        referenceModel: 'Investment',
        referenceId: inv._id,
        createdBy: req.user.id,
        occurredAt: last.date,
        samityCode: req.samityCode,
      });
    } else {
      await Transaction.create({
        account: inv.account,
        type: 'expense',
        amount: Math.abs(ret.amount),
        description: `Investment loss: ${inv.title}`,
        referenceModel: 'Investment',
        referenceId: inv._id,
        createdBy: req.user.id,
        occurredAt: last.date,
        samityCode: req.samityCode,
      });
    }
    await logActivity({
      actorId: req.user.id,
      action: 'investment_return',
      entity: 'Investment',
      entityId: inv._id,
      meta: { returnType: ret.returnType },
      samityCode: req.samityCode,
    });
    res.status(201).json({ investment: inv, return: last });
  }
);

router.delete('/:id', requireRoles('admin'), param('id').isMongoId(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const inv = await Investment.findOneAndDelete({ _id: req.params.id, samityCode: req.samityCode });
  if (!inv) return res.status(404).json({ message: 'Not found' });
  await Transaction.deleteMany({ referenceModel: 'Investment', referenceId: inv._id });
  await logActivity({
    actorId: req.user.id,
    action: 'investment_delete',
    entity: 'Investment',
    entityId: inv._id,
    samityCode: req.samityCode,
  });
  res.json({ ok: true });
});

export default router;
