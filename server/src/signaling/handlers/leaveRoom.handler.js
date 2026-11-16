import { ParticipantService } from '../../services/participant.service.js';

export async function leaveRoom({ participant }) {
  ParticipantService.leaveRoom(participant);
}
