export class Participant {
  constructor(id, socket) {
    this.id = id;
    this.socket = socket;
    this.roomId = null;
    this.sendTransport = null;
    this.recvTransport = null;
    this.producers = new Map(); // producerId → Producer
    this.consumers = new Map(); // consumerId → Consumer
  }

  send(type, payload = {}) {
    if (this.socket.readyState === 1) {
      this.socket.send(JSON.stringify({ type, payload }));
    }
  }

  close() {
    this.consumers.forEach((c) => c.close());
    this.producers.forEach((p) => p.close());
    this.sendTransport?.close();
    this.recvTransport?.close();
    this.consumers.clear();
    this.producers.clear();
  }
}
