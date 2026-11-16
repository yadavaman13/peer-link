import { AppError } from '../shared/AppError.js';

export function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.path}`));
}
