import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { corsOptions } from './config/cors.config.js';
import { securityMiddleware } from './middlewares/security.middleware.js';
import { notFoundHandler } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

// Module route imports
import { systemRoutes } from './modules/system/index.js';
import { roomRoutes } from './modules/room/index.js';

const app = express();

// ─── Cross-cutting middleware ───
app.use(securityMiddleware);
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());

// ─── Route mountings ───
app.use('/api/system', systemRoutes);
app.use('/api/rooms', roomRoutes);

// ─── Error handling (must be last) ───
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
