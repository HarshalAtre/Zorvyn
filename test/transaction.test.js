process.env.JWT_SECRET = 'test_secret';
process.env.JWT_EXPIRES_IN = '1d';

const { expect } = require('chai');
const request = require('supertest');
const app = require('../app');
const { connect, disconnect, clearCollections } = require('./helpers/setup');
const User = require('../src/models/User');

describe('=== Transaction Suite ===', () => {

before(async () => { await connect(); });
after(async () => { await disconnect(); });
afterEach(async () => { await clearCollections(); });

// Helper — register + login, return token
const getToken = async (role = 'viewer') => {
  const email = `${role}@test.com`;
  const user = await User.create({ name: role, email, password: 'secret123', role });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'secret123' });
  return { token: res.body.data.token, userId: user._id };
};

// Helper — create a transaction as admin
const createTx = async (adminToken, overrides = {}) => {
  const payload = {
    amount: 500,
    type: 'income',
    category: 'Salary',
    date: '2024-01-15',
    ...overrides,
  };
  return request(app)
    .post('/api/transactions')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(payload);
};

describe('Transactions — Access Control', () => {
  it('viewer cannot create a transaction (403)', async () => {
    const { token } = await getToken('viewer');
    const res = await createTx(token);
    expect(res.status).to.equal(403);
  });

  it('analyst cannot create a transaction (403)', async () => {
    const { token } = await getToken('analyst');
    const res = await createTx(token);
    expect(res.status).to.equal(403);
  });

  it('viewer cannot list transactions (403)', async () => {
    const { token } = await getToken('viewer');
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(403);
  });

  it('unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).to.equal(401);
  });
});

describe('Transactions — CRUD (admin)', () => {
  let adminToken;

  beforeEach(async () => {
    const { token } = await getToken('admin');
    adminToken = token;
  });

  it('creates a transaction successfully', async () => {
    const res = await createTx(adminToken);
    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.transaction).to.include({ amount: 500, type: 'income', category: 'Salary' });
  });

  it('rejects invalid amount (negative)', async () => {
    const res = await createTx(adminToken, { amount: -100 });
    expect(res.status).to.equal(400);
  });

  it('rejects invalid type', async () => {
    const res = await createTx(adminToken, { type: 'transfer' });
    expect(res.status).to.equal(400);
  });

  it('lists transactions with pagination', async () => {
    await createTx(adminToken);
    await createTx(adminToken, { amount: 200, type: 'expense', category: 'Food' });

    const res = await request(app)
      .get('/api/transactions?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.transactions).to.have.length(2);
    expect(res.body.data).to.have.property('total', 2);
  });

  it('filters by type', async () => {
    await createTx(adminToken, { type: 'income' });
    await createTx(adminToken, { amount: 200, type: 'expense', category: 'Food' });

    const res = await request(app)
      .get('/api/transactions?type=expense')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).to.equal(200);
    expect(res.body.data.transactions).to.have.length(1);
    expect(res.body.data.transactions[0].type).to.equal('expense');
  });

  it('filters by category (case-insensitive)', async () => {
    await createTx(adminToken, { category: 'Salary' });
    await createTx(adminToken, { amount: 100, type: 'expense', category: 'Food' });

    const res = await request(app)
      .get('/api/transactions?category=salary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).to.equal(200);
    expect(res.body.data.transactions).to.have.length(1);
  });

  it('rejects invalid page query param', async () => {
    await createTx(adminToken);
    const res = await request(app)
      .get('/api/transactions?page=0')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });

  it('rejects invalid date range query params', async () => {
    await createTx(adminToken);
    const res = await request(app)
      .get('/api/transactions?startDate=2024-12-01&endDate=2024-01-01')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });

  it('updates a transaction', async () => {
    const created = await createTx(adminToken);
    const txId = created.body.data.transaction._id;

    const res = await request(app)
      .put(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 999, notes: 'Updated' });

    expect(res.status).to.equal(200);
    expect(res.body.data.transaction.amount).to.equal(999);
    expect(res.body.data.transaction.notes).to.equal('Updated');
  });

  it('rejects update with no fields', async () => {
    const created = await createTx(adminToken);
    const txId = created.body.data.transaction._id;

    const res = await request(app)
      .put(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).to.equal(400);
  });

  it('soft-deletes a transaction (hidden from list)', async () => {
    const created = await createTx(adminToken);
    const txId = created.body.data.transaction._id;

    await request(app)
      .delete(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body.data.transactions).to.have.length(0);
  });

  it('returns 404 for non-existent transaction', async () => {
    const res = await request(app)
      .get('/api/transactions/64f000000000000000000000')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(404);
  });

  it('returns 400 for invalid transaction id format', async () => {
    const res = await request(app)
      .get('/api/transactions/not-a-valid-id')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(400);
  });
});

describe('Transactions — Analyst read access', () => {
  let adminToken, analystToken;

  beforeEach(async () => {
    const admin = await getToken('admin');
    adminToken = admin.token;
    const analyst = await getToken('analyst');
    analystToken = analyst.token;
    await createTx(adminToken);
  });

  it('analyst can list transactions', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.data.transactions).to.have.length(1);
  });

  it('analyst cannot delete a transaction', async () => {
    const list = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${analystToken}`);
    const txId = list.body.data.transactions[0]._id;

    const res = await request(app)
      .delete(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).to.equal(403);
  });
});

}); // end Transaction Suite
