import * as mediasoup from 'mediasoup';
import { WORKER_SETTINGS } from '../../config/mediasoup.config.js';
import { logger } from '../../shared/logger.js';

let worker = null;

export const WorkerService = {
  async init() {
    worker = await mediasoup.createWorker(WORKER_SETTINGS);
    logger.info(`mediasoup Worker created [pid:${worker.pid}]`);

    worker.on('died', (error) => {
      logger.error('mediasoup Worker died — restarting process:', error);
      process.exit(1);
    });

    return worker;
  },

  get() {
    if (!worker) throw new Error('WorkerService not initialized — call init() first');
    return worker;
  },

  async getStats() {
    if (!worker) return null;
    const usage = await worker.getResourceUsage();
    return { pid: worker.pid, usage };
  },

  close() {
    if (worker) {
      worker.close();
      worker = null;
    }
  },
};
