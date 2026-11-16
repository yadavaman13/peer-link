import { WebSocketServer } from 'ws';
import { ParticipantService } from '../services/participant.service.js';
import { routeMessage } from './message.router.js';
import { S2C } from '../shared/constants.js';
import { logger } from '../shared/logger.js';

let wss = null;

export function attachWebSocketServer(httpServer) {
  wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws) => {
    const participant = ParticipantService.createParticipant(ws);
    logger.info(`WS connected [${participant.id}]`);

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
