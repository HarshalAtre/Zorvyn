const { expect } = require('chai');
const request = require('supertest');

describe('=== Rate Limit Suite ===', () => {
  it('returns 429 after exceeding rate limit on /api routes', async () => {
    const previousLimit = process.env.RATE_LIMIT_MAX;
    process.env.RATE_LIMIT_MAX = '2';

    delete require.cache[require.resolve('../app')];
    const app = require('../app');

    const first = await request(app).get('/api/non-existent-route');
    const second = await request(app).get('/api/non-existent-route');
    const third = await request(app).get('/api/non-existent-route');

    expect(first.status).to.equal(404);
    expect(second.status).to.equal(404);
    expect(third.status).to.equal(429);
    expect(third.body.success).to.equal(false);

    if (previousLimit === undefined) {
      delete process.env.RATE_LIMIT_MAX;
    } else {
      process.env.RATE_LIMIT_MAX = previousLimit;
    }

    delete require.cache[require.resolve('../app')];
  });
});
