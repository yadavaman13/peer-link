import { v4 as uuidv4 } from 'uuid';
import { Participant } from '../modules/participant/index.js';
import { RoomService } from './room.service.js';
import { S2C } from '../shared/constants.js';
import { logger } from '../shared/logger.js';

export const ParticipantService = {
  createParticipant(socket) {
    const id = uuidv4();
    return new Participant(id, socket);
  },

  async joinRoom(participant, roomId) {
    let room = roomId ? RoomService.get(roomId) : null;

    // Auto-create room if it doesn't exist
    if (!room) {
      room = await RoomService.create();
    }

    room.addParticipant(participant);
    logger.info(`Participant [${participant.id}] joined room [${room.id}]`);

    // Notify existing participants
    room.broadcast(
      S2C.PARTICIPANT_JOINED,
      {
        participantId: participant.id,
      },
      participant.id
    );

    return {
      roomId: room.id,
      participantId: participant.id,
      existingProducers: room.getProducerList(participant.id),
    };
  },

  leaveRoom(participant) {
    if (!participant.roomId) return;
    const room = RoomService.get(participant.roomId);
    if (!room) return;

    room.removeParticipant(participant.id);
    logger.info(`Participant [${participant.id}] left room [${room.id}]`);

    // Notify remaining participants
    room.broadcast(S2C.PARTICIPANT_LEFT, {
      participantId: participant.id,
    });

    // Auto-clean empty rooms
    if (room.isEmpty) {
      RoomService.delete(room.id);
    }
  },
};
