process.env.JWT_SECRET = 'test_secret';
process.env.JWT_EXPIRES_IN = '1d';

const { expect } = require('chai');
const request = require('supertest');
const app = require('../app');
const { connect, disconnect, clearCollections } = require('./helpers/setup');
const User = require('../src/models/User');

describe('=== User Suite ===', () => {
  before(async () => { await connect(); });
  after(async () => { await disconnect(); });
  afterEach(async () => { await clearCollections(); });

  const createAndLogin = async (role, email) => {
    await User.create({
      name: role,
      email,
      password: 'secret123',
      role,
    });
    const res = await request(app).post('/api/auth/login').send({
      email,
      password: 'secret123',
    });
    return res.body.data.token;
  };

  describe('Users - Access Control', () => {
    it('viewer cannot access user management endpoints', async () => {
      const token = await createAndLogin('viewer', 'viewer@test.com');
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(403);
    });

    it('admin can list users', async () => {
      const token = await createAndLogin('admin', 'admin@test.com');
      await User.create({ name: 'analyst', email: 'analyst@test.com', password: 'secret123', role: 'analyst' });

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.users).to.have.length(2);
    });
  });

  describe('Users - Role and Status Management', () => {
    it('admin can update another user role', async () => {
      const adminToken = await createAndLogin('admin', 'admin@test.com');
      const viewer = await User.create({ name: 'viewer', email: 'viewer@test.com', password: 'secret123', role: 'viewer' });

      const res = await request(app)
        .patch(`/api/users/${viewer._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'analyst' });

      expect(res.status).to.equal(200);
      expect(res.body.data.user.role).to.equal('analyst');
    });

    it('admin cannot demote themselves', async () => {
      const adminToken = await createAndLogin('admin', 'admin@test.com');
      const admin = await User.findOne({ email: 'admin@test.com' });

      const res = await request(app)
        .patch(`/api/users/${admin._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'viewer' });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.include('cannot change your own role');
    });

    it('admin cannot deactivate themselves', async () => {
      const adminToken = await createAndLogin('admin', 'admin@test.com');
      const admin = await User.findOne({ email: 'admin@test.com' });

      const res = await request(app)
        .patch(`/api/users/${admin._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.include('cannot deactivate your own account');
    });
  });

  describe('Users - ID Validation', () => {
    it('returns 400 for invalid id format', async () => {
      const adminToken = await createAndLogin('admin', 'admin@test.com');
      const res = await request(app)
        .get('/api/users/not-a-valid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(400);
    });
  });
});
