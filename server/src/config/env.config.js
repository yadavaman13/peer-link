import dotenv from 'dotenv';
dotenv.config();

function normalizeOrigin(origin = '') {
  return origin.trim().replace(/\/$/, '');
}

const isProduction = process.env.NODE_ENV === 'production';

// Client Origins config
const clientOriginsEnv =
  process.env.CLIENT_ORIGINS || process.env.ALLOWED_CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:3000';
const clientOrigins = clientOriginsEnv.split(',').map(normalizeOrigin).filter(Boolean);

if (isProduction && !process.env.CLIENT_ORIGINS && !process.env.ALLOWED_CLIENT_ORIGIN) {
  throw new Error('MISSING ENVIRONMENT VARIABLE: CLIENT_ORIGINS / ALLOWED_CLIENT_ORIGIN');
}

// mediasoup SFU checks
if (isProduction && !process.env.PUBLIC_IP) {
  throw new Error('MISSING ENVIRONMENT VARIABLE: PUBLIC_IP');
}

const envConfig = {
  // Server configuration
  PORT: parseInt(process.env.PORT, 10) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_ORIGINS: clientOrigins,
  CLIENT_ORIGIN: clientOrigins[0] || '*',
  IS_PRODUCTION: isProduction,
  isDev: !isProduction,
  isProd: isProduction,
  AUTH_COOKIE_OPTIONS: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  },

  // mediasoup SFU configuration
  PUBLIC_IP: process.env.PUBLIC_IP || '127.0.0.1',
  RTC_MIN_PORT: parseInt(process.env.RTC_MIN_PORT, 10) || 40000,
  RTC_MAX_PORT: parseInt(process.env.RTC_MAX_PORT, 10) || 49999,
  MEDIASOUP_LOG_LEVEL: process.env.MEDIASOUP_LOG_LEVEL || 'warn',

  isAllowedClientOrigin(origin, callback) {
    const allowed =
      !origin ||
      clientOrigins.includes('*') ||
      clientOrigins.includes(normalizeOrigin(origin));

    if (typeof callback === 'function') {
      callback(null, allowed);
    }
    return allowed;
  },
};

export const ENV = envConfig;
export default envConfig;
