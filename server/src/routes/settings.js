import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Settings } from '../models/Settings.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  let s = await Settings.findOne({ samityCode: req.samityCode });
  if (!s) s = await Settings.create({ samityCode: req.samityCode });
  res.json({ settings: s });
});

router.patch(
  '/',
  requireRoles('admin'),
  body('monthlyInstallment').optional().isFloat({ min: 0 }),
  body('shareParValue').optional().isFloat({ min: 0 }),
  body('currency').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    let s = await Settings.findOne({ samityCode: req.samityCode });
    if (!s) s = new Settings({ samityCode: req.samityCode });
    if (req.body.monthlyInstallment != null) s.monthlyInstallment = Number(req.body.monthlyInstallment);
    if (req.body.shareParValue != null) s.shareParValue = Number(req.body.shareParValue);
    if (req.body.currency) s.currency = req.body.currency;
    await s.save();
    res.json({ settings: s });
  }
);

export default router;
