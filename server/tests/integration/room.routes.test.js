import request from 'supertest';
import app from '../../src/app.js';
import { RoomService } from '../../src/services/room.service.js';
import { connectDB } from '../../src/config/db.js';
import { User } from '../../src/models/user.model.js';
import { createAndLoginTestUser } from '../helpers/auth-helper.js';

describe('Room Routes Integration', () => {
  let authUser;

  beforeAll(async () => {
    await connectDB();
    authUser = await createAndLoginTestUser({
      email: `room_int_${Date.now()}@room-int.peerlink.dev`,
    });
  });

  afterAll(async () => {
    RoomService.clearAll();
    try {
      await User.deleteMany({ email: { $regex: /@room-int\.peerlink\.dev$/i } });
    } catch (_) {}
  });

  it('POST /api/rooms returns 401 when unauthenticated', async () => {
    const res = await request(app).post('/api/rooms').send({});

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/rooms returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/rooms');
    expect(res.status).toBe(401);
  });

  it('GET /api/rooms/:id returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/rooms/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(401);
  });

  it('POST /api/rooms creates a new room with authentication', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', authUser.authHeader)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.roomId).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.createdBy).toBe(authUser.user._id.toString());
  });

  it('GET /api/rooms lists all created rooms with authentication', async () => {
    const res = await request(app).get('/api/rooms').set('Authorization', authUser.authHeader);

    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.rooms)).toBe(true);
  });

  it('GET /api/rooms/:id gets room details with authentication', async () => {
    const created = await RoomService.create({ createdBy: authUser.user._id.toString() });

    const res = await request(app)
      .get(`/api/rooms/${created.id}`)
      .set('Authorization', authUser.authHeader);

    expect(res.status).toBe(200);
    expect(res.body.roomId).toBe(created.id);
    expect(res.body.participants).toBe(0);
    expect(res.body.createdBy).toBe(authUser.user._id.toString());
  });

  it('GET /api/rooms/:id returns 404 for valid UUID but non-existent room', async () => {
    const randomUuid = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`/api/rooms/${randomUuid}`)
      .set('Authorization', authUser.authHeader);

    expect(res.status).toBe(404);
  });

  it('GET /api/rooms/:id returns 400 for invalid UUID', async () => {
    const res = await request(app)
      .get('/api/rooms/invalid-id')
      .set('Authorization', authUser.authHeader);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });
});
