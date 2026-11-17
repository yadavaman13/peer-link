import dotenv from 'dotenv';
dotenv.config();

function normalizeOrigin(origin = '') {
  return origin.trim().replace(/\/$/, '');
}

const isProduction = process.env.NODE_ENV === 'production';

// Strict validations in production
if (isProduction) {
  if (!process.env.MONGO_URL) {
    throw new Error('MISSING ENVIRONMENT VARIABLE: MONGO_URL');
  }
  if (!process.env.JWT_SECRET_KEY) {
    throw new Error('MISSING ENVIRONMENT VARIABLE: JWT_SECRET_KEY');
  }
  if (!process.env.CLIENT_ORIGINS && !process.env.ALLOWED_CLIENT_ORIGIN) {
    throw new Error('MISSING ENVIRONMENT VARIABLE: CLIENT_ORIGINS / ALLOWED_CLIENT_ORIGIN');
  }
  if (!process.env.PUBLIC_IP) {
    throw new Error('MISSING ENVIRONMENT VARIABLE: PUBLIC_IP');
  }
}

// Client Origins config
const clientOriginsEnv =
  process.env.CLIENT_ORIGINS ||
  process.env.ALLOWED_CLIENT_ORIGIN ||
  'http://localhost:5173,http://localhost:3000';
const clientOrigins = clientOriginsEnv.split(',').map(normalizeOrigin).filter(Boolean);

// Redis defaults
const redisHostRaw = (process.env.REDIS_HOST || '127.0.0.1').trim();
const redisHost = redisHostRaw.split(':')[0];
const redisPort = process.env.REDIS_PORT || redisHostRaw.split(':')[1] || '6379';
const redisPassword = process.env.REDIS_PASSWORD || undefined;

const envConfig = {
  // Server configuration
  PORT: parseInt(process.env.PORT, 10) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_ORIGINS: clientOrigins,
  CLIENT_ORIGIN: clientOrigins[0] || 'http://localhost:5173',
  IS_PRODUCTION: isProduction,
  isDev: !isProduction,
  isProd: isProduction,
  AUTH_COOKIE_OPTIONS: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days default
  },

  // Database configuration
  MONGO_URL: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/peerlink',

  // JWT configuration
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY || 'peerlink_dev_jwt_secret_key_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Google OAuth / Gmail configuration
  CLIENT_ID: process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
  CLIENT_SECRET: process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
  REFRESH_TOKEN: process.env.REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN || '',
  EMAIL_USER: process.env.EMAIL_USER || process.env.GOOGLE_SENDER_EMAIL || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET || '',
  GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN || process.env.REFRESH_TOKEN || '',
  GOOGLE_SENDER_EMAIL: process.env.GOOGLE_SENDER_EMAIL || process.env.EMAIL_USER || '',

  // ImageKit configuration
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY || null,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY || 'dummy_private_key_for_dev',
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT || null,

  // Redis configuration
  REDIS_HOST: redisHost,
  REDIS_PORT: redisPort,
  REDIS_PASSWORD: redisPassword,

  // mediasoup SFU configuration
  PUBLIC_IP: process.env.PUBLIC_IP || '127.0.0.1',
  RTC_MIN_PORT: parseInt(process.env.RTC_MIN_PORT, 10) || 40000,
  RTC_MAX_PORT: parseInt(process.env.RTC_MAX_PORT, 10) || 49999,
  MEDIASOUP_LOG_LEVEL: process.env.MEDIASOUP_LOG_LEVEL || 'warn',

  isAllowedClientOrigin(origin, callback) {
    const allowed =
      !origin || clientOrigins.includes('*') || clientOrigins.includes(normalizeOrigin(origin));

    if (typeof callback === 'function') {
      callback(null, allowed);
    }
    return allowed;
  },
};

export const ENV = envConfig;
export default envConfig;
