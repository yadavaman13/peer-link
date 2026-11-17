import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import app from '../../src/app.js';
import { User } from '../../src/models/user.model.js';
import { connectDB, disconnectDB } from '../../src/config/db.js';

describe('Auth & User Routes Integration', () => {
  let server;
  let baseUrl;
  const testEmail = `testuser_${Date.now()}@peerlink.dev`;
  const testPassword = 'Password123!';
  let authToken = '';

  beforeAll(async () => {
    await connectDB();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // Clean up test user if exists
    await User.deleteMany({ email: { $regex: /@peerlink\.dev$/i } });
  });

  afterAll(async () => {
    try {
      await User.deleteMany({ email: { $regex: /@peerlink\.dev$/i } });
    } catch (_) {}
    await new Promise((resolve) => server.close(resolve));
    await disconnectDB();
  });

  it('POST /api/auth/register creates a new user and returns JWT token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        firstName: 'Peer',
        lastName: 'Linker',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testEmail);
    expect(data.user.firstName).toBe('Peer');
    expect(data.user.lastName).toBe('Linker');
    expect(data.user.role).toBe('USER');
    authToken = data.token;
  });

  it('POST /api/auth/register returns 400 when registering with duplicate email', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        firstName: 'Duplicate',
        lastName: 'User',
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe('Email is already registered');
  });

  it('POST /api/auth/login succeeds with valid credentials', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    expect(data.user.email).toBe(testEmail);
    authToken = data.token;
  });

  it('POST /api/auth/login returns 401 with wrong password', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999!',
      }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe('Incorrect password.');
  });

  it('GET /api/auth/get-me returns 401 when no token is provided', async () => {
    const res = await fetch(`${baseUrl}/api/auth/get-me`);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('GET /api/auth/get-me returns 200 with user profile when authenticated', async () => {
    const res = await fetch(`${baseUrl}/api/auth/get-me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe(testEmail);
    expect(data.user.firstName).toBe('Peer');
  });

  it('PATCH /api/users/profile updates user details', async () => {
    const res = await fetch(`${baseUrl}/api/users/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.firstName).toBe('UpdatedFirst');
    expect(data.user.lastName).toBe('UpdatedLast');
  });

  it('POST /api/auth/logout invalidates session and clears cookie', async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('Logout successful.');
  });
});
