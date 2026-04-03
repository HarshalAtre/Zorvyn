require('dotenv').config();
const connect = require('./config/db');
const User = require('./models/User');

const seed = async () => {
  await connect();

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`Admin already exists: ${email}`);
    process.exit(0);
  }

  await User.create({
    name: process.env.SEED_ADMIN_NAME || 'Admin',
    email,
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@1234',
    role: 'admin',
  });

  console.log(`Admin user created: ${email}`);
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
