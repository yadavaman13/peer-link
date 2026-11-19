import { WebSocketServer } from 'ws';
import { ParticipantService } from '../services/participant.service.js';
import { routeMessage } from './message.router.js';
import { S2C } from '../shared/constants.js';
import { logger } from '../shared/logger.js';
import { verifyToken } from '../modules/auth/utils/jwt.js';

let wss = null;

export function attachWebSocketServer(httpServer) {
  wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws, req) => {
    let authUser = null;
    try {
      if (req?.url) {
        const url = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
        const token =
          url.searchParams.get('token') ||
          (req.headers?.authorization && req.headers.authorization.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : null);
        if (token) {
          authUser = verifyToken(token);
        }
      }
    } catch (err) {
      logger.warn(`WS connection token invalid: ${err.message}`);
    }

    const participant = ParticipantService.createParticipant(ws, authUser);
    logger.info(`WS connected [${participant.id}]${authUser ? ` (user: ${authUser.id})` : ''}`);

    ws.on('message', async (raw) => {
      let requestId;
      try {
        const rawStr = raw.toString();
        const message = JSON.parse(rawStr);
        requestId = message?.requestId;
        await routeMessage(message, participant);
      } catch (err) {
        participant.send(S2C.ERROR, {
          responseId: requestId,
          message: err.message || 'Internal server error',
        });
        logger.error(`WS message error [${participant.id}]:`, err.message);
      }
    });

    ws.on('close', () => {
      logger.info(`WS disconnected [${participant.id}]`);
      ParticipantService.leaveRoom(participant);
    });

    ws.on('error', (err) => {
      logger.error(`WS error [${participant.id}]:`, err.message);
    });
  });

  return wss;
}

export function getWSS() {
  return wss;
}
