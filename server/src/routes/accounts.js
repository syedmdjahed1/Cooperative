import { Router } from 'express';
import { Account } from '../models/Account.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { computeAccountBalances } from '../services/memberFinance.js';

const router = Router();
router.use(authenticate);

router.get('/balances', requireRoles('admin', 'accountant'), async (req, res) => {
  const balances = await computeAccountBalances(req.samityCode);
  const accounts = await Account.find({ samityCode: req.samityCode }).lean();
  res.json({ balances, accounts });
});

export default router;
