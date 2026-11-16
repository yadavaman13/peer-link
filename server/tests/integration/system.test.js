import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import app from '../../src/app.js';

describe('System Routes Integration', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('GET /api/system/health returns 200 with status ok and worker info', async () => {
    const res = await fetch(`${baseUrl}/api/system/health`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(typeof data.uptime).toBe('number');
    expect(typeof data.activeRooms).toBe('number');
    expect(data.worker).toBeDefined();
    expect(data.worker.pid).toBeDefined();
  });

  it('returns 404 for non-existent endpoint', async () => {
    const res = await fetch(`${baseUrl}/api/non-existent`);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.status).toBe('error');
  });
});
