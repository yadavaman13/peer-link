import Redis from 'ioredis';
import envConfig from './env.config.js';

const redis = new Redis({
  host: envConfig.REDIS_HOST,
  port: Number(envConfig.REDIS_PORT),
  password: envConfig.REDIS_PASSWORD || undefined,

  connectTimeout: 5000,
  lazyConnect: true,

  retryStrategy(times) {
    const maxRetries = envConfig.IS_PRODUCTION ? 10 : 2;
    if (times > maxRetries) {
      return null;
    }

    const delay = Math.min(times * 200, 1000);
    return delay;
  },

  maxRetriesPerRequest: 1,
  enableReadyCheck: false,
  enableOfflineQueue: false,
});

redis.on('connect', () => {
  console.log('Redis socket connected');
});

redis.on('ready', () => {
  console.log('Redis ready');
});

redis.on('reconnecting', () => {
  console.log('Redis reconnecting...');
});

redis.on('close', () => {
  console.log('Redis connection closed');
});

redis.on('end', () => {
  console.log('Redis connection ended');
});

redis.on('error', (err) => {
  // Suppress verbose reconnect errors in dev/test when Redis is optional
  if (envConfig.IS_PRODUCTION) {
    console.error('Redis error:', err.message);
  }
});

export default redis;
