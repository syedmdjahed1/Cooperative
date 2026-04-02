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

export function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true, credentials: true }));
  app.use(morgan('dev'));
  app.use(express.json({ limit: '1mb' }));

  const ping = (req, res) => res.json({ ok: true });
  app.get('/health', ping);
  app.get('/api/health', ping);

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
