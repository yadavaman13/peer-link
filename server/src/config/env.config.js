import 'dotenv/config';

export const ENV = Object.freeze({
  PORT: parseInt(process.env.PORT, 10) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_ORIGINS: (process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  PUBLIC_IP: process.env.PUBLIC_IP || '127.0.0.1',
  RTC_MIN_PORT: parseInt(process.env.RTC_MIN_PORT, 10) || 40000,
  RTC_MAX_PORT: parseInt(process.env.RTC_MAX_PORT, 10) || 49999,
  MEDIASOUP_LOG_LEVEL: process.env.MEDIASOUP_LOG_LEVEL || 'warn',

  get isDev() {
    return this.NODE_ENV === 'development';
  },
  get isProd() {
    return this.NODE_ENV === 'production';
  },
});
