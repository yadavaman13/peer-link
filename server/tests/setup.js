import { WorkerService } from '../src/services/mediasoup/index.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import redis from '../src/config/cache.config.js';

beforeAll(async () => {
  try {
    await WorkerService.init();
  } catch (err) {
    console.warn('WorkerService init warning:', err.message);
  }
});

beforeEach(async () => {
  try {
    if (redis && redis.status === 'ready') {
      const keys = await redis.keys('ratelimit:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  } catch (_) {
    // Ignore cache cleanup errors in testing
  }
});

afterAll(async () => {
  try {
    WorkerService.close();
    await disconnectDB();
    if (redis) {
      try {
        await redis.quit();
      } catch (_) {
        redis.disconnect();
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  } catch (_) {
    // Ignore teardown disconnect errors
  }
});
