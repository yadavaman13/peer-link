import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/user.model.js';
import { connectDB } from '../../src/config/db.js';

describe('Auth & User Routes Integration', () => {
  const testEmail = `testuser_${Date.now()}@auth-int.peerlink.dev`;
  const testPassword = 'Password123!';
  let authToken = '';

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({ email: { $regex: /@auth-int\.peerlink\.dev$/i } });
  });

  afterAll(async () => {
    try {
      await User.deleteMany({ email: { $regex: /@auth-int\.peerlink\.dev$/i } });
    } catch (_) {}
  });

  it('POST /api/auth/register creates a new user and returns JWT token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: testEmail,
      password: testPassword,
      firstName: 'Peer',
      lastName: 'Linker',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.firstName).toBe('Peer');
    expect(res.body.user.lastName).toBe('Linker');
    expect(res.body.user.role).toBe('USER');
    authToken = res.body.token;
  });

  it('POST /api/auth/register returns 400 when registering with duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: testEmail,
      password: testPassword,
      firstName: 'Duplicate',
      lastName: 'User',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Email is already registered');
  });

  it('POST /api/auth/login succeeds with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    authToken = res.body.token;
  });

  it('POST /api/auth/login returns 401 with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'WrongPassword999!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Incorrect password.');
  });

  it('GET /api/auth/get-me returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/auth/get-me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/get-me returns 200 with user profile when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/get-me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.firstName).toBe('Peer');
  });

  it('PATCH /api/users/profile updates user details', async () => {
    const res = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.firstName).toBe('UpdatedFirst');
    expect(res.body.user.lastName).toBe('UpdatedLast');
  });

  it('POST /api/auth/logout invalidates session and clears cookie', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Logout successful.');
  });
});
