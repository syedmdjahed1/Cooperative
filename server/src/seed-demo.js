import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDb } from './config/db.js';
import { Member } from './models/Member.js';
import { Share } from './models/Share.js';
import { Deposit } from './models/Deposit.js';
import { Transaction } from './models/Transaction.js';
import { Investment } from './models/Investment.js';
import { Distribution } from './models/Distribution.js';
import { Settings } from './models/Settings.js';
import { Account } from './models/Account.js';
import { ActivityLog } from './models/ActivityLog.js';
import { DEMO_ACTOR_ID } from './middleware/auth.js';
import { env } from './config/env.js';

const actorId = new mongoose.Types.ObjectId(DEMO_ACTOR_ID);
const samityCode = env('SEED_SAMITY', 'default');

async function wipeSamityData() {
  await Promise.all([
    Deposit.deleteMany({ samityCode }),
    Transaction.deleteMany({ samityCode }),
    Distribution.deleteMany({ samityCode }),
    Investment.deleteMany({ samityCode }),
    Share.deleteMany({ samityCode }),
    Member.deleteMany({ samityCode }),
    ActivityLog.deleteMany({ samityCode }),
  ]);
}

function approvedDeposit({ memberId, amount, month, paymentMethod, daysAgo }) {
  const d = new Date();
  d.setDate(d.getDate() - (daysAgo || 0));
  return {
    memberId,
    amount,
    month,
    paymentMethod,
    status: 'approved',
    reviewedBy: actorId,
    reviewedAt: d,
    samityCode,
  };
}

function pendingDeposit({ memberId, amount, month, paymentMethod }) {
  return {
    memberId,
    amount,
    month,
    paymentMethod,
    status: 'pending',
    samityCode,
  };
}

async function seedDemo() {
  await connectDb();

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

  await Settings.findOneAndUpdate(
    { samityCode },
    {
      $set: {
        monthlyInstallment: 800,
        currency: 'BDT',
        shareParValue: 500,
      },
    },
    { upsert: true, new: true }
  );

  const existing = await Member.countDocuments({ samityCode });
  const force = env('SEED_DEMO_FORCE') === '1';
  if (existing > 0 && !force) {
    console.log(
      'Sample data already exists for this samity. Run with SEED_DEMO_FORCE=1 to replace it.'
    );
    process.exit(0);
    return;
  }

  if (existing > 0 && force) {
    console.log('Removing existing demo samity data...');
    await wipeSamityData();
  }

  const rawMembers = [
    {
      memberNumber: 'M-00001',
      name: 'Fatima Rahman',
      phone: '+880 1711 111111',
      address: 'Dhaka, Mirpur',
      shares: 12,
      joiningFee: 2000,
      joiningFeePaid: true,
    },
    {
      memberNumber: 'M-00002',
      name: 'Karim Hassan',
      phone: '+880 1812 222222',
      address: 'Chattogram, Agrabad',
      shares: 10,
      joiningFee: 2000,
      joiningFeePaid: true,
    },
    {
      memberNumber: 'M-00003',
      name: 'Sharmin Akter',
      phone: '+880 1913 333333',
      address: 'Sylhet, Zindabazar',
      shares: 8,
      joiningFee: 2000,
      joiningFeePaid: true,
    },
    {
      memberNumber: 'M-00004',
      name: 'Md. Rafiqul Islam',
      phone: '+880 1614 444444',
      address: 'Rajshahi',
      shares: 15,
      joiningFee: 2000,
      joiningFeePaid: true,
    },
    {
      memberNumber: 'M-00005',
      name: 'Nasreen Sultana',
      phone: '+880 1515 555555',
      address: 'Dhaka, Uttara',
      shares: 6,
      joiningFee: 2000,
      joiningFeePaid: true,
    },
    {
      memberNumber: 'M-00006',
      name: 'Abdul Mannan',
      phone: '+880 1416 666666',
      address: 'Khulna',
      shares: 9,
      joiningFee: 2000,
      joiningFeePaid: false,
    },
  ];

  const members = [];
  for (const r of rawMembers) {
    const m = await Member.create({
      ...r,
      status: 'active',
      samityCode,
      joinedAt: new Date('2024-06-15'),
    });
    members.push(m);
    await Share.create({
      memberId: m._id,
      delta: r.shares,
      previousShares: 0,
      newShares: r.shares,
      note: 'Initial',
      updatedBy: actorId,
      samityCode,
    });
  }

  const months = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03'];
  const payCycle = ['bank', 'bank', 'cash', 'bank', 'cash'];
  let day = 5;
  let mi = 0;
  for (const m of members.slice(0, 5)) {
    for (const month of months) {
      const amount = 800 + (mi % 3) * 50;
      const dep = await Deposit.create(
        approvedDeposit({
          memberId: m._id,
          amount,
          month,
          paymentMethod: payCycle[mi % payCycle.length],
          daysAgo: day++,
        })
      );
      mi += 1;
      await Transaction.create({
        account: dep.paymentMethod,
        type: 'deposit_in',
        amount: dep.amount,
        description: `Deposit approved ${dep.month}`,
        referenceModel: 'Deposit',
        referenceId: dep._id,
        createdBy: actorId,
        occurredAt: dep.reviewedAt || new Date(),
        samityCode,
      });
    }
  }

  await Deposit.create(
    pendingDeposit({
      memberId: members[0]._id,
      amount: 800,
      month: '2026-04',
      paymentMethod: 'bank',
    })
  );
  await Deposit.create(
    pendingDeposit({
      memberId: members[2]._id,
      amount: 800,
      month: '2026-04',
      paymentMethod: 'cash',
    })
  );

  const inv1 = await Investment.create({
    title: 'Treasury bill — 182 day',
    amount: 450000,
    date: new Date('2025-09-01'),
    description: 'Short-term placement',
    account: 'bank',
    returns: [
      {
        returnType: 'profit',
        amount: 22000,
        date: new Date('2026-02-28'),
        note: 'Matured return',
      },
    ],
    samityCode,
  });
  await Transaction.create({
    account: 'bank',
    type: 'investment_out',
    amount: inv1.amount,
    description: `Investment: ${inv1.title}`,
    referenceModel: 'Investment',
    referenceId: inv1._id,
    createdBy: actorId,
    occurredAt: inv1.date,
    samityCode,
  });
  await Transaction.create({
    account: 'bank',
    type: 'investment_return',
    amount: 22000,
    description: `Investment profit: ${inv1.title}`,
    referenceModel: 'Investment',
    referenceId: inv1._id,
    createdBy: actorId,
    occurredAt: new Date('2026-02-28'),
    samityCode,
  });

  const inv2 = await Investment.create({
    title: 'SME cooperative fund unit',
    amount: 180000,
    date: new Date('2025-11-10'),
    description: 'Medium-term participation',
    account: 'bank',
    returns: [
      {
        returnType: 'profit',
        amount: 9500,
        date: new Date('2026-03-15'),
        note: 'Quarterly accrual',
      },
    ],
    samityCode,
  });
  await Transaction.create({
    account: 'bank',
    type: 'investment_out',
    amount: inv2.amount,
    description: `Investment: ${inv2.title}`,
    referenceModel: 'Investment',
    referenceId: inv2._id,
    createdBy: actorId,
    occurredAt: inv2.date,
    samityCode,
  });
  await Transaction.create({
    account: 'bank',
    type: 'investment_return',
    amount: 9500,
    description: `Investment profit: ${inv2.title}`,
    referenceModel: 'Investment',
    referenceId: inv2._id,
    createdBy: actorId,
    occurredAt: new Date('2026-03-15'),
    samityCode,
  });

  await Transaction.create({
    account: 'cash',
    type: 'expense',
    amount: 4200,
    description: 'Meeting hall & stationery',
    createdBy: actorId,
    occurredAt: new Date('2026-02-05'),
    samityCode,
  });

  const totalShares = rawMembers.reduce((s, x) => s + x.shares, 0);
  const totalPL = 18500;
  const allocations = members.map((mem) => {
    const r = rawMembers.find((x) => x.memberNumber === mem.memberNumber);
    const shares = r.shares;
    const ratio = shares / totalShares;
    const amount = Math.round(totalPL * ratio * 100) / 100;
    return {
      memberId: mem._id,
      shares,
      shareRatio: ratio,
      amount,
    };
  });

  await Distribution.create({
    label: 'FY Q1 surplus allocation',
    totalProfitOrLoss: totalPL,
    totalShares,
    allocationSign: 1,
    allocations,
    createdBy: actorId,
    samityCode,
  });

  await ActivityLog.create({
    actorId,
    action: 'seed_demo',
    entity: 'System',
    meta: { members: members.length },
    samityCode,
  });

  console.log(
    `Demo sample data ready (${members.length} members, deposits, investments, distribution, ledger). Samity: ${samityCode}`
  );
  process.exit(0);
}

seedDemo().catch((e) => {
  console.error(e);
  process.exit(1);
});
