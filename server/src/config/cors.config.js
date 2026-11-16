import envConfig from './env.config.js';

export const corsOptions = {
  origin: (origin, callback) => {
    if (envConfig.isAllowedClientOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
};
