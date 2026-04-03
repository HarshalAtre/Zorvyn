process.env.JWT_SECRET = 'test_secret';
process.env.JWT_EXPIRES_IN = '1d';

const { expect } = require('chai');
const request = require('supertest');
const app = require('../app');
const { connect, disconnect, clearCollections } = require('./helpers/setup');
const User = require('../src/models/User');

describe('=== Auth Suite ===', () => {

before(async () => { await connect(); });
after(async () => { await disconnect(); });
afterEach(async () => { await clearCollections(); });

describe('Auth — POST /api/auth/register', () => {
  it('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'secret123',
    });
    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.have.property('token');
    expect(res.body.data.user.role).to.equal('analyst');
    expect(res.body.data.user).to.not.have.property('password');
  });

  it('rejects duplicate email with 409', async () => {
    await User.create({ name: 'Alice', email: 'alice@test.com', password: 'secret123' });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice2',
      email: 'alice@test.com',
      password: 'secret123',
    });
    expect(res.status).to.equal(409);
  });

  it('rejects missing fields with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@x.com' });
    expect(res.status).to.equal(400);
  });

  it('rejects short password with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bob',
      email: 'bob@test.com',
      password: '123',
    });
    expect(res.status).to.equal(400);
  });
});

describe('Auth — POST /api/auth/login', () => {
  beforeEach(async () => {
    await User.create({ name: 'Alice', email: 'alice@test.com', password: 'secret123' });
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@test.com',
      password: 'secret123',
    });
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.have.property('token');
  });

  it('rejects wrong password with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@test.com',
      password: 'wrongpassword',
    });
    expect(res.status).to.equal(401);
  });

  it('rejects unknown email with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@test.com',
      password: 'secret123',
    });
    expect(res.status).to.equal(401);
  });
});

describe('Auth — GET /api/auth/me', () => {
  let token;

  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'secret123',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@test.com',
      password: 'secret123',
    });
    token = res.body.data.token;
  });

  it('returns current user when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.user.email).to.equal('alice@test.com');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).to.equal(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).to.equal(401);
  });
});

}); // end Auth Suite
