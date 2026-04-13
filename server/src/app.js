import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import membersRoutes from './routes/members.js';
import depositsRoutes from './routes/deposits.js';
import investmentsRoutes from './routes/investments.js';
import reportsRoutes from './routes/reports.js';
import distributionsRoutes from './routes/distributions.js';
import transactionsRoutes from './routes/transactions.js';
import settingsRoutes from './routes/settings.js';
import accountsRoutes from './routes/accounts.js';
import activityRoutes from './routes/activity.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { Member } from './models/Member.js';

export function createApp() {
  const app = express();
  const corsOrigin = env('CORS_ORIGIN');
  app.use(
    cors({
      origin: corsOrigin ? corsOrigin.split(',').map((s) => s.trim()) : true,
      credentials: true,
    })
  );
  app.use(morgan('dev'));
  app.use(express.json({ limit: '1mb' }));

  const ping = (req, res) => res.json({ ok: true });
  app.get('/health', ping);
  app.get('/api/health', ping);

  app.get('/api/health/db', async (req, res) => {
    try {
      await connectDb();
      const samity =
        (req.headers['x-samity-code'] || 'default').toString().trim() || 'default';
      const memberCount = await Member.countDocuments({ samityCode: samity });
      const mongodbUriSet = Boolean(process.env.MONGODB_URI || process.env.mongodb_uri);
      res.json({
        ok: true,
        mongodb: 'connected',
        samityCode: samity,
        memberCount,
        mongodbUriSet,
      });
    } catch (e) {
      const mongodbUriSet = Boolean(process.env.MONGODB_URI || process.env.mongodb_uri);
      res.status(500).json({
        ok: false,
        mongodb: 'error',
        message: e.message,
        mongodbUriSet,
      });
    }
  });

  app.use(async (req, res, next) => {
    try {
      await connectDb();
      next();
    } catch (e) {
      next(e);
    }
  });

  const r = express.Router();

  r.use('/auth', authRoutes);
  r.use('/members', membersRoutes);
  r.use('/deposits', depositsRoutes);
  r.use('/investments', investmentsRoutes);
  r.use('/reports', reportsRoutes);
  r.use('/distributions', distributionsRoutes);
  r.use('/transactions', transactionsRoutes);
  r.use('/settings', settingsRoutes);
  r.use('/accounts', accountsRoutes);
  r.use('/activity', activityRoutes);

  app.use('/api', r);

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  });

  return app;
}
