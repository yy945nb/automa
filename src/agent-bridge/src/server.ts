/**
 * Automa Agent Bridge - HTTP + WebSocket Server
 *
 * Exposes a REST API and WebSocket endpoint that translates HTTP requests
 * into AgentCommands, forwards them to the Automa Chrome Extension via
 * ExtensionConnector, and streams events back over WebSocket.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as http from 'http';
import { randomBytes } from 'crypto';

import type { BridgeOptions } from './index';
import { AgentCommand, AgentResponse, WebSocketProtocol } from './protocol';
import {
  ExtensionConnector,
  createConnector,
} from './extension-connector';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_PORT = 8528;
const DEFAULT_TIMEOUT_MS = 30_000;
const VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a URL-safe unique ID (similar to nanoid).
 */
function nanoid(size: number = 21): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  const bytes = randomBytes(size);
  let id = '';
  for (let i = 0; i < size; i++) {
    id += alphabet[bytes[i] & 63];
  }
  return id;
}

function makeCommand(
  action: AgentCommand['type'] | string,
  payload?: Record<string, unknown>
): AgentCommand {
  return {
    id: nanoid(),
    type: action as AgentCommand['type'],
    payload,
    timestamp: Date.now(),
  };
}

/**
 * Send a command through the connector with a timeout.
 * Resolves with the AgentResponse or rejects on timeout / error.
 */
async function sendWithTimeout(
  connector: ExtensionConnector,
  command: AgentCommand,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<AgentResponse> {
  return new Promise<AgentResponse>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Command timed out after ${timeoutMs}ms: ${command.type} (${command.id})`));
    }, timeoutMs);

    connector
      .sendCommand(command)
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// ---------------------------------------------------------------------------
// Server Factory
// ---------------------------------------------------------------------------

/**
 * Create and start the bridge server.
 * Returns the underlying http.Server for lifecycle management.
 */
export async function createBridgeServer(options: BridgeOptions): Promise<http.Server> {
  const port = options.port || DEFAULT_PORT;
  const verbose = options.verbose ?? false;

  // ---- Connector (talks to the Automa extension) ----
  const connector = createConnector(
    options.mode,
    options.extensionId,
    options.chromeDebugPort
  );

  // Connect to the extension
  await connector.connect();
  console.log(`[server] Connected to Automa extension via ${options.mode} mode`);

  // ---- WebSocket protocol (streams events to clients) ----
  const wsProtocol = new WebSocketProtocol();

  // Forward extension events to all WebSocket clients
  connector.on('event', (event) => {
    if (verbose) {
      console.log('[server] Event from extension:', JSON.stringify(event).slice(0, 200));
    }
    wsProtocol.broadcast(event);
  });

  connector.on('error', (err) => {
    console.error('[server] Connector error:', err.message);
    wsProtocol.broadcast({
      type: 'workflow:error' as const,
      data: { error: err.message },
      timestamp: Date.now(),
    });
  });

  connector.on('disconnected', () => {
    console.warn('[server] Connector disconnected from extension');
    wsProtocol.broadcast({
      type: 'workflow:error' as const,
      data: { error: 'Extension disconnected' },
      timestamp: Date.now(),
    });
  });

  // ---- Express app ----
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Request logging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const ts = new Date().toISOString();
    if (verbose) {
      console.log(`[server] ${ts} ${req.method} ${req.url}`);
    }
    next();
  });

  // ------------------------------------------------------------------
  // Helper: handle a REST route by forwarding a command to the connector
  // ------------------------------------------------------------------
  async function handleCommand(
    res: Response,
    action: string,
    payload?: Record<string, unknown>
  ): Promise<void> {
    const command = makeCommand(action, payload);

    try {
      const response = await sendWithTimeout(connector, command);
      if (response.success) {
        res.json({ ok: true, id: response.id, data: response.data });
      } else {
        res.status(400).json({ ok: false, id: response.id, error: response.error });
      }
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message ?? 'Unknown error' });
    }
  }

  // ------------------------------------------------------------------
  // REST API Routes
  // ------------------------------------------------------------------

  // Health check (no command forwarding needed)
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      version: VERSION,
      connected: connector.connected,
      mode: options.mode,
      uptime: process.uptime(),
      timestamp: Date.now(),
    });
  });

  // ---- Workflow routes ----

  app.post('/api/workflow/list', async (_req: Request, res: Response) => {
    await handleCommand(res, 'workflow:list');
  });

  app.post('/api/workflow/execute', async (req: Request, res: Response) => {
    await handleCommand(res, 'workflow:execute', req.body);
  });

  app.post('/api/workflow/stop', async (req: Request, res: Response) => {
    await handleCommand(res, 'workflow:stop', req.body);
  });

  app.post('/api/workflow/status', async (req: Request, res: Response) => {
    await handleCommand(res, 'workflow:status', req.body);
  });

  app.post('/api/workflow/create', async (req: Request, res: Response) => {
    await handleCommand(res, 'workflow:create', req.body);
  });

  app.post('/api/workflow/import', async (req: Request, res: Response) => {
    await handleCommand(res, 'workflow:import', req.body);
  });

  app.post('/api/workflow/export', async (req: Request, res: Response) => {
    await handleCommand(res, 'workflow:export', req.body);
  });

  // ---- Recording routes ----

  app.post('/api/recording/start', async (_req: Request, res: Response) => {
    await handleCommand(res, 'recording:start');
  });

  app.post('/api/recording/stop', async (_req: Request, res: Response) => {
    await handleCommand(res, 'recording:stop');
  });

  // ---- Tab routes ----

  app.post('/api/tab/open', async (req: Request, res: Response) => {
    await handleCommand(res, 'tab:open', req.body);
  });

  app.get('/api/tab/list', async (_req: Request, res: Response) => {
    await handleCommand(res, 'tab:list');
  });

  // ---- Data routes ----

  app.get('/api/data/:logId', async (req: Request, res: Response) => {
    await handleCommand(res, 'data:get', { logId: req.params.logId });
  });

  // ------------------------------------------------------------------
  // Error handling middleware
  // ------------------------------------------------------------------

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ ok: false, error: 'Not found' });
  });

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[server] Unhandled error:', err);
    res.status(500).json({ ok: false, error: err.message ?? 'Internal server error' });
  });

  // ------------------------------------------------------------------
  // Start HTTP server + attach WebSocket
  // ------------------------------------------------------------------

  return new Promise<http.Server>((resolve, reject) => {
    const server = http.createServer(app);

    // Attach WebSocket server to the same HTTP server at /ws path
    wsProtocol.attach(server);

    // Log WebSocket connections
    wsProtocol.on('client:connected', () => {
      console.log('[server] WebSocket client connected');
    });

    wsProtocol.on('client:disconnected', () => {
      console.log('[server] WebSocket client disconnected');
    });

    // Handle incoming WebSocket messages (commands sent over WS)
    wsProtocol.on('message', async (msg: any, ws: any) => {
      if (verbose) {
        console.log('[server] WS message:', JSON.stringify(msg).slice(0, 200));
      }

      // Support sending commands over WebSocket too
      if (msg.action) {
        const command = makeCommand(msg.action, msg.payload);
        try {
          const response = await sendWithTimeout(connector, command);
          wsProtocol.send(ws, { type: 'response', ...response });
        } catch (err: any) {
          wsProtocol.send(ws, {
            type: 'error',
            id: command.id,
            error: err.message,
            timestamp: Date.now(),
          });
        }
      }
    });

    server.on('error', (err) => {
      reject(err);
    });

    server.listen(port, () => {
      resolve(server);
    });
  });
}
