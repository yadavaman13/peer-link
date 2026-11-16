import { MEDIA_CODECS } from '../../config/mediasoup.config.js';
import { logger } from '../../shared/logger.js';

export const RouterService = {
  async create(worker) {
    const router = await worker.createRouter({ mediaCodecs: MEDIA_CODECS });
    logger.info(`Router created [id:${router.id}]`);
    return router;
  },
};
