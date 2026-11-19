# PeerLink

> **High-performance, developer-first real-time video conferencing platform powered by WebRTC and a Selective Forwarding Unit (SFU) architecture with mediasoup.**

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.3-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![mediasoup](https://img.shields.io/badge/mediasoup-v3.32-FFA000?logo=webrtc&logoColor=white)](https://mediasoup.org/)
[![Vite](https://img.shields.io/badge/Vite-v6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

---

## Overview

**PeerLink** is a modern, production-grade video communication platform designed to overcome the bandwidth and CPU limitations of traditional mesh (Peer-to-Peer) WebRTC topologies.

By employing **mediasoup** as a **Selective Forwarding Unit (SFU)**, every participant transmits their media streams (audio/video) to the server once. The SFU intelligently inspects RTP packets and forwards them to other participants in the room without transcoding, enabling multi-party conferences with low latency, optimal bandwidth consumption, and seamless scalability.

The platform combines an **Express 5 + WebSocket signaling backend** with a **minimalist, tactile black-and-white React 19 Single Page Application**, supported by complete user authentication, room lifecycle management, and automated test-driven documentation.

---

## System Architecture

PeerLink is split into a modular backend and client application communicating over REST and WebSockets:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PeerLink Client (SPA)                         │
│   React 19 + Vite + React Router 6 + Minimalist Monochrome UI          │
│   ├── mediasoup-client (WebRTC Transports, Device, Producers/Consumers)│
│   └── WebSocket Client (Signaling RPC & Broadcast Events)              │
└──────────────────┬─────────────────────────────▲───────────────────────┘
                   │                             │
       REST (HTTP) │             WebSocket (WS)  │ WebRTC (UDP/TCP)
       Auth / Rooms│             Signaling       │ Audio / Video RTP
                   ▼                             │
┌────────────────────────────────────────────────┴───────────────────────┐
│                          PeerLink Server                               │
│                                                                        │
│  ┌───────────────────────┐           ┌──────────────────────────────┐  │
│  │      Express 5        │           │    Native WebSocket Server   │  │
│  │   REST API Gateway    │           │     (Signaling & Routing)    │  │
│  │                       │           │                              │  │
│  │ • /api/auth           │           │ • Request/Response RPC       │  │
│  │ • /api/rooms          │           │ • Broadcasts & Room State    │  │
│  │ • /api/users          │           │ • Transport & Track Signals  │  │
│  │ • /api/system         │           │                              │  │
│  └───────────┬───────────┘           └──────────────┬───────────────┘  │
│              │                                      │                  │
│              ▼                                      ▼                  │
│  ┌───────────────────────┐           ┌──────────────────────────────┐  │
│  │ Persistence & Cache   │           │      mediasoup SFU Engine    │  │
│  │ • MongoDB (Mongoose)  │           │ • C++ Worker Processes       │  │
│  │ • Redis (OTP & Cache) │           │ • Routers (per room)         │  │
│  │ • ImageKit (Avatars)  │           │ • WebRtcTransports           │  │
│  │ • Nodemailer (Gmail)  │           │ • Audio/Video Producers      │  │
│  └───────────────────────┘           │ • Consumers (Fan-out)        │  │
│                                      └──────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Media Flow (SFU vs. Mesh)

Instead of $N \times (N - 1)$ connections in a mesh topology, PeerLink establishes $1$ upstream transport (for sending) and $1$ downstream transport (for receiving) per client:

- **Producer:** Captures microphone/camera stream and transmits to the room's mediasoup router.
- **Router:** Routes streams in memory without re-encoding, preserving cryptographic SRTP payloads.
- **Consumer:** Pulls incoming remote tracks down to participants with adaptive pause/resume capabilities.

---

## Key Features

- **WebRTC SFU Media Engine:**
  - High-throughput audio and video routing via **mediasoup v3**.
  - Dual WebRtcTransport architecture (Dedicated Send & Receive transports).
  - Opus audio (48kHz stereo) and VP8 video codecs with configurable bitrates.
  - Active track controls: mute/unmute audio, start/stop video, participant departure teardown.
- **Real-Time Signaling Protocol:**
  - Lightweight, bidirectional JSON signaling over native WebSockets (`ws`).
  - Correlation-ID based request-response pattern (`requestId` / `responseId`).
  - Push broadcasts for participant joins/leaves and newly available remote tracks.
- **Secure Authentication & User Management:**
  - Standard email/password registration with BCrypt hashing.
  - 6-digit OTP verification via Redis TTL caching & automated email delivery (Nodemailer/Gmail OAuth2).
  - Secure JWT authentication stored in HTTP-only cookies with Bearer header fallback.
  - User profiles with optional ImageKit CDN avatar hosting.
- **Dynamic Room Orchestration:**
  - Create temporary or permanent conference rooms with unique meeting codes (e.g. `abc-defg-hij`).
  - Role-based meeting controls (Host vs. Guest).
  - Clean resource cleanup: auto-destroys routers, transports, and producers upon room exit.
- **Minimalist Aesthetic Client:**
  - Purposefully built without bloated component libraries or decorative neon gradients.
  - Clean black & white design system with sharp borders, high-contrast typography, and tactile states.
  - Responsive grid layouts with device selector, microphone/camera test meters, and active speaking indicators.
- **Test-Driven Documentation (TDDoc):**
  - E2E integration tests with Vitest + Supertest automatically capture live HTTP payloads.
  - Auto-generated Markdown API specifications (`docs/api-docs/`).
  - Auto-compiled, import-ready Postman Collection v2.1.0 (`docs/api-docs/postman_collection.json`).

---

## Repository Structure

```text
peer-link/
├── client/                     # Frontend Single Page Application (React 19 + Vite)
│   ├── public/                 # Static public assets
│   ├── src/
│   │   ├── app/                # Root providers, layout shell, and router config
│   │   ├── config/             # Environment, API, and WebSocket URL resolvers
│   │   ├── features/           # Modular domain features:
│   │   │   ├── auth/           # Login, registration, OTP verify, auth context & hooks
│   │   │   ├── rooms/          # Room creation, room discovery, joining workflow
│   │   │   ├── meeting/        # Live call UI, video grid, mediasoup SDK client integration
│   │   │   ├── system/         # Health monitoring & diagnostics UI
│   │   │   └── shared/         # Reusable UI components, Axios instance, modals, toasts
│   │   └── styles/             # Monochrome design system tokens & base CSS
│   ├── .env.example            # Client environment template
│   ├── package.json            # Client dependencies and Vite scripts
│   └── vite.config.js          # Vite build configuration
│
├── server/                     # Backend API & SFU Signaling Server (Node.js + Express 5)
│   ├── scripts/                # Postman collection compilation utility
│   ├── src/
│   │   ├── app.js              # Express app, middleware pipeline, and route mounts
│   │   ├── config/             # Environment, MongoDB, Redis, CORS, mediasoup configs
│   │   ├── middlewares/        # Security (Helmet), error handling, 404 handler
│   │   ├── models/             # Mongoose schemas (User, Room)
│   │   ├── modules/            # Domain modules (auth, room, participant, system)
│   │   ├── services/           # mediasoup Workers/Routers/Transports, Mail, ImageKit
│   │   ├── shared/             # Custom AppError, async handler, constants, Winston logger
│   │   ├── signaling/          # WebSocket server, message validators, RPC action handlers
│   │   └── templates/          # HTML templates for OTP verification emails
│   ├── tests/                  # Vitest E2E integration test suites
│   ├── .env.example            # Server environment template
│   ├── package.json            # Server dependencies, vitest scripts
│   └── server.js               # HTTP/WS server entrypoint & graceful shutdown
│
├── docs/                       # Project documentation & specs
│   ├── api-docs/               # Auto-generated API documentation & Postman collection
│   ├── superpowers/plans/      # Architecture specifications & execution plans
│   ├── final-plan.md           # SFU WebRTC architectural plan
│   └── testing.md              # TDDoc testing methodology guide
│
├── .prettierrc                 # Code formatting configuration
├── package.json                # Root monorepo scripts (formatting, test runners)
└── README.md                   # Main project overview (this file)
```

---

## Quick Start

### 1. Prerequisites

Make sure the following tools are installed on your workstation:

- **Node.js** `>= 20.0.0`
- **npm** `>= 9.0.0`
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI
- **Redis** running locally (`127.0.0.1:6379`) for OTP management and caching
- **Build Tools** (Python 3, C++ compiler like GCC, Clang, or Visual Studio C++ Build Tools) required by `mediasoup` native bindings during `npm install`.

---

### 2. Installation

Clone the repository and install dependencies across root, server, and client:

```bash
# Clone the repository
git clone https://github.com/your-username/peer-link.git
cd peer-link

# Install root dependencies (Prettier, linters)
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Return to root
cd ..
```

---

### 3. Environment Configuration

#### Backend Setup (`server/.env`)

Copy the example file in `server/`:

```bash
cp server/.env.example server/.env
```

Ensure the key variables are configured:

```ini
# Core Server
PORT=3000
NODE_ENV=development
CLIENT_ORIGINS=http://localhost:5173,http://localhost:3000

# Database & Authentication
MONGO_URL=mongodb://127.0.0.1:27017/peerlink
JWT_SECRET_KEY=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Redis (OTP & Cache)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# mediasoup SFU Network
PUBLIC_IP=127.0.0.1
RTC_MIN_PORT=40000
RTC_MAX_PORT=49999
MEDIASOUP_LOG_LEVEL=warn

# Email & OAuth (Optional for local dev)
EMAIL_USER=your_email@gmail.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
```

> **Note for production:** `PUBLIC_IP` must be set to the server's public IPv4 address so remote WebRTC peers can establish UDP/TCP media connectivity. Ensure UDP/TCP ports `40000-49999` are open in your cloud firewall.

#### Frontend Setup (`client/.env`)

Copy the example file in `client/`:

```bash
cp client/.env.example client/.env
```

Review the values:

```ini
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

---

### 4. Running the Application

Open two terminal sessions to run both backend and frontend concurrently:

#### Terminal 1 — Start the Backend

```bash
cd server
npm run dev
```

The server will connect to MongoDB, spawn the mediasoup C++ worker, attach the WebSocket server, and listen on `http://localhost:3000`.

#### Terminal 2 — Start the Frontend

```bash
cd client
npm run dev
```

Vite will start the client development server at `http://localhost:5173`. Open this URL in your browser to access PeerLink.

---

## Available Scripts

### Root Monorepo

| Command                    | Action                                                    |
| :------------------------- | :-------------------------------------------------------- |
| `npm run test`             | Runs the backend Vitest test suites                       |
| `npm run test:api:docs`    | Executes module tests and rebuilds the Postman collection |
| `npm run generate:postman` | Compiles `docs/api-docs/postman_collection.json`          |
| `npm run format`           | Formats all codebase files using Prettier                 |
| `npm run format:check`     | Checks formatting without writing changes                 |

### Server (`/server`)

| Command                    | Action                                                 |
| :------------------------- | :----------------------------------------------------- |
| `npm run dev`              | Starts server with `nodemon` (auto-restarts on change) |
| `npm run start`            | Starts server with `node server.js` (production mode)  |
| `npm run test`             | Runs all Vitest unit and integration test suites       |
| `npm run test:api:docs`    | Runs module suites and compiles Postman collection     |
| `npm run generate:postman` | Rebuilds Postman collection from test metadata         |

### Client (`/client`)

| Command           | Action                                                  |
| :---------------- | :------------------------------------------------------ |
| `npm run dev`     | Launches Vite local development server with HMR         |
| `npm run build`   | Produces an optimized production build in `client/dist` |
| `npm run preview` | Serves the production build locally for verification    |
| `npm run lint`    | Runs ESLint across client components and pages          |

---

## Signaling Protocol Specification

PeerLink implements an RPC-style WebSocket signaling contract between the browser and the server. Every request carries a unique `requestId` and triggers a matching response with `responseId`:

### Client $\to$ Server Actions (`C2S`)

- `JOIN_ROOM`: Registers participant into a conference room.
- `GET_ROUTER_CAPABILITIES`: Fetches mediasoup Router RTP capabilities (`routerRtpCapabilities`).
- `CREATE_TRANSPORT`: Requests creation of a WebRtcTransport (specifying `direction: "send" | "recv"`).
- `CONNECT_TRANSPORT`: Transmits DTLS parameters to establish the WebRTC handshake.
- `PRODUCE`: Registers a local media track (audio or video) and receives a `producerId`.
- `CONSUME`: Requests consumption of a remote participant's producer track.
- `CONSUMER_RESUME`: Unpauses an active consumer to begin receiving RTP packets.
- `LEAVE_ROOM`: Cleanly exits room and closes all associated transports.

### Server $\to$ Client Events (`S2C`)

- `ROOM_JOINED`: Confirms room entry and returns existing participant list.
- `ROUTER_CAPABILITIES`: Returns router media codecs.
- `TRANSPORT_CREATED`: Returns ICE parameters, ICE candidates, and DTLS parameters.
- `TRANSPORT_CONNECTED`: Confirms DTLS connection is live.
- `PRODUCED`: Returns created producer ID.
- `NEW_PRODUCER`: Broadcast to room peers when another participant starts publishing audio/video.
- `CONSUMED`: Returns consumer parameters for local playback.
- `CONSUMER_RESUMED`: Confirms consumer resumed state.
- `CONSUMER_CLOSED`: Notifies client that a remote producer or consumer closed.
- `PARTICIPANT_JOINED`: Broadcast when a new peer joins the room.
- `PARTICIPANT_LEFT`: Broadcast when a peer leaves or disconnects.
- `ERROR`: Standardized error envelope with error message and matching `responseId`.

---

## API Documentation

PeerLink uses **Test-Driven Documentation (TDDoc)**. Live HTTP tests run against active endpoints and generate markdown specs:

| Module                 | Route Prefix               | Documentation                                                  |
| :--------------------- | :------------------------- | :------------------------------------------------------------- |
| **Authentication**     | `/api/auth` & `/api/users` | [docs/api-docs/01_auth_user.md](docs/api-docs/01_auth_user.md) |
| **Rooms**              | `/api/rooms`               | [docs/api-docs/02_rooms.md](docs/api-docs/02_rooms.md)         |
| **System Diagnostics** | `/api/system`              | [docs/api-docs/03_system.md](docs/api-docs/03_system.md)       |

### Importing Postman Collection

A pre-configured, Postman v2.1.0 collection is located at:
`docs/api-docs/postman_collection.json`

1. Open Postman $\to$ Click **Import**.
2. Select `docs/api-docs/postman_collection.json`.
3. Set your collection variable `baseUrl` to `http://localhost:3000`.

---

## Security Best Practices

1. **Helmet & Security Headers:** Express is protected with `helmet` applying strict Content-Security-Policy, anti-MIME sniffing, and frameguard protections.
2. **CORS Isolation:** CORS is strictly gated via `CLIENT_ORIGINS` in production, rejecting unlisted domains.
3. **HTTP-Only Cookies:** Auth tokens are stored in secure HTTP-only cookies (`sameSite: 'lax'` in dev, `'none'` with `secure: true` in production) preventing XSS token harvesting.
4. **WebRTC Media Isolation:** Each meeting room has an isolated mediasoup `Router`. Producers and consumers cannot bridge between distinct rooms.
5. **Port Forwarding Constraints:** Mediasoup workers restrict UDP/TCP traffic to a bounded port range (`40000-49999`), minimizing firewall exposure.

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit your changes: `git commit -m 'feat: add amazing feature'`.
4. Ensure tests and formatting pass: `npm run format:check && npm test`.
5. Push to the branch: `git push origin feature/amazing-feature`.
6. Open a Pull Request.

---
