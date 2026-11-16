import { RoomService, TransportService } from '../../services/index.js';
import { S2C } from '../../shared/constants.js';
import { AppError } from '../../shared/AppError.js';

export async function createTransport({ requestId, payload, participant }) {
  const room = RoomService.get(participant.roomId);
  if (!room) throw AppError.notFound('Not in a room');

  const { direction } = payload;
  const { transport, params } = await TransportService.createWebRtcTransport(room.router);

  if (direction === 'send') {
    participant.sendTransport = transport;
  } else {
    participant.recvTransport = transport;
  }

  participant.send(S2C.TRANSPORT_CREATED, { responseId: requestId, direction, ...params });
}
