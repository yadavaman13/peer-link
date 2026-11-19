import { ParticipantService } from '../../services/participant.service.js';

export async function endMeeting({ participant }) {
  ParticipantService.endMeeting(participant);
}
