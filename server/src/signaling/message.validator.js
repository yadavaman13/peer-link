import { AppError } from '../shared/AppError.js';

const SCHEMAS = {
  JOIN_ROOM: () => true,
  GET_ROUTER_CAPABILITIES: () => true,
  CREATE_TRANSPORT: (p) => {
    if (!['send', 'recv'].includes(p?.direction)) {
      throw AppError.badRequest('direction must be "send" or "recv"');
    }
  },
  CONNECT_TRANSPORT: (p) => {
    if (!p?.transportId) throw AppError.badRequest('transportId is required');
    if (!p?.dtlsParameters) throw AppError.badRequest('dtlsParameters is required');
  },
  PRODUCE: (p) => {
    if (!['audio', 'video'].includes(p?.kind)) {
      throw AppError.badRequest('kind must be "audio" or "video"');
    }
    if (!p?.rtpParameters) throw AppError.badRequest('rtpParameters is required');
  },
  CONSUME: (p) => {
    if (!p?.producerId) throw AppError.badRequest('producerId is required');
    if (!p?.rtpCapabilities) throw AppError.badRequest('rtpCapabilities is required');
  },
  CONSUMER_RESUME: (p) => {
    if (!p?.consumerId) throw AppError.badRequest('consumerId is required');
  },
  LEAVE_ROOM: () => true,
};

export function validateMessage(type, payload) {
  const validator = SCHEMAS[type];
  if (!validator) throw AppError.badRequest(`Unknown event type: ${type}`);
  validator(payload);
}
