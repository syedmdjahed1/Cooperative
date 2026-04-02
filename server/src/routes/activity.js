import { Router } from 'express';
import { ActivityLog } from '../models/ActivityLog.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.use(requireRoles('admin'));

router.get('/', async (req, res) => {
  const logs = await ActivityLog.find({ samityCode: req.samityCode })
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('actorId', 'email phone role')
    .lean();
  res.json({ logs });
});

export default router;
