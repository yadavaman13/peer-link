import { RoomService } from '../../services/index.js';
import { S2C } from '../../shared/constants.js';
import { AppError } from '../../shared/AppError.js';

export async function produce({ requestId, payload, participant }) {
  if (!participant.sendTransport) throw AppError.badRequest('No send transport created');

  const { kind, rtpParameters } = payload;
  const producer = await participant.sendTransport.produce({ kind, rtpParameters });
  participant.producers.set(producer.id, producer);

  producer.on('transportclose', () => {
    participant.producers.delete(producer.id);
  });

  participant.send(S2C.PRODUCED, { responseId: requestId, producerId: producer.id });

  // Broadcast to others in room
  const room = RoomService.get(participant.roomId);
  if (room) {
    room.broadcast(
      S2C.NEW_PRODUCER,
      {
        participantId: participant.id,
        producerId: producer.id,
        kind,
      },
      participant.id
    );
  }
}
