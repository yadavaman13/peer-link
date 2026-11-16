export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg) {
    return new AppError(msg, 400);
  }

  static notFound(msg) {
    return new AppError(msg, 404);
  }

  static forbidden(msg) {
    return new AppError(msg, 403);
  }

  static conflict(msg) {
    return new AppError(msg, 409);
  }
}
