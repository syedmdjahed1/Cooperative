import 'dotenv/config';
import { createApp } from '../src/app.js';
import { connectDb } from '../src/config/db.js';

connectDb().catch((err) => console.error('MongoDB:', err));

const app = createApp();
export default app;
