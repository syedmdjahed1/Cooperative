import 'dotenv/config';
import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { Account } from './models/Account.js';

const port = Number(process.env.PORT || 4000);

async function ensureAccounts(samityCode) {
  const keys = [
    { key: 'cash', name: 'Cash Account' },
    { key: 'bank', name: 'Bank Account' },
  ];
  for (const k of keys) {
    await Account.updateOne(
      { key: k.key, samityCode },
      { $setOnInsert: { name: k.name } },
      { upsert: true }
    );
  }
}

async function main() {
  const app = createApp();
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
    console.log(`API base: http://localhost:${port}/api`);
  });
  connectDb()
    .then(() => ensureAccounts('default'))
    .then(() => console.log('MongoDB connected'))
    .catch((e) => {
      console.error('MongoDB connection failed — start MongoDB or set MONGODB_URI in .env');
      console.error(e.message);
    });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
