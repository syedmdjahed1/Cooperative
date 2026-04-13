/**
 * Public demo build: no passwords or JWT. Every request runs as a synthetic admin user.
 * Replace with real JWT auth when moving beyond client demos.
 */
export const DEMO_ACTOR_ID = '000000000000000000000001';

export function getSamityCode(req) {
  return (req.headers['x-samity-code'] || 'default').toString().trim() || 'default';
}

export function authenticate(req, res, next) {
  req.user = {
    id: DEMO_ACTOR_ID,
    role: 'admin',
    memberId: null,
  };
  req.samityCode = getSamityCode(req);
  next();
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
