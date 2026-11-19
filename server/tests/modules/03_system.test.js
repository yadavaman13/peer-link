import request from 'supertest';
import app from '../../src/app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';

const docLogger = new FeatureApiDocLogger(
  '03_system.md',
  'Feature 03: System Health & Diagnostics API',
  'Covers server health status, mediasoup worker metrics, and 404 handling.'
);

describe('03: System Health API Tests', () => {
  afterAll(async () => {
    docLogger.save();
  });

  describe('GET /api/system/health', () => {
    it('returns 200 OK with server health, uptime, and worker stats', async () => {
      const res = await request(app).get('/api/system/health');

      docLogger.record({
        scenario: 'System Health Check (Success)',
        method: 'GET',
        endpoint: '/api/system/health',
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Public monitoring endpoint used by load balancers and orchestrators.',
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(typeof res.body.uptime).toBe('number');
      expect(typeof res.body.activeRooms).toBe('number');
      expect(res.body.worker).toBeDefined();
      expect(res.body.worker.pid).toBeDefined();
    });
  });

  describe('GET /api/non-existent', () => {
    it('returns 404 error when accessing undefined route', async () => {
      const res = await request(app).get('/api/non-existent-endpoint');

      docLogger.record({
        scenario: 'Not Found Route Handler (404)',
        method: 'GET',
        endpoint: '/api/non-existent-endpoint',
        statusCode: res.status,
        responseBody: res.body,
        notes: 'Standard 404 handler for unrecognized endpoints.',
      });

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
    });
  });
});
