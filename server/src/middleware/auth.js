import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export function getSamityCode(req) {
  return (req.headers['x-samity-code'] || 'default').toString().trim() || 'default';
}

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.sub).lean();
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }
    req.user = {
      id: user._id.toString(),
      role: user.role,
      memberId: user.memberId ? user.memberId.toString() : null,
    };
    req.samityCode = getSamityCode(req);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

export function signToken(userId) {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  return jwt.sign({ sub: userId.toString() }, secret, { expiresIn: '7d' });
}
