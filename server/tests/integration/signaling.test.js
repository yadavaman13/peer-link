import http from 'http';
import { WebSocket } from 'ws';
import app from '../../src/app.js';
import { attachWebSocketServer, getWSS } from '../../src/signaling/ws.server.js';
import { RoomService } from '../../src/services/room.service.js';
import { C2S, S2C } from '../../src/shared/constants.js';

describe('Signaling Protocol Integration', () => {
  let server;
  let wsUrl;
  const openSockets = [];

  beforeAll(async () => {
    server = http.createServer(app);
    attachWebSocketServer(server);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    wsUrl = `ws://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    // Close any lingering sockets
    for (const ws of openSockets) {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.terminate();
      }
    }
    const wss = getWSS();
    if (wss) {
      wss.clients.forEach((c) => c.terminate());
    }
    RoomService.clearAll();
    await new Promise((resolve) => server.close(resolve));
  });

  function createClient() {
    const ws = new WebSocket(wsUrl);
    openSockets.push(ws);
    const messages = [];
    const listeners = [];

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        // Check if there is an active listener for this type
        const idx = listeners.findIndex((l) => l.type === parsed.type);
        if (idx !== -1) {
          const listener = listeners.splice(idx, 1)[0];
          listener.resolve(parsed);
        } else {
          messages.push(parsed);
        }
      } catch {
        // ignore parse error
      }
    });

    const waitForMessage = (type, timeoutMs = 4000) => {
      // Check existing buffered messages first
      const existingIdx = messages.findIndex((m) => m.type === type);
      if (existingIdx !== -1) {
        return Promise.resolve(messages.splice(existingIdx, 1)[0]);
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          const idx = listeners.findIndex((l) => l.resolve === resolve);
          if (idx !== -1) listeners.splice(idx, 1);
          reject(new Error(`Timeout waiting for message type: ${type}`));
        }, timeoutMs);

        listeners.push({
          type,
          resolve: (msg) => {
            clearTimeout(timeout);
            resolve(msg);
          },
        });
      });
    };

    const send = (type, payload = {}, requestId = 'req-1') => {
      ws.send(JSON.stringify({ requestId, type, payload }));
    };

    const connected = new Promise((resolve) => ws.on('open', resolve));

    return { ws, send, waitForMessage, connected };
  }

  it('connects and handles JOIN_ROOM', async () => {
    const client = createClient();
    await client.connected;

    client.send(C2S.JOIN_ROOM, {}, 'join-req-1');
    const response = await client.waitForMessage(S2C.ROOM_JOINED);

    expect(response.payload.responseId).toBe('join-req-1');
    expect(response.payload.roomId).toBeDefined();
    expect(response.payload.participantId).toBeDefined();
    expect(Array.isArray(response.payload.existingProducers)).toBe(true);

    client.ws.close();
  });

  it('handles GET_ROUTER_CAPABILITIES', async () => {
    const client = createClient();
    await client.connected;

    client.send(C2S.JOIN_ROOM, {}, 'join-req-2');
    await client.waitForMessage(S2C.ROOM_JOINED);

    client.send(C2S.GET_ROUTER_CAPABILITIES, {}, 'cap-req-1');
    const response = await client.waitForMessage(S2C.ROUTER_CAPABILITIES);

    expect(response.payload.responseId).toBe('cap-req-1');
    expect(response.payload.rtpCapabilities).toBeDefined();
    expect(response.payload.rtpCapabilities.codecs).toBeDefined();

    client.ws.close();
  });

  it('handles CREATE_TRANSPORT for send and recv', async () => {
    const client = createClient();
    await client.connected;

    client.send(C2S.JOIN_ROOM, {}, 'join-req-3');
    await client.waitForMessage(S2C.ROOM_JOINED);

    client.send(C2S.CREATE_TRANSPORT, { direction: 'send' }, 't-req-1');
    const sendTransportRes = await client.waitForMessage(S2C.TRANSPORT_CREATED);

    expect(sendTransportRes.payload.responseId).toBe('t-req-1');
    expect(sendTransportRes.payload.direction).toBe('send');
    expect(sendTransportRes.payload.id).toBeDefined();
    expect(sendTransportRes.payload.iceParameters).toBeDefined();
    expect(sendTransportRes.payload.iceCandidates).toBeDefined();
    expect(sendTransportRes.payload.dtlsParameters).toBeDefined();

    client.send(C2S.CREATE_TRANSPORT, { direction: 'recv' }, 't-req-2');
    const recvTransportRes = await client.waitForMessage(S2C.TRANSPORT_CREATED);

    expect(recvTransportRes.payload.responseId).toBe('t-req-2');
    expect(recvTransportRes.payload.direction).toBe('recv');
    expect(recvTransportRes.payload.id).toBeDefined();

    client.ws.close();
  });

  it('notifies peers when PARTICIPANT_JOINED and PARTICIPANT_LEFT', async () => {
    const client1 = createClient();
    await client1.connected;

    client1.send(C2S.JOIN_ROOM, {}, 'c1-join');
    const c1Joined = await client1.waitForMessage(S2C.ROOM_JOINED);
    const roomId = c1Joined.payload.roomId;

    const client2 = createClient();
    await client2.connected;

    // Client 2 joins the same room
    client2.send(C2S.JOIN_ROOM, { roomId }, 'c2-join');
    await client2.waitForMessage(S2C.ROOM_JOINED);

    // Client 1 should receive PARTICIPANT_JOINED
    const peerJoined = await client1.waitForMessage(S2C.PARTICIPANT_JOINED);
    expect(peerJoined.payload.participantId).toBeDefined();

    // Client 2 closes connection
    client2.ws.close();

    // Client 1 should receive PARTICIPANT_LEFT
    const peerLeft = await client1.waitForMessage(S2C.PARTICIPANT_LEFT);
    expect(peerLeft.payload.participantId).toBe(peerJoined.payload.participantId);

    client1.ws.close();
  });
});
