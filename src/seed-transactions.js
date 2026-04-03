require('dotenv').config();
const mongoose = require('mongoose');
const connect = require('./config/db');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

const LEGACY_DEMO_NOTE_PREFIX = '[demo-seed]';
const DEMO_SEED_TAG = 'demo-v1';

const startOfWeekMonday = (date) => {
  const d = new Date(date);
  d.setHours(10, 0, 0, 0);
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const asPositive = (value) => Math.max(100, Math.round(value));

const buildDemoTransactions = (createdBy, weeks = 36) => {
  const now = new Date();
  const firstWeek = startOfWeekMonday(addDays(now, -7 * (weeks - 1)));
  const docs = [];

  for (let i = 0; i < weeks; i += 1) {
    const weekDate = addDays(firstWeek, i * 7);
    const trend = i; // old -> new
    const seasonal = Math.sin(i / 2.8) * 2200;

    const incomeMain = asPositive(52000 + (trend * 1600) + seasonal + ((i % 4) * 900));
    docs.push({
      amount: incomeMain,
      type: 'income',
      category: i % 3 === 0 ? 'Freelance' : 'Salary',
      date: addDays(weekDate, 1),
      notes: 'Weekly primary income',
      seedTag: DEMO_SEED_TAG,
      createdBy,
    });

    if (i % 2 === 0) {
      docs.push({
        amount: asPositive(9000 + (trend * 250) + ((i % 5) * 300)),
        type: 'income',
        category: i % 4 === 0 ? 'Investment' : 'Bonus',
        date: addDays(weekDate, 3),
        notes: 'Secondary income',
        seedTag: DEMO_SEED_TAG,
        createdBy,
      });
    }

    docs.push({
      amount: asPositive(6800 + (trend * 140) + (Math.cos(i / 2) * 500)),
      type: 'expense',
      category: 'Food',
      date: addDays(weekDate, 2),
      notes: 'Food and groceries',
      seedTag: DEMO_SEED_TAG,
      createdBy,
    });

    docs.push({
      amount: asPositive(2500 + (trend * 60) + ((i % 3) * 130)),
      type: 'expense',
      category: 'Transport',
      date: addDays(weekDate, 4),
      notes: 'Transport and commute',
      seedTag: DEMO_SEED_TAG,
      createdBy,
    });

    if (weekDate.getDate() <= 7) {
      docs.push({
        amount: asPositive(30500 + ((i % 4) * 450)),
        type: 'expense',
        category: 'Rent',
        date: addDays(weekDate, 0),
        notes: 'Monthly rent',
        seedTag: DEMO_SEED_TAG,
        createdBy,
      });
    }

    if (i % 2 === 1) {
      docs.push({
        amount: asPositive(3600 + ((i % 6) * 180)),
        type: 'expense',
        category: 'Utilities',
        date: addDays(weekDate, 5),
        notes: 'Utilities',
        seedTag: DEMO_SEED_TAG,
        createdBy,
      });
    }
  }

  return docs;
};

const seedTransactions = async () => {
  await connect();

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  let admin = await User.findOne({ email: adminEmail });

  if (!admin) {
    admin = await User.create({
      name: process.env.SEED_ADMIN_NAME || 'Admin',
      email: adminEmail,
      password: process.env.SEED_ADMIN_PASSWORD || 'Admin@1234',
      role: 'admin',
    });
    console.log(`Created admin for seed data: ${adminEmail}`);
  }

  const deleteResult = await Transaction.deleteMany({
    $or: [
      { seedTag: DEMO_SEED_TAG },
      { notes: { $regex: `^\\${LEGACY_DEMO_NOTE_PREFIX}` } },
    ],
  });

  const demoDocs = buildDemoTransactions(admin._id, 36);
  const inserted = await Transaction.insertMany(demoDocs);

  const dates = inserted.map((doc) => doc.date).sort((a, b) => a - b);
  console.log(`Removed old demo transactions: ${deleteResult.deletedCount}`);
  console.log(`Inserted demo transactions: ${inserted.length}`);
  console.log(`Date range: ${dates[0].toISOString().slice(0, 10)} -> ${dates[dates.length - 1].toISOString().slice(0, 10)}`);

  await mongoose.disconnect();
};

seedTransactions()
  .then(() => {
    console.log('Transaction seed completed.');
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Transaction seed failed:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  });
