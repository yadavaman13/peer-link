export class Room {
  constructor(id, router) {
    this.id = id;
    this.router = router;
    this.participants = new Map();
    this.createdAt = Date.now();
  }

  addParticipant(participant) {
    this.participants.set(participant.id, participant);
    participant.roomId = this.id;
  }

  removeParticipant(participantId) {
    const p = this.participants.get(participantId);
    if (p) {
      p.close();
      p.roomId = null;
      this.participants.delete(participantId);
    }
  }

  getParticipant(participantId) {
    return this.participants.get(participantId) || null;
  }

  broadcast(type, payload, excludeId = null) {
    for (const [id, participant] of this.participants) {
      if (id !== excludeId) participant.send(type, payload);
    }
  }

  getProducerList(excludeId = null) {
    const producers = [];
    for (const [pid, p] of this.participants) {
      if (pid === excludeId) continue;
      for (const [producerId, producer] of p.producers) {
        producers.push({ participantId: pid, producerId, kind: producer.kind });
      }
    }
    return producers;
  }

  get size() {
    return this.participants.size;
  }

  get isEmpty() {
    return this.participants.size === 0;
  }

  close() {
    this.participants.forEach((p) => p.close());
    this.participants.clear();
    this.router.close();
  }
}
