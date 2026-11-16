import { ENV } from './env.config.js';

export const WORKER_SETTINGS = {
  logLevel: ENV.MEDIASOUP_LOG_LEVEL,
  rtcMinPort: ENV.RTC_MIN_PORT,
  rtcMaxPort: ENV.RTC_MAX_PORT,
};

export const MEDIA_CODECS = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
    },
  },
];

export const WEBRTC_TRANSPORT_OPTIONS = {
  listenInfos: [
    {
      protocol: 'udp',
      ip: '0.0.0.0',
      announcedAddress: ENV.PUBLIC_IP,
    },
    {
      protocol: 'tcp',
      ip: '0.0.0.0',
      announcedAddress: ENV.PUBLIC_IP,
    },
  ],
  initialAvailableOutgoingBitrate: 1000000,
};
