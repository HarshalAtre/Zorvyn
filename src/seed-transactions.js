require('dotenv').config();
const mongoose = require('mongoose');
const connect = require('./config/db');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const startOfWeekMonday = (date) => {
  const d = new Date(date);
  d.setHours(10, 0, 0, 0);
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const generateTransactions = (createdBy, weeks = 28) => {
  const docs = [];
  const now = new Date();
  const firstWeek = startOfWeekMonday(addDays(now, -7 * (weeks - 1)));

  for (let i = 0; i < weeks; i += 1) {
    const weekDate = addDays(firstWeek, i * 7);
    const trend = i * 180;
    const seasonal = Math.round(Math.sin(i / 2.5) * 1200);

    docs.push({
      amount: 42000 + trend + seasonal,
      type: 'income',
      category: i % 3 === 0 ? 'Freelance' : 'Salary',
      date: addDays(weekDate, 1),
      notes: 'Weekly income',
      createdBy,
    });

    if (i % 2 === 0) {
      docs.push({
        amount: 6000 + (i * 70),
        type: 'income',
        category: i % 4 === 0 ? 'Bonus' : 'Investment',
        date: addDays(weekDate, 3),
        notes: 'Additional income',
        createdBy,
      });
    }

    docs.push({
      amount: 5400 + (i * 55),
      type: 'expense',
      category: 'Food',
      date: addDays(weekDate, 2),
      notes: 'Groceries and food',
      createdBy,
    });

    docs.push({
      amount: 2200 + (i * 30),
      type: 'expense',
      category: 'Transport',
      date: addDays(weekDate, 4),
      notes: 'Travel and commute',
      createdBy,
    });

    if (weekDate.getDate() <= 7) {
      docs.push({
        amount: 28500,
        type: 'expense',
        category: 'Rent',
        date: addDays(weekDate, 0),
        notes: 'Monthly rent',
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
    console.log(`Created admin for transaction seed: ${adminEmail}`);
  }

  const docs = generateTransactions(admin._id, 28);
  const inserted = await Transaction.insertMany(docs);
  console.log(`Inserted demo transactions: ${inserted.length}`);

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

