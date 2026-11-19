import request from 'supertest';
import app from '../../src/app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { generateTestUserData, createAndLoginTestUser } from '../helpers/auth-helper.js';
import { connectDB, disconnectDB } from '../../src/config/db.js';
import { User } from '../../src/models/user.model.js';

const docLogger = new FeatureApiDocLogger(
  '01_auth_user.md',
  'Feature 01: Authentication & User Profile Management API',
  'Covers user registration, credential authentication, session validation, profile management, and logout.'
);

describe('01: Auth & User Profile Management API', () => {
  let primaryUser;
  let primaryToken;
  let primaryAuthHeader;
  let primaryCookie;
  const testPassword = 'Password123!';

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({ email: { $regex: /@auth-module\.peerlink\.dev$/i } });
  });

  afterAll(async () => {
    docLogger.save();
    try {
      await User.deleteMany({ email: { $regex: /@auth-module\.peerlink\.dev$/i } });
    } catch (_) {}
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user successfully (201 Created)', async () => {
      const payload = {
        email: `signup_${Date.now()}@auth-module.peerlink.dev`,
        password: testPassword,
        firstName: 'Peer',
        lastName: 'Linker',
      };

      const res = await request(app).post('/api/auth/register').send(payload);

      docLogger.record({
        scenario: 'Register New User (Success)',
        method: 'POST',
        endpoint: '/api/auth/register',
        requestBody: payload,
        statusCode: res.status,
        responseBody: res.body,
        notes:
          'Registers new user, hashes password, sets auth cookie and returns signed JWT token.',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(payload.email);
      expect(res.body.user.firstName).toBe('Peer');
      expect(res.body.user.lastName).toBe('Linker');

      primaryUser = res.body.user;
      primaryToken = res.body.token;
      primaryAuthHeader = `Bearer ${primaryToken}`;
      primaryCookie = `token=${primaryToken}`;
    });

    it('returns 400 when registering with duplicate email', async () => {
      const duplicatePayload = {
        email: primaryUser.email,
        password: testPassword,
        firstName: 'Duplicate',
        lastName: 'User',
      };

      const res = await request(app).post('/api/auth/register').send(duplicatePayload);

      docLogger.record({
        scenario: 'Register User (Duplicate Email)',
        method: 'POST',
        endpoint: '/api/auth/register',
        requestBody: duplicatePayload,
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Fails with 400 Bad Request when an email is already registered.',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already registered');
    });

    it('returns 400 when required fields are missing', async () => {
      const invalidPayload = {
        email: 'invalid-email-format',
        password: 'short',
      };

      const res = await request(app).post('/api/auth/register').send(invalidPayload);

      docLogger.record({
        scenario: 'Register User (Validation Failure)',
        method: 'POST',
        endpoint: '/api/auth/register',
        requestBody: invalidPayload,
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Fails with 400 Bad Request when validation constraints are not met.',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('authenticates user with valid credentials (200 OK)', async () => {
      const loginPayload = {
        email: primaryUser.email,
        password: testPassword,
      };

      const res = await request(app).post('/api/auth/login').send(loginPayload);

      docLogger.record({
        scenario: 'Login with Valid Credentials (Success)',
        method: 'POST',
        endpoint: '/api/auth/login',
        requestBody: loginPayload,
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Authenticates user, issues JWT session cookie and returns token with user payload.',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(primaryUser.email);
    });

    it('returns 401 when password does not match', async () => {
      const wrongPasswordPayload = {
        email: primaryUser.email,
        password: 'IncorrectPassword999!',
      };

      const res = await request(app).post('/api/auth/login').send(wrongPasswordPayload);

      docLogger.record({
        scenario: 'Login with Invalid Password (Unauthorized)',
        method: 'POST',
        endpoint: '/api/auth/login',
        requestBody: wrongPasswordPayload,
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Returns 401 Unauthorized when password does not match.',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 when email is not registered', async () => {
      const nonExistentPayload = {
        email: 'unknown_peerlink_user@peerlink.dev',
        password: 'Password123!',
      };

      const res = await request(app).post('/api/auth/login').send(nonExistentPayload);

      docLogger.record({
        scenario: 'Login with Non-existent Email (Unauthorized)',
        method: 'POST',
        endpoint: '/api/auth/login',
        requestBody: nonExistentPayload,
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Returns 401 Unauthorized when user record is not found.',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/get-me', () => {
    it('returns 401 when accessed without authentication', async () => {
      const res = await request(app).get('/api/auth/get-me');

      docLogger.record({
        scenario: 'Get Auth Profile Unauthenticated (401)',
        method: 'GET',
        endpoint: '/api/auth/get-me',
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Protected route returns 401 when session token is missing.',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 with authenticated user profile using Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/get-me')
        .set('Authorization', primaryAuthHeader);

      docLogger.record({
        scenario: 'Get Auth Profile with Bearer Token (Success)',
        method: 'GET',
        endpoint: '/api/auth/get-me',
        headers: { Authorization: 'Bearer {{token}}' },
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Returns authenticated user profile details.',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(primaryUser.email);
    });
  });

  describe('GET /api/users/get-me', () => {
    it('returns 401 when accessed without authentication', async () => {
      const res = await request(app).get('/api/users/get-me');

      docLogger.record({
        scenario: 'Get User Me Unauthenticated (401)',
        method: 'GET',
        endpoint: '/api/users/get-me',
        statusCode: res.status,
        responseBody: res.body,
        notes: 'User profile route requires authentication.',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 with user profile when authenticated via cookie', async () => {
      const res = await request(app).get('/api/users/get-me').set('Cookie', primaryCookie);

      docLogger.record({
        scenario: 'Get User Profile with Cookie (Success)',
        method: 'GET',
        endpoint: '/api/users/get-me',
        headers: { Cookie: 'token={{token}}' },
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Retrieves user profile through cookie session authentication.',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(primaryUser.email);
    });
  });

  describe('PATCH /api/users/profile', () => {
    it('updates user profile information when authenticated', async () => {
      const updatePayload = {
        firstName: 'UpdatedPeer',
        lastName: 'UpdatedLinker',
      };

      const res = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', primaryAuthHeader)
        .send(updatePayload);

      docLogger.record({
        scenario: 'Update User Profile (Success)',
        method: 'PATCH',
        endpoint: '/api/users/profile',
        headers: { Authorization: 'Bearer {{token}}' },
        requestBody: updatePayload,
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Updates user profile details and flushes relevant cache.',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.firstName).toBe('UpdatedPeer');
      expect(res.body.user.lastName).toBe('UpdatedLinker');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('invalidates session and clears cookie (200 OK)', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', primaryAuthHeader)
        .set('Cookie', primaryCookie);

      docLogger.record({
        scenario: 'Logout User Session (Success)',
        method: 'POST',
        endpoint: '/api/auth/logout',
        headers: {
          Authorization: 'Bearer {{token}}',
          Cookie: 'token={{token}}',
        },
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Blacklists token in Redis and clears HTTP session cookie.',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
