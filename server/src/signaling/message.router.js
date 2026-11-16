import * as handlers from './handlers/index.js';
import { validateMessage } from './message.validator.js';
import { C2S } from '../shared/constants.js';
import { logger } from '../shared/logger.js';

const HANDLER_MAP = {
  [C2S.JOIN_ROOM]: handlers.joinRoom,
  [C2S.GET_ROUTER_CAPABILITIES]: handlers.getRouterCapabilities,
  [C2S.CREATE_TRANSPORT]: handlers.createTransport,
  [C2S.CONNECT_TRANSPORT]: handlers.connectTransport,
  [C2S.PRODUCE]: handlers.produce,
  [C2S.CONSUME]: handlers.consume,
  [C2S.CONSUMER_RESUME]: handlers.consumerResume,
  [C2S.LEAVE_ROOM]: handlers.leaveRoom,
};

export async function routeMessage(message, participant) {
  const { requestId, type, payload } = message;

  // 1. Validate payload shape
  validateMessage(type, payload);

  // 2. Dispatch to handler
  const handler = HANDLER_MAP[type];
  logger.info(`→ [${type}] from [${participant.id}]`);
  await handler({ requestId, payload, participant });
}
