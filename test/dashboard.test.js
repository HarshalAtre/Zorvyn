process.env.JWT_SECRET = 'test_secret';
process.env.JWT_EXPIRES_IN = '1d';

const { expect } = require('chai');
const request = require('supertest');
const app = require('../app');
const { connect, disconnect, clearCollections } = require('./helpers/setup');
const User = require('../src/models/User');
const Transaction = require('../src/models/Transaction');

describe('=== Dashboard Suite ===', () => {
  before(async () => { await connect(); });
  after(async () => { await disconnect(); });
  afterEach(async () => { await clearCollections(); });

  const getToken = async (role = 'viewer') => {
    const email = `${role}@test.com`;
    const user = await User.create({ name: role, email, password: 'secret123', role });
    const res = await request(app).post('/api/auth/login').send({ email, password: 'secret123' });
    return { token: res.body.data.token, userId: user._id };
  };

  const seedTransactions = async (userId) => {
    await Transaction.create([
      { amount: 3000, type: 'income', category: 'Salary', date: new Date('2024-03-01'), createdBy: userId },
      { amount: 1000, type: 'income', category: 'Freelance', date: new Date('2024-03-15'), createdBy: userId },
      { amount: 500, type: 'expense', category: 'Food', date: new Date('2024-03-10'), createdBy: userId },
      { amount: 200, type: 'expense', category: 'Food', date: new Date('2024-03-20'), createdBy: userId },
      { amount: 800, type: 'expense', category: 'Rent', date: new Date('2024-03-05'), createdBy: userId },
    ]);
  };

  describe('Dashboard - Access Control', () => {
    it('unauthenticated request returns 401', async () => {
      const res = await request(app).get('/api/dashboard/summary');
      expect(res.status).to.equal(401);
    });

    it('viewer can access /summary', async () => {
      const { token } = await getToken('viewer');
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).to.equal(200);
    });

    it('viewer can access /recent', async () => {
      const { token } = await getToken('viewer');
      const res = await request(app)
        .get('/api/dashboard/recent')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).to.equal(200);
    });

    it('viewer cannot access /by-category (403)', async () => {
      const { token } = await getToken('viewer');
      const res = await request(app)
        .get('/api/dashboard/by-category')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).to.equal(403);
    });

    it('viewer cannot access /trends (403)', async () => {
      const { token } = await getToken('viewer');
      const res = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).to.equal(403);
    });

    it('analyst can access /by-category', async () => {
      const { token } = await getToken('analyst');
      const res = await request(app)
        .get('/api/dashboard/by-category')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).to.equal(200);
    });
  });

  describe('Dashboard - Summary', () => {
    let token;
    let userId;

    beforeEach(async () => {
      ({ token, userId } = await getToken('admin'));
      await seedTransactions(userId);
    });

    it('returns correct totals and net balance', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.summary.totalIncome).to.equal(4000);
      expect(res.body.data.summary.totalExpenses).to.equal(1500);
      expect(res.body.data.summary.netBalance).to.equal(2500);
    });

    it('excludes soft-deleted records from summary', async () => {
      await Transaction.findOneAndUpdate({ type: 'income', amount: 1000 }, { isDeleted: true });

      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.data.summary.totalIncome).to.equal(3000);
      expect(res.body.data.summary.netBalance).to.equal(1500);
    });
  });

  describe('Dashboard - By Category', () => {
    let token;

    beforeEach(async () => {
      ({ token } = await getToken('analyst'));
      const admin = await User.create({ name: 'admin', email: 'admin@test.com', password: 'secret123', role: 'admin' });
      await seedTransactions(admin._id);
    });

    it('returns category breakdown', async () => {
      const res = await request(app)
        .get('/api/dashboard/by-category')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.data.categories).to.be.an('array');

      const foodExpense = res.body.data.categories.find(
        (c) => c.category === 'Food' && c.type === 'expense'
      );
      expect(foodExpense).to.exist;
      expect(foodExpense.total).to.equal(700);
      expect(foodExpense.count).to.equal(2);
    });
  });

  describe('Dashboard - Trends', () => {
    let token;

    beforeEach(async () => {
      ({ token } = await getToken('analyst'));
      const admin = await User.create({ name: 'admin', email: 'admin@test.com', password: 'secret123', role: 'admin' });
      await seedTransactions(admin._id);
    });

    it('returns monthly trends by default', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.data.period).to.equal('monthly');
      expect(res.body.data.trends).to.be.an('array');
      if (res.body.data.trends.length > 0) {
        expect(res.body.data.trends[0]).to.have.property('year');
        expect(res.body.data.trends[0]).to.have.property('month');
      }
    });

    it('returns weekly trends when period=weekly', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends?period=weekly')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.data.period).to.equal('weekly');
      expect(res.body.data.trends).to.be.an('array');
      if (res.body.data.trends.length > 0) {
        expect(res.body.data.trends[0]).to.have.property('year');
        expect(res.body.data.trends[0]).to.have.property('week');
      }
    });

    it('rejects invalid period', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends?period=daily')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(400);
      expect(res.body.success).to.equal(false);
    });
  });

  describe('Dashboard - Recent', () => {
    let token;

    beforeEach(async () => {
      ({ token } = await getToken('viewer'));
      const admin = await User.create({ name: 'admin', email: 'admin@test.com', password: 'secret123', role: 'admin' });
      await seedTransactions(admin._id);
    });

    it('returns recent transactions sorted by date desc', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.data.transactions).to.have.length(5);

      const dates = res.body.data.transactions.map((t) => new Date(t.date).getTime());
      for (let i = 1; i < dates.length; i += 1) {
        expect(dates[i - 1]).to.be.gte(dates[i]);
      }
    });

    it('respects limit query param', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent?limit=2')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.data.transactions).to.have.length(2);
    });

    it('rejects invalid limit query param', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent?limit=0')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(400);
      expect(res.body.success).to.equal(false);
    });
  });
});
