import * as mediasoupClient from 'mediasoup-client';
import { SignalingClient } from './SignalingClient.js';
import { C2S, S2C } from './constants.js';

export class PeerLinkClient {
  constructor() {
    this.signaling = new SignalingClient();
    this.device = null;
    this.sendTransport = null;
    this.recvTransport = null;
    this.producers = new Map(); // kind -> producer
    this.consumers = new Map(); // consumerId -> consumer
    this.remoteStreams = new Map(); // participantId -> MediaStream
    this.participantProducers = new Map(); // producerId -> participantId
    this.roomId = null;
    this.participantId = null;
    this.listeners = new Map();

    this._setupSignalingListeners();
  }

  _setupSignalingListeners() {
    // New peer joins
    this.signaling.on(S2C.PARTICIPANT_JOINED, (data) => {
      this.emit('participant-joined', data);
    });

    // Peer leaves
    this.signaling.on(S2C.PARTICIPANT_LEFT, ({ participantId }) => {
      this._handleParticipantLeft(participantId);
    });

    // Meeting ended by host
    this.signaling.on(S2C.MEETING_ENDED, (data) => {
      this.emit('meeting-ended', data);
    });

    // New media track published in room
    this.signaling.on(S2C.NEW_PRODUCER, async ({ participantId, producerId, kind }) => {
      this.participantProducers.set(producerId, participantId);
      await this._consumeProducer(producerId, participantId, kind);
    });

    // Remote consumer closed
    this.signaling.on(S2C.CONSUMER_CLOSED, ({ consumerId }) => {
      this._handleConsumerClosed(consumerId);
    });
  }

  async join({ signalingUrl, token, roomId, user }) {
    // If currently connected or has existing transports, cleanly reset first
    if (this.signaling?.isConnected || this.sendTransport || this.recvTransport) {
      this.leave();
    }

    this.roomId = roomId;

    // 1. Connect WebSocket
    const wsUrl = new URL(signalingUrl);
    if (token) {
      wsUrl.searchParams.set('token', token);
    }
    await this.signaling.connect(wsUrl.toString());

    // 2. Initialize Mediasoup Device
    this.device = new mediasoupClient.Device();

    // 3. Send JOIN_ROOM with optional user profile
    const joinResponse = await this.signaling.request(C2S.JOIN_ROOM, { roomId, user });
    this.participantId = joinResponse.participantId;
    this.roomId = joinResponse.roomId;
    this.isHost = joinResponse.isHost;

    // 4. Request Router Capabilities and load Device
    const capsResponse = await this.signaling.request(C2S.GET_ROUTER_CAPABILITIES);
    await this.device.load({ routerRtpCapabilities: capsResponse.rtpCapabilities });

    // 5. Create Send & Receive Transports
    await this._createSendTransport();
    await this._createRecvTransport();

    // 6. Consume any existing producers in the room
    if (Array.isArray(joinResponse.existingProducers)) {
      for (const prod of joinResponse.existingProducers) {
        this.participantProducers.set(prod.producerId, prod.participantId);
        await this._consumeProducer(prod.producerId, prod.participantId, prod.kind);
      }
    }

    this.emit('joined', {
      roomId: this.roomId,
      participantId: this.participantId,
      isHost: this.isHost,
      participants: joinResponse.participants || [],
    });

    return {
      roomId: this.roomId,
      participantId: this.participantId,
      isHost: this.isHost,
      participants: joinResponse.participants || [],
    };
  }

  async _createSendTransport() {
    const params = await this.signaling.request(C2S.CREATE_TRANSPORT, { direction: 'send' });

    this.sendTransport = this.device.createSendTransport({
      id: params.id,
      iceParameters: params.iceParameters,
      iceCandidates: params.iceCandidates,
      dtlsParameters: params.dtlsParameters,
      sctpParameters: params.sctpParameters,
    });

    this.sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await this.signaling.request(C2S.CONNECT_TRANSPORT, {
          transportId: this.sendTransport.id,
          dtlsParameters,
        });
        callback();
      } catch (err) {
        errback(err);
      }
    });

    this.sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
      try {
        const response = await this.signaling.request(C2S.PRODUCE, {
          kind,
          rtpParameters,
        });
        callback({ id: response.producerId });
      } catch (err) {
        errback(err);
      }
    });

    this.sendTransport.on('connectionstatechange', (state) => {
      this.emit('send-transport-state', state);
    });
  }

  async _createRecvTransport() {
    const params = await this.signaling.request(C2S.CREATE_TRANSPORT, { direction: 'recv' });

    this.recvTransport = this.device.createRecvTransport({
      id: params.id,
      iceParameters: params.iceParameters,
      iceCandidates: params.iceCandidates,
      dtlsParameters: params.dtlsParameters,
      sctpParameters: params.sctpParameters,
    });

    this.recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await this.signaling.request(C2S.CONNECT_TRANSPORT, {
          transportId: this.recvTransport.id,
          dtlsParameters,
        });
        callback();
      } catch (err) {
        errback(err);
      }
    });

    this.recvTransport.on('connectionstatechange', (state) => {
      this.emit('recv-transport-state', state);
    });
  }

  async produceTrack(track) {
    if (!this.sendTransport) {
      throw new Error('Send transport not initialized');
    }

    const kind = track.kind; // 'audio' or 'video'

    if (this.device && !this.device.canProduce(kind)) {
      console.warn(`Device cannot produce ${kind}`);
      return null;
    }

    // If already producing this kind, stop/replace
    if (this.producers.has(kind)) {
      this.stopProducing(kind);
    }

    const producer = await this.sendTransport.produce({ track });
    this.producers.set(kind, producer);

    producer.on('transportclose', () => {
      this.producers.delete(kind);
    });

    producer.on('trackended', () => {
      this.stopProducing(kind);
    });

    this.emit('producer-added', { kind, producerId: producer.id });
    return producer;
  }

  stopProducing(kind) {
    if (this.producers.has(kind)) {
      const producer = this.producers.get(kind);
      producer.close();
      this.producers.delete(kind);
      this.emit('producer-removed', { kind });
    }
  }

  async _consumeProducer(producerId, participantId, kind) {
    if (!this.recvTransport || !this.device || !this.device.loaded) return;

    try {
      const response = await this.signaling.request(C2S.CONSUME, {
        producerId,
        rtpCapabilities: this.device.rtpCapabilities,
      });

      const { consumerId, rtpParameters } = response;

      const consumer = await this.recvTransport.consume({
        id: consumerId,
        producerId,
        kind,
        rtpParameters,
      });

      this.consumers.set(consumerId, consumer);

      // Tell server to resume consumer (server creates consumer paused)
      await this.signaling.request(C2S.CONSUMER_RESUME, { consumerId });

      // Associate track with participant's MediaStream
      let stream = this.remoteStreams.get(participantId);
      if (!stream) {
        stream = new MediaStream();
        this.remoteStreams.set(participantId, stream);
      }
      stream.addTrack(consumer.track);

      this.emit('remote-stream-updated', {
        participantId,
        stream,
        track: consumer.track,
        kind,
      });
    } catch (err) {
      console.error(`Failed to consume producer ${producerId}:`, err);
    }
  }

  _handleConsumerClosed(consumerId) {
    const consumer = this.consumers.get(consumerId);
    if (!consumer) return;

    consumer.close();
    this.consumers.delete(consumerId);

    const participantId = this.participantProducers.get(consumer.producerId);
    if (participantId && this.remoteStreams.has(participantId)) {
      const stream = this.remoteStreams.get(participantId);
      stream.removeTrack(consumer.track);
      this.emit('remote-stream-updated', {
        participantId,
        stream,
        track: consumer.track,
        kind: consumer.kind,
      });
    }
  }

  _handleParticipantLeft(participantId) {
    if (this.remoteStreams.has(participantId)) {
      const stream = this.remoteStreams.get(participantId);
      stream.getTracks().forEach((track) => track.stop());
      this.remoteStreams.delete(participantId);
    }
    this.emit('participant-left', { participantId });
  }

  endMeeting() {
    try {
      this.signaling.send(C2S.END_MEETING);
    } catch {
      // Ignore if socket already closed
    }
    this.leave();
  }

  leave() {
    try {
      this.signaling.send(C2S.LEAVE_ROOM);
    } catch {
      // Ignore if socket already closed
    }

    // Close producers
    for (const producer of this.producers.values()) {
      producer.close();
    }
    this.producers.clear();

    // Close consumers
    for (const consumer of this.consumers.values()) {
      consumer.close();
    }
    this.consumers.clear();

    // Stop remote streams
    for (const stream of this.remoteStreams.values()) {
      stream.getTracks().forEach((track) => track.stop());
    }
    this.remoteStreams.clear();
    this.participantProducers.clear();

    // Close transports
    if (this.sendTransport) {
      this.sendTransport.close();
      this.sendTransport = null;
    }
    if (this.recvTransport) {
      this.recvTransport.close();
      this.recvTransport = null;
    }

    this.signaling.close();
    this.emit('left');
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in PeerLinkClient event ${event}:`, err);
        }
      }
    }
  }
}
