import { S2C } from '../../shared/constants.js';
import { AppError } from '../../shared/AppError.js';

export async function consumerResume({ requestId, payload, participant }) {
  const consumer = participant.consumers.get(payload?.consumerId);
  if (!consumer) throw AppError.notFound(`Consumer [${payload?.consumerId}] not found`);

  await consumer.resume();
  participant.send(S2C.CONSUMER_RESUMED, { responseId: requestId, consumerId: consumer.id });
}
