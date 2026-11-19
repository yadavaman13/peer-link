import request from 'supertest';
import app from '../../src/app.js';

describe('System Routes Integration', () => {
  it('GET /api/system/health returns 200 with status ok and worker info', async () => {
    const res = await request(app).get('/api/system/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
    expect(typeof res.body.activeRooms).toBe('number');
    expect(res.body.worker).toBeDefined();
    expect(res.body.worker.pid).toBeDefined();
  });

  it('returns 404 for non-existent endpoint', async () => {
    const res = await request(app).get('/api/non-existent');
    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});
