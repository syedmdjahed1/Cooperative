import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { Member } from '../models/Member.js';
import { authenticate, signToken, requireRoles, getSamityCode } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLog.js';

const router = Router();

router.post(
  '/login',
  body('password').isString().notEmpty(),
  body('login').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const samityCode = getSamityCode(req);
    const { login, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: login.trim().toLowerCase() }, { phone: login.trim() }],
      isActive: true,
    }).lean();
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.role === 'member' && user.memberId) {
      const m = await Member.findById(user.memberId).lean();
      if (m && m.samityCode !== samityCode) return res.status(401).json({ message: 'Invalid credentials' });
    }
    const userDoc = await User.findById(user._id);
    const ok = await bcrypt.compare(password, userDoc.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken(user._id);
    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        memberId: user.memberId,
      },
    });
  }
);

router.get('/me', authenticate, async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('-passwordHash')
    .populate('memberId')
    .lean();
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
});

router.post(
  '/bootstrap',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('phone').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const count = await User.countDocuments();
    if (count > 0) return res.status(403).json({ message: 'Bootstrap disabled' });
    const { email, password, phone } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      phone: phone || undefined,
      passwordHash,
      role: 'admin',
    });
    await logActivity({
      actorId: user._id,
      action: 'bootstrap_admin',
      entity: 'User',
      entityId: user._id,
      samityCode: getSamityCode(req),
    });
    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, role: user.role },
    });
  }
);

router.post(
  '/users',
  authenticate,
  requireRoles('admin'),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin', 'accountant', 'member']),
  body('email').optional().isEmail(),
  body('phone').optional().isString(),
  body('memberId').optional({ values: 'falsy' }).isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, phone, password, role, memberId } = req.body;
    if (!email && !phone) return res.status(400).json({ message: 'Email or phone required' });
    if (role === 'member' && !memberId) return res.status(400).json({ message: 'memberId required for member role' });
    const passwordHash = await bcrypt.hash(password, 10);
    try {
      const user = await User.create({
        email: email ? email.toLowerCase() : undefined,
        phone: phone || undefined,
        passwordHash,
        role,
        memberId: memberId || null,
      });
      if (memberId) await Member.findByIdAndUpdate(memberId, { userId: user._id });
      await logActivity({
        actorId: req.user.id,
        action: 'create_user',
        entity: 'User',
        entityId: user._id,
        meta: { role },
        samityCode: req.samityCode,
      });
      res.status(201).json({ id: user._id, email: user.email, phone: user.phone, role: user.role });
    } catch (e) {
      if (e.code === 11000) return res.status(409).json({ message: 'Duplicate email or phone' });
      throw e;
    }
  }
);

export default router;
