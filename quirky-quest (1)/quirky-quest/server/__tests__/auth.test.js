const request = require('supertest');
const createApp = require('../app');

const app = createApp();

const validUser = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'supersecret123',
};

describe('Auth flow', () => {
  test('registers a new user and returns an access token', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(validUser.email);
    expect(res.body.user.passwordHash).toBeUndefined();
    // Refresh token should be set as an httpOnly cookie, not in the body.
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('rejects registration with a weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, password: 'short' });

    expect(res.status).toBe(400);
  });

  test('rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(409);
  });

  test('logs in with correct credentials and rejects wrong password', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const good = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    expect(good.status).toBe(200);
    expect(good.body.accessToken).toBeDefined();

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'wrong-password' });
    expect(bad.status).toBe(401);
  });

  test('protected route rejects requests with no token and accepts a valid one', async () => {
    const registerRes = await request(app).post('/api/auth/register').send(validUser);
    const { accessToken } = registerRes.body;

    const noAuth = await request(app).get('/api/users/me');
    expect(noAuth.status).toBe(401);

    const withAuth = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(withAuth.status).toBe(200);
    expect(withAuth.body.user.email).toBe(validUser.email);
  });

  test('refresh endpoint issues a new access token using the refresh cookie', async () => {
    const registerRes = await request(app).post('/api/auth/register').send(validUser);
    const cookies = registerRes.headers['set-cookie'];

    const refreshRes = await request(app).post('/api/auth/refresh').set('Cookie', cookies);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeDefined();
  });

  test('health endpoint responds ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
