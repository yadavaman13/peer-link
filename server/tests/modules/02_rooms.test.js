import request from 'supertest';
import app from '../../src/app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { createAndLoginTestUser } from '../helpers/auth-helper.js';
import { RoomService } from '../../src/services/room.service.js';
import { connectDB, disconnectDB } from '../../src/config/db.js';
import { User } from '../../src/models/user.model.js';

const docLogger = new FeatureApiDocLogger(
  '02_rooms.md',
  'Feature 02: Room & Video Session Management API',
  'Covers room creation, listing, retrieval, participant tracking, and authorization protection.'
);

describe('02: Room Management API Tests', () => {
  let authUser;
  let createdRoomId;

  beforeAll(async () => {
    await connectDB();
    authUser = await createAndLoginTestUser({
      prefix: 'room_suite',
      email: `room_suite_${Date.now()}@room-module.peerlink.dev`,
    });
  });

  afterAll(async () => {
    docLogger.save();
    RoomService.clearAll();
    try {
      await User.deleteMany({ email: { $regex: /@room-module\.peerlink\.dev$/i } });
    } catch (_) {}
  });

  describe('Authentication Enforcement on Rooms', () => {
    it('POST /api/rooms returns 401 when unauthenticated', async () => {
      const res = await request(app).post('/api/rooms').send({});

      docLogger.record({
        scenario: 'Create Room Without Auth (Rejected)',
        method: 'POST',
        endpoint: '/api/rooms',
        requestBody: {},
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Enforces auth requirement: room features are inaccessible without logging in.',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/rooms returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/rooms');

      docLogger.record({
        scenario: 'List Rooms Without Auth (Rejected)',
        method: 'GET',
        endpoint: '/api/rooms',
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Protected endpoint prevents anonymous users from viewing active rooms.',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/rooms/:id returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/rooms/00000000-0000-0000-0000-000000000000');

      docLogger.record({
        scenario: 'Get Room Details Without Auth (Rejected)',
        method: 'GET',
        endpoint: '/api/rooms/00000000-0000-0000-0000-000000000000',
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Room access requires valid JWT authentication.',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/rooms (Authenticated)', () => {
    it('creates a new room with mediasoup router (201 Created)', async () => {
      const payload = { maxParticipants: 6 };

      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', authUser.authHeader)
        .send(payload);

      docLogger.record({
        scenario: 'Create WebRTC Room (Authenticated)',
        method: 'POST',
        endpoint: '/api/rooms',
        headers: { Authorization: 'Bearer {{token}}' },
        requestBody: payload,
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Creates room with dedicated mediasoup router and binds creator user ID.',
      });

      expect(res.status).toBe(201);
      expect(res.body.roomId).toBeDefined();
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.createdBy).toBe(authUser.user._id.toString());
      createdRoomId = res.body.roomId;
    });
  });

  describe('GET /api/rooms (Authenticated)', () => {
    it('lists all active rooms for authenticated users (200 OK)', async () => {
      const res = await request(app).get('/api/rooms').set('Authorization', authUser.authHeader);

      docLogger.record({
        scenario: 'List Active Rooms (Authenticated)',
        method: 'GET',
        endpoint: '/api/rooms',
        headers: { Authorization: 'Bearer {{token}}' },
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Returns count and list of active WebRTC rooms with participant metrics.',
      });

      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.rooms)).toBe(true);
    });
  });

  describe('GET /api/rooms/:id (Authenticated)', () => {
    it('retrieves room details for an existing room (200 OK)', async () => {
      const res = await request(app)
        .get(`/api/rooms/${createdRoomId}`)
        .set('Authorization', authUser.authHeader);

      docLogger.record({
        scenario: 'Get Room Details (Success)',
        method: 'GET',
        endpoint: `/api/rooms/${createdRoomId}`,
        headers: { Authorization: 'Bearer {{token}}' },
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Retrieves room status, participant count, and creation timestamp.',
      });

      expect(res.status).toBe(200);
      expect(res.body.roomId).toBe(createdRoomId);
      expect(res.body.participants).toBe(0);
      expect(res.body.createdBy).toBe(authUser.user._id.toString());
    });

    it('returns 404 when room UUID does not exist', async () => {
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/rooms/${nonExistentUuid}`)
        .set('Authorization', authUser.authHeader);

      docLogger.record({
        scenario: 'Get Room (Non-existent Room 404)',
        method: 'GET',
        endpoint: `/api/rooms/${nonExistentUuid}`,
        headers: { Authorization: 'Bearer {{token}}' },
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Returns 404 when requested room UUID is not currently active.',
      });

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
    });

    it('returns 400 when room ID is not a valid UUID', async () => {
      const invalidId = 'not-a-valid-uuid';
      const res = await request(app)
        .get(`/api/rooms/${invalidId}`)
        .set('Authorization', authUser.authHeader);

      docLogger.record({
        scenario: 'Get Room (Invalid UUID Format 400)',
        method: 'GET',
        endpoint: `/api/rooms/${invalidId}`,
        headers: { Authorization: 'Bearer {{token}}' },
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Input validator rejects malformed room IDs before service processing.',
      });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });
});
