# PeerLink Server

> **High-concurrency Node.js / Express 5 backend and mediasoup SFU real-time signaling engine for WebRTC audio/video communications.**

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.3-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![mediasoup](https://img.shields.io/badge/mediasoup-v3.32-FFA000?logo=webrtc&logoColor=white)](https://mediasoup.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-ws-4285F4?logo=socketdotio&logoColor=white)](https://github.com/websockets/ws)
[![Mongoose](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![Redis](https://img.shields.io/badge/Redis-ioredis_6-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

---

## Table of Contents

1. [Overview](#-overview)
2. [Technology Stack](#-technology-stack)
3. [Architecture & Design Principles](#-architecture--design-principles)
4. [Directory Structure](#-directory-structure)
5. [Mediasoup SFU Implementation](#-mediasoup-sfu-implementation)
6. [WebSocket Signaling Specification](#-websocket-signaling-specification)
7. [REST API Endpoints](#-rest-api-endpoints)
8. [Configuration & Environment Variables](#-configuration--environment-variables)
9. [Test-Driven Documentation (TDDoc)](#-test-driven-documentation-tddoc)
10. [Setup & Running Locally](#-setup--running-locally)
11. [Production Deployment & Firewall Setup](#-production-deployment--firewall-setup)
12. [Graceful Shutdown & Resilience](#-graceful-shutdown--resilience)

---

## Overview

The **PeerLink Server** acts as the central hub of the platform. It is responsible for:

1. **REST API Gateway:** Handling user accounts, authentication sessions, email/OTP verifications, and room creation/access tokens.
2. **WebSocket Signaling Hub:** Orchestrating bi-directional JSON messages between meeting participants with a correlation-based request/response pattern (`requestId` / `responseId`).
3. **SFU Media Gateway:** Managing native C++ **mediasoup** worker processes, routing RTP audio and video packets between peers, negotiating ICE/DTLS parameters, and managing producer/consumer lifecycles.

---

## Technology Stack

| Category                | Technology / Library               | Purpose                                                |
| :---------------------- | :--------------------------------- | :----------------------------------------------------- |
| **Runtime**             | Node.js (v20+ ESM)                 | High-performance asynchronous JavaScript runtime       |
| **HTTP Framework**      | Express v5.3                       | REST API routes, routing middleware, JSON parsers      |
| **Media Routing (SFU)** | mediasoup v3.32                    | Selective Forwarding Unit for WebRTC audio/video       |
| **Signaling**           | `ws` v8.23                         | Native WebSocket server for low-overhead messaging     |
| **Database**            | MongoDB & Mongoose v9.12           | Persistent storage for users, profiles, and rooms      |
| **In-Memory Cache**     | Redis & ioredis v6.0               | OTP token caching, rate-limiting, temporary state      |
| **Security**            | Helmet v8, BCrypt.js, CORS         | HTTP security headers, password hashing, origin gating |
| **Auth & Tokens**       | JSON Web Token (`jsonwebtoken` v9) | Signed session tokens (HTTP-Only Cookie + Bearer)      |
| **Email Service**       | Nodemailer & Google APIs OAuth2    | Automated OTP email delivery for verification          |
| **Media Storage**       | ImageKit SDK (`@imagekit/nodejs`)  | Optional cloud storage CDN for user avatar uploads     |
| **Testing**             | Vitest v5 & Supertest              | Unit & end-to-end integration testing                  |

---

## Architecture & Design Principles

The backend is organized around **Modular Domain-Driven Design (DDD)** and clear separation of concerns:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              HTTP Server                               │
│                         (server.js / port 3000)                        │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
       ┌─────────────────────────┐      ┌─────────────────────────┐
       │     Express 5 App       │      │ WebSocket Server (ws)   │
       │       (src/app.js)      │      │ (src/signaling/ws.server)│
       └────────────┬────────────┘      └────────────┬────────────┘
                    │                                │
    ┌───────────────┼───────────────┐                │
    ▼               ▼               ▼                ▼
┌───────┐       ┌───────┐       ┌────────┐     ┌───────────────────────┐
│ /auth │       │/rooms │       │/system │     │    Message Router     │
└───────┘       └───────┘       └────────┘     │(message.router.js)    │
                                               └───────────┬───────────┘
                                                           │
                                        ┌──────────────────┴───────────┐
                                        ▼                              ▼
                              ┌──────────────────┐           ┌──────────────────┐
                              │  Participant &   │           │    mediasoup     │
                              │   Room Manager   │           │ Worker & Router  │
                              └──────────────────┘           └──────────────────┘
```

1. **Modular Routes (`src/modules/*`):** Each business domain (`auth`, `room`, `participant`, `system`) encapsulates its own controllers, services, validation schemas, and route declarations.
2. **Abstracted Media Services (`src/services/mediasoup/*`):** Low-level mediasoup worker interactions, router allocations, and WebRTC transport negotiations are isolated behind dedicated service abstractions.
3. **Decoupled Signaling Handlers (`src/signaling/handlers/*`):** Individual signaling commands (`JOIN_ROOM`, `PRODUCE`, `CONSUME`, etc.) are isolated in single-responsibility modules.
4. **Standardized Responses & Error Propagation:** All REST errors inherit from `AppError` and are captured by the global `errorHandler` middleware.

---

## Directory Structure

```text
server/
├── scripts/
│   └── generate-postman.js       # Auto-compiles Postman v2.1.0 collection from test runs
├── src/
│   ├── app.js                    # Express application configuration & route mountings
│   ├── config/
│   │   ├── cache.config.js       # Redis client initialization & lifecycle
│   │   ├── cors.config.js        # Dynamic CORS whitelist validation
│   │   ├── db.js                 # MongoDB connection & disconnect handlers
│   │   ├── env.config.js         # Centralized environment validator with defaults
│   │   ├── index.js              # Config barrel exporter
│   │   └── mediasoup.config.js   # mediasoup codecs, worker settings, & listenInfos
│   ├── middlewares/
│   │   ├── error.middleware.js   # Global Express error handler & AppError processor
│   │   ├── index.js              # Middlewares barrel exporter
│   │   ├── notFound.middleware.js# 404 handler for unmatched routes
│   │   └── security.middleware.js# Helmet headers & sanitization
│   ├── models/
│   │   └── user.model.js         # Mongoose User schema (auth, verification, avatar)
│   ├── modules/
│   │   ├── auth/                 # Auth controllers, routes, JWT utils, validators
│   │   ├── participant/          # Participant entity (tracks, socket reference, user)
│   │   ├── room/                 # Room entity, router reference, participant map
│   │   └── system/               # System status, healthcheck, mediasoup diagnostics
│   ├── services/
│   │   ├── image.service.js      # ImageKit avatar upload handler
│   │   ├── mail/                 # Nodemailer / Gmail OAuth2 transporter
│   │   ├── mediasoup/
│   │   │   ├── index.js          # mediasoup services barrel exporter
│   │   │   ├── router.service.js # Media router factory
│   │   │   ├── transport.service.js # WebRtcTransport creation & connection
│   │   │   └── worker.service.js # mediasoup C++ worker lifecycle & resource stats
│   │   ├── participant.service.js# In-memory participant tracking and room joining
│   │   └── room.service.js       # In-memory room map and auto-cleanup
│   ├── shared/
│   │   ├── AppError.js           # Custom operational HTTP error class
│   │   ├── asyncHandler.js       # Async wrapper for route controllers
│   │   ├── constants.js          # C2S & S2C signaling event constants
│   │   ├── index.js              # Shared barrel exporter
│   │   └── logger.js             # Winston logger for development & production
│   ├── signaling/
│   │   ├── handlers/             # Modular signaling action handlers
│   │   │   ├── connectTransport.handler.js
│   │   │   ├── consumerResume.handler.js
│   │   │   ├── consume.handler.js
│   │   │   ├── createTransport.handler.js
│   │   │   ├── getRouterCapabilities.handler.js
│   │   │   ├── index.js
│   │   │   ├── joinRoom.handler.js
│   │   │   ├── leaveRoom.handler.js
│   │   │   └── produce.handler.js
│   │   ├── message.router.js     # Dispatcher matching message type to handler
│   │   ├── message.validator.js  # JSON schema validator for signaling payloads
│   │   └── ws.server.js          # WebSocket server lifecycle & client token verification
│   ├── templates/
│   │   └── index.js              # HTML email templates for OTP verification
│   └── utils/
│       ├── otp.utils.js          # 6-digit cryptographic OTP generator
│       └── response.utils.js     # Uniform REST response builder
├── tests/                        # Vitest unit and integration suites
│   ├── helpers/                  # Test auth helpers, request wrappers, md-logger
│   ├── integration/              # REST & WebSocket integration tests
│   ├── modules/                  # Sequential module tests (01_auth, 02_rooms, 03_system)
│   ├── unit/                     # Unit tests for services and message validators
│   └── setup.js                  # Vitest global setup (Mongo & Redis in-memory/test mocks)
├── .env.example                  # Environment variable reference
├── package.json                  # Server dependencies & scripts
├── server.js                     # HTTP/WS server entrypoint & graceful teardown
└── vitest.config.js              # Vitest runner configuration
```

---

## Mediasoup SFU Implementation

Mediasoup runs as an internal C++ subprocess that handles RTP/RTCP packets over UDP.

### 1. Codecs Configuration (`src/config/mediasoup.config.js`)

PeerLink configures audio and video codecs at the router level:

```javascript
export const MEDIA_CODECS = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
    },
  },
];
```

### 2. Dual WebRtcTransport Architecture

Each connected participant establishes two distinct WebRtcTransports with the room's router:

1. **Send Transport (`direction: "send"`):** Used exclusively for publishing upstream media tracks (mic audio and camera video) from the browser to the SFU.
2. **Receive Transport (`direction: "recv"`):** Used exclusively for consuming downstream media tracks from other participants in the room.

```
Participant A (Browser)                      PeerLink Server (mediasoup)
┌───────────────────────┐                    ┌─────────────────────────┐
│ Send Transport        │==== Producer (RTP) ===> Router               │
│ Receive Transport     │<=== Consumer (RTP) ==== (Room ID)            │
└───────────────────────┘                    └────────────┬────────────┘
                                                          │
Participant B (Browser)                                   │
┌───────────────────────┐                                 │
│ Receive Transport     │<=== Consumer (RTP) =============┘
│ Send Transport        │==== Producer (RTP) =============>
└───────────────────────┘
```

### 3. Media Lifecycle Methods

- `WorkerService.init()`: Spawns the mediasoup C++ worker using `WORKER_SETTINGS` (`rtcMinPort: 40000`, `rtcMaxPort: 49999`).
- `RouterService.create(worker)`: Creates an isolated media router for each room with supported media codecs.
- `TransportService.createWebRtcTransport(router)`: Configures a UDP/TCP transport bound to `PUBLIC_IP` with ICE parameters and DTLS candidates.
- `transport.connect({ dtlsParameters })`: Completes the DTLS security handshake with the remote browser client.
- `transport.produce({ kind, rtpParameters })`: Instantiates a server-side `Producer` for an incoming media track.
- `router.canConsume({ producerId, rtpCapabilities })`: Verifies that the client's browser codecs can receive the track before creating a `Consumer`.
- `consumer.resume()`: Begins streaming RTP packets down to the consuming client.

---

## 📡 WebSocket Signaling Specification

The WebSocket server operates at `ws://localhost:3000` (or `wss://domain.com` in production).

### Envelope Structure

All messages exchanged over WebSocket adhere to a standard JSON envelope:

#### Client Request to Server:

```json
{
  "requestId": "req_1700000000000",
  "type": "JOIN_ROOM",
  "payload": {
    "roomId": "room-uuid-or-code"
  }
}
```

#### Server Response to Client:

```json
{
  "responseId": "req_1700000000000",
  "type": "ROOM_JOINED",
  "payload": {
    "roomId": "room-uuid",
    "participantId": "participant-uuid",
    "existingProducers": []
  }
}
```

#### Server Broadcast Notification:

```json
{
  "type": "NEW_PRODUCER",
  "payload": {
    "producerId": "producer-uuid",
    "participantId": "remote-peer-uuid",
    "kind": "video"
  }
}
```

### Event Reference Table

| Event (`type`)            | Direction       | Payload Parameters                                     | Description                                          |
| :------------------------ | :-------------- | :----------------------------------------------------- | :--------------------------------------------------- |
| `JOIN_ROOM`               | C2S             | `{ roomId? }`                                          | Joins or auto-creates a room. Returns `ROOM_JOINED`. |
| `GET_ROUTER_CAPABILITIES` | C2S             | `{}`                                                   | Requests the room router's `rtpCapabilities`.        |
| `CREATE_TRANSPORT`        | C2S             | `{ direction: "send" \| "recv" }`                      | Creates a send or receive WebRtcTransport.           |
| `CONNECT_TRANSPORT`       | C2S             | `{ transportId, dtlsParameters }`                      | Finalizes DTLS handshake for a transport.            |
| `PRODUCE`                 | C2S             | `{ transportId, kind, rtpParameters }`                 | Starts producing audio or video track.               |
| `CONSUME`                 | C2S             | `{ producerId, rtpCapabilities }`                      | Requests to consume a remote track.                  |
| `CONSUMER_RESUME`         | C2S             | `{ consumerId }`                                       | Unpauses an active consumer.                         |
| `LEAVE_ROOM`              | C2S             | `{}`                                                   | Exits current room and destroys all tracks.          |
| `ROOM_JOINED`             | S2C             | `{ roomId, participantId, existingProducers }`         | Confirms room membership.                            |
| `ROUTER_CAPABILITIES`     | S2C             | `{ rtpCapabilities }`                                  | Router codec configuration.                          |
| `TRANSPORT_CREATED`       | S2C             | `{ id, iceParameters, iceCandidates, dtlsParameters }` | WebRtcTransport connection parameters.               |
| `TRANSPORT_CONNECTED`     | S2C             | `{ transportId, connected: true }`                     | Confirms transport connection.                       |
| `PRODUCED`                | S2C             | `{ id: producerId }`                                   | Confirms track registration.                         |
| `NEW_PRODUCER`            | S2C (Broadcast) | `{ producerId, participantId, kind }`                  | Informs peers of a newly published track.            |
| `CONSUMED`                | S2C             | `{ id, producerId, kind, rtpParameters }`              | Parameters for client-side consumer.                 |
| `CONSUMER_RESUMED`        | S2C             | `{ consumerId, resumed: true }`                        | Confirms consumer is flowing packets.                |
| `CONSUMER_CLOSED`         | S2C (Broadcast) | `{ consumerId, producerId }`                           | Signals that a track is no longer available.         |
| `PARTICIPANT_JOINED`      | S2C (Broadcast) | `{ participantId }`                                    | Informs existing members of a new peer.              |
| `PARTICIPANT_LEFT`        | S2C (Broadcast) | `{ participantId }`                                    | Informs existing members of a departure.             |
| `ERROR`                   | S2C             | `{ responseId?, message }`                             | Returned when validation or execution fails.         |

---

## REST API Endpoints

### 1. Authentication & Users

- `POST /api/auth/register` — Register new user account (sends 6-digit OTP).
- `POST /api/auth/login` — Sign in with email and password (issues JWT cookie + Bearer token).
- `POST /api/auth/verify-otp` — Verify 6-digit OTP stored in Redis.
- `POST /api/auth/resend-otp` — Resend verification OTP code.
- `POST /api/auth/logout` — Invalidate session and clear HTTP-only auth cookies.
- `GET /api/auth/me` — Retrieve current authenticated user session.
- `PATCH /api/users/profile` — Update display name, bio, or settings.
- `POST /api/users/avatar` — Upload avatar image via Multer & ImageKit.

### 2. Room Management

- `POST /api/rooms` — Create a new room with custom metadata and meeting code.
- `GET /api/rooms` — List rooms associated with the authenticated user.
- `GET /api/rooms/:code` — Retrieve room status and participant count by code or ID.
- `POST /api/rooms/:code/join` — Validate user permission to enter a room.

### 3. System & Health Diagnostics

- `GET /api/system/health` — Basic server liveness check (`{ status: "ok" }`).
- `GET /api/system/uptime` — Server process uptime, memory usage, and platform info.
- `GET /api/system/mediasoup` — mediasoup C++ worker PID and OS resource usage.

---

## Configuration & Environment Variables

All environment variables are validated at startup in `src/config/env.config.js`:

| Variable                | Type   | Default                                       | Description                                        |
| :---------------------- | :----- | :-------------------------------------------- | :------------------------------------------------- |
| `PORT`                  | Number | `3000`                                        | Port on which HTTP & WebSocket servers listen      |
| `NODE_ENV`              | String | `development`                                 | Runtime mode (`development`, `production`, `test`) |
| `CLIENT_ORIGINS`        | String | `http://localhost:5173,http://localhost:3000` | Comma-separated CORS allowed origins               |
| `MONGO_URL`             | String | `mongodb://127.0.0.1:27017/peerlink`          | MongoDB connection string                          |
| `JWT_SECRET_KEY`        | String | `peerlink_dev_jwt_secret_key...`              | Cryptographic secret for signing JWTs              |
| `JWT_EXPIRES_IN`        | String | `7d`                                          | JWT expiration duration (e.g., `7d`, `24h`)        |
| `REDIS_HOST`            | String | `127.0.0.1`                                   | Redis host for OTP cache                           |
| `REDIS_PORT`            | Number | `6379`                                        | Redis port                                         |
| `REDIS_PASSWORD`        | String | `undefined`                                   | Redis password if required                         |
| `PUBLIC_IP`             | String | `127.0.0.1`                                   | Public IPv4 address for mediasoup ICE candidates   |
| `RTC_MIN_PORT`          | Number | `40000`                                       | Lower bound of RTC port range                      |
| `RTC_MAX_PORT`          | Number | `49999`                                       | Upper bound of RTC port range                      |
| `MEDIASOUP_LOG_LEVEL`   | String | `warn`                                        | mediasoup log verbosity (`debug`, `warn`, `error`) |
| `EMAIL_USER`            | String | `""`                                          | Sender email address for OTP delivery              |
| `GOOGLE_CLIENT_ID`      | String | `""`                                          | Google OAuth2 Client ID for Gmail API              |
| `GOOGLE_CLIENT_SECRET`  | String | `""`                                          | Google OAuth2 Client Secret                        |
| `GOOGLE_REFRESH_TOKEN`  | String | `""`                                          | Google OAuth2 Refresh Token                        |
| `IMAGEKIT_PUBLIC_KEY`   | String | `null`                                        | ImageKit public key for avatar uploads             |
| `IMAGEKIT_PRIVATE_KEY`  | String | `dummy_key`                                   | ImageKit private key                               |
| `IMAGEKIT_URL_ENDPOINT` | String | `null`                                        | ImageKit URL CDN endpoint                          |

---

## Test-Driven Documentation (TDDoc)

PeerLink employs an automated testing and documentation workflow where tests generate documentation artifacts and Postman collections:

```bash
# Run all unit and integration tests with Vitest
npm test

# Run tests with real-time payload logging and compile Postman collection
npm run test:api:docs

# Rebuild Postman collection only
npm run generate:postman
```

- Tests in `tests/modules/` (`01_auth_user.test.js`, `02_rooms.test.js`, `03_system.test.js`) intercept live HTTP responses using `tests/helpers/md-logger.js`.
- Generated Markdown documents are written to `docs/api-docs/`.
- `scripts/generate-postman.js` compiles the test artifacts into a single Postman collection at `docs/api-docs/postman_collection.json`.

---

## Setup & Running Locally

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your local MongoDB and Redis settings
```

### 3. Ensure Services are Running

- **MongoDB:** `mongod` running on port `27017`.
- **Redis:** `redis-server` running on port `6379`.

### 4. Start Development Server

```bash
npm run dev
```

Output:

```text
info: Connected to MongoDB: mongodb://127.0.0.1:27017/peerlink
info: mediasoup Worker created [pid:12345]
info: Server running on port 3000 [development]
info: WebSocket ready at ws://localhost:3000
```

---

## Production Deployment & Firewall Setup

When deploying to a Linux server (Ubuntu/Debian, AWS EC2, DigitalOcean):

1. **Set `PUBLIC_IP`:**
   Set `PUBLIC_IP` to the public IPv4 address of your VPS/instance. Without this, WebRTC candidates will bind to `127.0.0.1` and remote participants will not receive media.
2. **Open Firewall Ports:**
   ```bash
   # Open HTTP and WebSocket port
   sudo ufw allow 3000/tcp

   # Open mediasoup RTC port range (UDP & TCP)
   sudo ufw allow 40000:49999/udp
   sudo ufw allow 40000:49999/tcp
   sudo ufw reload
   ```
3. **Run with PM2:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "peerlink-server"
   pm2 save
   ```

---

## Graceful Shutdown & Resilience

The server handles POSIX signals (`SIGTERM`, `SIGINT`) to guarantee zero orphaned resources:

1. Rejects incoming WebSocket connections and terminates active client sockets.
2. Closes the HTTP listener to stop receiving new REST requests.
3. Disconnects from MongoDB and Redis pools.
4. Closes the mediasoup Worker process (`worker.close()`), destroying all native C++ router and transport memory allocations.
5. If shutdown hangs longer than 10 seconds, a safety timeout triggers `process.exit(1)`.
