import { RoomService } from '../../services/room.service.js';
import { S2C } from '../../shared/constants.js';
import { AppError } from '../../shared/AppError.js';

export async function getRouterCapabilities({ requestId, participant }) {
  const room = RoomService.get(participant.roomId);
  if (!room) throw AppError.notFound('Not in a room');

  participant.send(S2C.ROUTER_CAPABILITIES, {
    responseId: requestId,
    rtpCapabilities: room.router.rtpCapabilities,
  });
}
