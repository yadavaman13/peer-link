import { logger } from '../shared/logger.js';
import { ENV } from '../config/env.config.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  logger.error(`[${req.method} ${req.path}]`, err.message);

  res.status(statusCode).json({
    status: 'error',
    message: err.isOperational ? err.message : 'Internal server error',
    ...(ENV.isDev && { stack: err.stack }),
  });
}
