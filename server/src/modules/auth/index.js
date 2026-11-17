export { default as authRoutes } from './routes/auth.route.js';
export { default as userRoutes } from './routes/user.route.js';
export * as authController from './controllers/auth.controller.js';
export * as userController from './controllers/user.controller.js';
export * as userService from './services/user.service.js';
export { protect, rateLimiter } from './middleware/auth.middleware.js';
