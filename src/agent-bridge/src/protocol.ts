/**
 * Communication Protocol Definitions
 *
 * Handles encoding/decoding for:
 * - Native Messaging (4-byte length-prefixed JSON over stdio)
 * - WebSocket (JSON messages)
 * - Chrome DevTools Protocol (CDP)
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import * as http from 'http';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface AgentCommand {
  id: string;
  type:
    | 'workflow:list'
    | 'workflow:execute'
    | 'workflow:stop'
    | 'workflow:status'
    | 'workflow:import'
    | 'workflow:export'
    | 'recording:start'
    | 'recording:stop'
    | 'ping';
  payload?: Record<string, unknown>;
  timestamp: number;
}

export interface AgentResponse {
  id: string;
  type: string;
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: number;
}

export interface StreamEvent {
  type: 'workflow:log' | 'workflow:progress' | 'workflow:complete' | 'workflow:error' | 'recording:event';
  stateId?: string;
  data: unknown;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Native Messaging Protocol
// ---------------------------------------------------------------------------

/**
 * Chrome Native Messaging uses 4-byte (uint32 LE) length-prefixed JSON
 * messages over stdin/stdout.
 */
export class NativeMessagingProtocol extends EventEmitter {
  private buffer: Buffer = Buffer.alloc(0);

  /**
   * Encode a message into the native messaging wire format.
   * Returns a Buffer: [4-byte length LE][JSON bytes]
   */
  encode(message: unknown): Buffer {
    const json = JSON.stringify(message);
    const body = Buffer.from(json, 'utf-8');
    const header = Buffer.alloc(4);
    header.writeUInt32LE(body.length, 0);
    return Buffer.concat([header, body]);
  }

  /**
   * Feed raw bytes from stdin into the decoder. Emits 'message' events
   * for each complete message parsed.
   */
  decode(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    while (this.buffer.length >= 4) {
      const messageLength = this.buffer.readUInt32LE(0);

      // Guard against absurdly large messages (1 MB limit per Chrome spec)
      if (messageLength > 1024 * 1024) {
        this.emit('error', new Error(`Message too large: ${messageLength} bytes`));
        this.buffer = Buffer.alloc(0);
        return;
      }

      if (this.buffer.length < 4 + messageLength) {
        // Not enough data yet – wait for more
        return;
      }

      const jsonBuf = this.buffer.subarray(4, 4 + messageLength);
      this.buffer = this.buffer.subarray(4 + messageLength);

      try {
        const message = JSON.parse(jsonBuf.toString('utf-8'));
        this.emit('message', message);
      } catch (err) {
        this.emit('error', new Error(`Failed to parse native message: ${err}`));
      }
    }
  }
}

// ---------------------------------------------------------------------------
// WebSocket Protocol
// ---------------------------------------------------------------------------

/**
 * Simple JSON-over-WebSocket protocol for streaming events between
 * the bridge and Hermes Agent clients.
 */
export class WebSocketProtocol extends EventEmitter {
  private wss: WebSocket.Server | null = null;
  private clients: Set<WebSocket> = new Set();

  /**
   * Attach the WebSocket server to an existing HTTP server.
   */
  attach(server: http.Server): void {
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      this.emit('client:connected', ws);

      ws.on('message', (raw: WebSocket.RawData) => {
        try {
          const message = JSON.parse(raw.toString());
          this.emit('message', message, ws);
        } catch {
          ws.send(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        this.emit('client:disconnected', ws);
      });

      ws.on('error', (err: Error) => {
        this.emit('error', err);
        this.clients.delete(ws);
      });

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: 'connected',
          message: 'Automa Agent Bridge WebSocket',
          timestamp: Date.now(),
        })
      );
    });
  }

  /**
   * Broadcast a message to all connected WebSocket clients.
   */
  broadcast(event: StreamEvent | Record<string, unknown>): void {
    const data = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  /**
   * Send a message to a specific client.
   */
  send(ws: WebSocket, message: unknown): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Close all connections and the server.
   */
  close(): void {
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();
    this.wss?.close();
  }
}

// ---------------------------------------------------------------------------
// Chrome DevTools Protocol (CDP) helper
// ---------------------------------------------------------------------------

export interface CDPTarget {
  id: string;
  type: string;
  title: string;
  url: string;
  webSocketDebuggerUrl?: string;
}

/**
 * Minimal Chrome DevTools Protocol client that can connect to Chrome's
 * remote debugging port, find the Automa extension's service worker, and
 * evaluate JavaScript in that context.
 */
export class ChromeDebugProtocol extends EventEmitter {
  private ws: WebSocket | null = null;
  private commandId = 0;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private debugPort: number;

  constructor(chromeDebugPort: number = 9222) {
    super();
    this.debugPort = chromeDebugPort;
  }

  /**
   * List all available debugging targets from Chrome.
   */
  async listTargets(): Promise<CDPTarget[]> {
    const url = `http://127.0.0.1:${this.debugPort}/json`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to list targets: ${resp.status}`);
    return (await resp.json()) as CDPTarget[];
  }

  /**
   * Find the Automa extension's service worker target.
   */
  async findExtensionTarget(extensionId: string): Promise<CDPTarget | null> {
    const targets = await this.listTargets();
    return (
      targets.find(
        (t) =>
          t.url.includes(extensionId) &&
          (t.type === 'service_worker' || t.type === 'background_page')
      ) ?? null
    );
  }

  /**
   * Connect to a specific target via its WebSocket debugger URL.
   */
  async connect(wsUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.emit('connected');
        resolve();
      });

      this.ws.on('message', (raw: WebSocket.RawData) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.id !== undefined && this.pending.has(msg.id)) {
            const handler = this.pending.get(msg.id)!;
            this.pending.delete(msg.id);
            if (msg.error) {
              handler.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
            } else {
              handler.resolve(msg.result);
            }
          } else {
            // This is a CDP event
            this.emit('event', msg);
          }
        } catch {
          // ignore parse errors
        }
      });

      this.ws.on('error', (err: Error) => {
        this.emit('error', err);
        reject(err);
      });

      this.ws.on('close', () => {
        this.emit('disconnected');
      });
    });
  }

  /**
   * Send a CDP command and wait for its response.
   */
  async send(method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('CDP WebSocket not connected');
    }

    const id = ++this.commandId;
    const message = { id, method, params };

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws!.send(JSON.stringify(message));

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP command timed out: ${method}`));
        }
      }, 30_000);
    });
  }

  /**
   * Evaluate JavaScript in the connected target's context.
   */
  async evaluate(expression: string): Promise<unknown> {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    return (result as Record<string, unknown>)?.result;
  }

  /**
   * Disconnect from the target.
   */
  disconnect(): void {
    this.pending.clear();
    this.ws?.close();
    this.ws = null;
  }
}
