import { ENV } from './env.config.js';

export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || ENV.CLIENT_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
};
