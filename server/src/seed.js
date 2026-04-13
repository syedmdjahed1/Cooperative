import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { User } from './models/User.js';
import { Settings } from './models/Settings.js';
import { Account } from './models/Account.js';

async function seed() {
  await connectDb();
  const samityCode = env('SEED_SAMITY', 'default');
  await Settings.updateOne(
    { samityCode },
    { $setOnInsert: { monthlyInstallment: 1000, currency: 'BDT', shareParValue: 0 } },
    { upsert: true }
  );
  for (const k of [
    { key: 'cash', name: 'Cash Account' },
    { key: 'bank', name: 'Bank Account' },
  ]) {
    await Account.updateOne(
      { key: k.key, samityCode },
      { $setOnInsert: { name: k.name } },
      { upsert: true }
    );
  }
  const email = env('SEED_ADMIN_EMAIL', 'admin@samity.local');
  const password = env('SEED_ADMIN_PASSWORD', 'admin123');
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists');
    process.exit(0);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    email,
    passwordHash,
    role: 'admin',
  });
  console.log(`Created admin ${email} / ${password}`);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
