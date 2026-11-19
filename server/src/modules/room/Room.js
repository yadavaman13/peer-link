export class Room {
  constructor(id, router, metadata = {}) {
    this.id = id;
    this.router = router;
    this.participants = new Map();
    this.createdAt = Date.now();
    this.createdBy = metadata.createdBy || null;
    this.hostId = null;
    this.maxParticipants = metadata.maxParticipants || 10;
  }

  addParticipant(participant) {
    this.participants.set(participant.id, participant);
    participant.roomId = this.id;

    // Set as host if first participant or if creator
    if (
      !this.hostId ||
      (this.createdBy && participant.userId && this.createdBy === participant.userId)
    ) {
      this.hostId = participant.id;
    }
  }

  isHost(participantId) {
    if (this.hostId === participantId) return true;
    const p = this.participants.get(participantId);
    if (p && this.createdBy && p.userId && this.createdBy === p.userId) return true;
    return false;
  }

  getParticipantList(excludeId = null) {
    const list = [];
    for (const [pid, p] of this.participants) {
      if (pid === excludeId) continue;
      list.push({
        id: pid,
        userId: p.userId,
        user: p.user
          ? {
              id: p.userId,
              firstName: p.user.firstName,
              lastName: p.user.lastName,
              email: p.user.email,
              avatar: p.user.avatar,
            }
          : null,
        isHost: this.isHost(pid),
      });
    }
    return list;
  }

  removeParticipant(participantId) {
    const p = this.participants.get(participantId);
    if (p) {
      p.close();
      p.roomId = null;
      this.participants.delete(participantId);
      if (this.hostId === participantId) {
        // If host leaves and others remain, assign next participant as host
        const nextParticipant = this.participants.keys().next().value;
        this.hostId = nextParticipant || null;
      }
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
