import { RoomService } from '../../services/index.js';
import { S2C } from '../../shared/constants.js';
import { AppError } from '../../shared/AppError.js';

export async function consume({ requestId, payload, participant }) {
  if (!participant.recvTransport) throw AppError.badRequest('No receive transport created');

  const { producerId, rtpCapabilities } = payload;
  const room = RoomService.get(participant.roomId);
  if (!room) throw AppError.notFound('Not in a room');

  if (!room.router.canConsume({ producerId, rtpCapabilities })) {
    throw AppError.badRequest(`Cannot consume producer [${producerId}]`);
  }

  const consumer = await participant.recvTransport.consume({
    producerId,
    rtpCapabilities,
    paused: true, // Always start paused on server; resumed on CONSUMER_RESUME
  });

  participant.consumers.set(consumer.id, consumer);

  consumer.on('transportclose', () => {
    participant.consumers.delete(consumer.id);
  });

  consumer.on('producerclose', () => {
    participant.consumers.delete(consumer.id);
    participant.send(S2C.CONSUMER_CLOSED, { consumerId: consumer.id });
  });

  participant.send(S2C.CONSUMED, {
    responseId: requestId,
    consumerId: consumer.id,
    producerId,
    kind: consumer.kind,
    rtpParameters: consumer.rtpParameters,
  });
}
