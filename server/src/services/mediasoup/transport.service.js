import { WEBRTC_TRANSPORT_OPTIONS } from '../../config/mediasoup.config.js';
import { logger } from '../../shared/logger.js';

export const TransportService = {
  async createWebRtcTransport(router) {
    const transport = await router.createWebRtcTransport(WEBRTC_TRANSPORT_OPTIONS);

    transport.on('dtlsstatechange', (dtlsState) => {
      if (dtlsState === 'closed') {
        logger.debug(`Transport closed [${transport.id}]`);
        transport.close();
      }
    });

    return {
      transport,
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    };
  },

  async connect(transport, dtlsParameters) {
    await transport.connect({ dtlsParameters });
  },
};
