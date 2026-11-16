import { ParticipantService } from '../../services/participant.service.js';
import { S2C } from '../../shared/constants.js';

export async function joinRoom({ requestId, payload, participant }) {
  const result = await ParticipantService.joinRoom(participant, payload?.roomId);

  participant.send(S2C.ROOM_JOINED, {
    responseId: requestId,
    ...result,
  });
}
