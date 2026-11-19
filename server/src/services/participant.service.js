import { v4 as uuidv4 } from 'uuid';
import { Participant } from '../modules/participant/index.js';
import { RoomService } from './room.service.js';
import { S2C } from '../shared/constants.js';
import { logger } from '../shared/logger.js';
import { AppError } from '../shared/AppError.js';

export const ParticipantService = {
  createParticipant(socket, user = null) {
    const id = uuidv4();
    return new Participant(id, socket, user);
  },

  async joinRoom(participant, roomId) {
    let room = roomId ? RoomService.get(roomId) : null;

    // Auto-create room if it doesn't exist, using requested roomId
    if (!room) {
      room = await RoomService.create({
        roomId,
        createdBy: participant.userId,
      });
    }

    room.addParticipant(participant);
    const isHost = room.isHost(participant.id);
    logger.info(`Participant [${participant.id}] joined room [${room.id}] (isHost: ${isHost})`);

    // Notify existing participants
    room.broadcast(
      S2C.PARTICIPANT_JOINED,
      {
        participantId: participant.id,
        user: participant.user
          ? {
              id: participant.userId,
              firstName: participant.user.firstName,
              lastName: participant.user.lastName,
              email: participant.user.email,
              avatar: participant.user.avatar,
            }
          : null,
        isHost,
      },
      participant.id
    );

    return {
      roomId: room.id,
      participantId: participant.id,
      isHost,
      participants: room.getParticipantList(participant.id),
      existingProducers: room.getProducerList(participant.id),
    };
  },

  leaveRoom(participant) {
    if (!participant.roomId) return;
    const room = RoomService.get(participant.roomId);
    if (!room) return;

    const isHost = room.isHost(participant.id);

    // If host leaves, end meeting for everyone in the room
    if (isHost) {
      logger.info(
        `Host [${participant.id}] left/ended room [${room.id}] — closing room for all participants`
      );
      room.broadcast(S2C.MEETING_ENDED, {
        reason: 'The host has left and ended the meeting.',
      });
      RoomService.delete(room.id);
      return;
    }

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

  endMeeting(participant) {
    if (!participant.roomId) return;
    const room = RoomService.get(participant.roomId);
    if (!room) return;

    const isHost = room.isHost(participant.id);
    if (!isHost) {
      throw AppError.forbidden('Only the host can end the meeting');
    }

    logger.info(`Host [${participant.id}] explicitly ended room [${room.id}]`);
    room.broadcast(S2C.MEETING_ENDED, {
      reason: 'The meeting was ended by the host.',
    });
    RoomService.delete(room.id);
  },
};
