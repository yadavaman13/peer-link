import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import app from '../../src/app.js';
import { RoomService } from '../../src/services/room.service.js';

describe('Room Routes Integration', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    RoomService.clearAll();
    await new Promise((resolve) => server.close(resolve));
  });

  it('POST /api/rooms creates a new room', async () => {
    const res = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.roomId).toBeDefined();
    expect(data.createdAt).toBeDefined();
  });

  it('GET /api/rooms lists all created rooms', async () => {
    const res = await fetch(`${baseUrl}/api/rooms`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.count).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(data.rooms)).toBe(true);
  });

  it('GET /api/rooms/:id gets room details', async () => {
    const created = await RoomService.create();

    const res = await fetch(`${baseUrl}/api/rooms/${created.id}`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.roomId).toBe(created.id);
    expect(data.participants).toBe(0);
  });

  it('GET /api/rooms/:id returns 404 for valid UUID but non-existent room', async () => {
    const randomUuid = '00000000-0000-0000-0000-000000000000';
    const res = await fetch(`${baseUrl}/api/rooms/${randomUuid}`);
    expect(res.status).toBe(404);
  });

  it('GET /api/rooms/:id returns 400 for invalid UUID', async () => {
    const res = await fetch(`${baseUrl}/api/rooms/invalid-id`);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.status).toBe('error');
  });
});
