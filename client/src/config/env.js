// Centralized environment and URL resolution

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const WS_SIGNALING_URL = (() => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  // If running in development and no env var is set, connect directly to port 3000
  if (import.meta.env.DEV) {
    return 'ws://localhost:3000';
  }

  // If API_BASE_URL starts with http/https, derive matching ws/wss
  if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
    return API_BASE_URL.replace(/^http/, 'ws');
  }

  // Fallback to current browser location
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
})();
