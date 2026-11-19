import { S2C } from './constants.js';

export class SignalingClient {
  constructor() {
    this.ws = null;
    this.pendingRequests = new Map();
    this.listeners = new Map();
    this.isConnected = false;
  }

  connect(url) {
    return new Promise((resolve, reject) => {
      try {
        console.log('[Signaling] Connecting to:', url);
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.isConnected = true;
          console.log('[Signaling] Connected successfully');
          this.emit('connected');
          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('[Signaling] WebSocket error:', error);
          this.emit('error', error);
          if (!this.isConnected) {
            reject(new Error(`WebSocket connection failed to ${url}`));
          }
        };

        this.ws.onclose = (event) => {
          console.log('[Signaling] WebSocket closed:', event.code, event.reason);
          this.isConnected = false;
          // Reject any pending requests
          for (const [requestId, { reject }] of this.pendingRequests.entries()) {
            reject(new Error('WebSocket closed before response'));
            this.pendingRequests.delete(requestId);
          }
          this.emit('disconnected', event);
        };

        this.ws.onmessage = (messageEvent) => {
          try {
            const data = JSON.parse(messageEvent.data);
            const { type, payload } = data;
            console.log(`[Signaling ← ${type}]`, payload);

            // Check if this message resolves an outstanding request
            if (payload?.responseId && this.pendingRequests.has(payload.responseId)) {
              const { resolve, reject } = this.pendingRequests.get(payload.responseId);
              this.pendingRequests.delete(payload.responseId);

              if (type === S2C.ERROR) {
                reject(new Error(payload.message || 'Server error'));
              } else {
                resolve(payload);
              }
              return;
            }

            // Otherwise dispatch as server-to-client broadcast event
            this.emit(type, payload);
          } catch (err) {
            console.error('Failed to parse WS message:', err);
          }
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  request(type, payload = {}, timeoutMs = 8000) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('Signaling socket is not connected'));
    }

    const requestId = Math.random().toString(36).substring(2, 11);
    console.log(`[Signaling → ${type}] (reqId: ${requestId})`, payload);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error(`Request timeout for ${type}`));
        }
      }, timeoutMs);

      this.pendingRequests.set(requestId, {
        resolve: (data) => {
          clearTimeout(timer);
          resolve(data);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });

      this.ws.send(JSON.stringify({ requestId, type, payload }));
    });
  }

  send(type, payload = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type, payload }));
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
          console.error(`Error in event listener for ${event}:`, err);
        }
      }
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
}
