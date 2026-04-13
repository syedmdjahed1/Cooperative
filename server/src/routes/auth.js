import { Router } from 'express';
import { authenticate, getSamityCode, DEMO_ACTOR_ID } from '../middleware/auth.js';

const router = Router();

router.get('/me', authenticate, (req, res) => {
  res.json({
    user: {
      _id: DEMO_ACTOR_ID,
      email: 'demo@demo.local',
      phone: null,
      role: 'admin',
      memberId: null,
      demo: true,
      samityCode: getSamityCode(req),
    },
  });
});

export default router;
