import { beforeAll, afterAll } from 'vitest';
import { WorkerService } from '../src/services/mediasoup/index.js';

beforeAll(async () => {
  await WorkerService.init();
});

afterAll(() => {
  WorkerService.close();
});
