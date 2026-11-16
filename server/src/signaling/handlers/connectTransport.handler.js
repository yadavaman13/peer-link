import { TransportService } from '../../services/index.js';
import { S2C } from '../../shared/constants.js';
import { AppError } from '../../shared/AppError.js';

export async function connectTransport({ requestId, payload, participant }) {
  const { transportId, dtlsParameters } = payload;
  const transport = [participant.sendTransport, participant.recvTransport].find(
    (t) => t?.id === transportId
  );

  if (!transport) throw AppError.notFound(`Transport [${transportId}] not found`);

  await TransportService.connect(transport, dtlsParameters);
  participant.send(S2C.TRANSPORT_CONNECTED, { responseId: requestId });
}
