import { ActivityLog } from '../models/ActivityLog.js';

export async function logActivity({ actorId, action, entity, entityId, meta, samityCode }) {
  try {
    await ActivityLog.create({
      actorId,
      action,
      entity,
      entityId,
      meta,
      samityCode: samityCode || 'default',
    });
  } catch {
    /* non-fatal */
  }
}
