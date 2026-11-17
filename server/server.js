import http from 'http';
import app from './src/app.js';
import { ENV } from './src/config/env.config.js';
import { WorkerService } from './src/services/mediasoup/index.js';
import { attachWebSocketServer, getWSS } from './src/signaling/ws.server.js';
import { logger } from './src/shared/logger.js';

const httpServer = http.createServer(app);

async function start() {
  // 1. Initialize mediasoup Worker
  await WorkerService.init();

  // 2. Attach WebSocket signaling server
  attachWebSocketServer(httpServer);

  // 3. Start HTTP server
  httpServer.listen(ENV.PORT, () => {
    logger.info(`Server running on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
    logger.info(`WebSocket ready at ws://localhost:${ENV.PORT}`);
  });
}

// ─── Graceful shutdown ───
function shutdown(signal) {
  logger.warn(`${signal} received - shutting down gracefully`);

  const wss = getWSS();
  if (wss) {
    wss.clients.forEach((ws) => ws.terminate());
  }

  httpServer.close(() => {
    logger.info('HTTP server closed');
    WorkerService.close();
    logger.info('mediasoup Worker closed');
    process.exit(0);
  });

  // Force kill after 10s if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
  process.exit(1);
});

start().catch((err) => {
  logger.error('Fatal startup error:', err);
  process.exit(1);
});

export { httpServer };
