/**
 * Extension Connector
 *
 * Provides multiple strategies to communicate with the Automa Chrome Extension:
 *   1. Native Messaging   – spawn a native-messaging-host stdin/stdout process
 *   2. Chrome DevTools Protocol (CDP) – evaluate JS in the extension service worker
 *   3. Page Injection     – inject commands into an open extension page via CDP
 */

import { EventEmitter } from 'events';
import { ChildProcess, spawn } from 'child_process';
import {
  AgentCommand,
  AgentResponse,
  NativeMessagingProtocol,
  ChromeDebugProtocol,
  StreamEvent,
} from './protocol';
import type { ConnectionMode } from './index';

// ---------------------------------------------------------------------------
// Shared interface
// ---------------------------------------------------------------------------

export interface ExtensionConnector extends EventEmitter {
  connect(): Promise<void>;
  disconnect(): void;
  sendCommand(command: AgentCommand): Promise<AgentResponse>;
  readonly connected: boolean;
}

// ---------------------------------------------------------------------------
// Helper: generate unique IDs
// ---------------------------------------------------------------------------
let counter = 0;
function generateId(): string {
  return `cmd_${Date.now()}_${++counter}`;
}

// ---------------------------------------------------------------------------
// 1. Native Messaging Connector
// ---------------------------------------------------------------------------

export class NativeMessagingConnector extends EventEmitter implements ExtensionConnector {
  private process: ChildProcess | null = null;
  private protocol = new NativeMessagingProtocol();
  private pending = new Map<string, { resolve: (r: AgentResponse) => void; reject: (e: Error) => void }>();
  private _connected = false;
  private hostPath: string;

  get connected(): boolean {
    return this._connected;
  }

  constructor(nativeHostPath?: string) {
    super();
    // Default path — can be overridden
    this.hostPath = nativeHostPath ?? 'automa-bridge';

    this.protocol.on('message', (msg: AgentResponse | StreamEvent) => {
      if ('id' in msg && this.pending.has(msg.id)) {
        const handler = this.pending.get(msg.id)!;
        this.pending.delete(msg.id);
        handler.resolve(msg as AgentResponse);
      } else {
        // Treat as a streaming event
        this.emit('event', msg);
      }
    });

    this.protocol.on('error', (err: Error) => {
      this.emit('error', err);
    });
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.process = spawn(this.hostPath, [], {
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        this.process.stdout!.on('data', (chunk: Buffer) => {
          this.protocol.decode(chunk);
        });

        this.process.stderr!.on('data', (chunk: Buffer) => {
          this.emit('log', chunk.toString());
        });

        this.process.on('error', (err: Error) => {
          this._connected = false;
          this.emit('error', err);
          reject(err);
        });

        this.process.on('exit', (code: number | null) => {
          this._connected = false;
          this.emit('disconnected', code);
        });

        this._connected = true;
        this.emit('connected');
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  disconnect(): void {
    this._connected = false;
    this.process?.kill();
    this.process = null;
    // Reject all pending commands
    for (const [id, handler] of this.pending) {
      handler.reject(new Error('Disconnected'));
      this.pending.delete(id);
    }
  }

  async sendCommand(command: AgentCommand): Promise<AgentResponse> {
    if (!this._connected || !this.process?.stdin) {
      throw new Error('Native messaging host not connected');
    }

    if (!command.id) command.id = generateId();

    return new Promise((resolve, reject) => {
      this.pending.set(command.id, { resolve, reject });

      const encoded = this.protocol.encode(command);
      this.process!.stdin!.write(encoded);

      // Timeout after 60 seconds
      setTimeout(() => {
        if (this.pending.has(command.id)) {
          this.pending.delete(command.id);
          reject(new Error(`Command timed out: ${command.type}`));
        }
      }, 60_000);
    });
  }
}

// ---------------------------------------------------------------------------
// 2. CDP Connector (Service Worker)
// ---------------------------------------------------------------------------

export class CDPConnector extends EventEmitter implements ExtensionConnector {
  private cdp: ChromeDebugProtocol;
  private extensionId: string;
  private _connected = false;

  get connected(): boolean {
    return this._connected;
  }

  constructor(extensionId: string, chromeDebugPort: number = 9222) {
    super();
    this.extensionId = extensionId;
    this.cdp = new ChromeDebugProtocol(chromeDebugPort);

    this.cdp.on('event', (evt: Record<string, unknown>) => {
      this.emit('event', evt);
    });

    this.cdp.on('disconnected', () => {
      this._connected = false;
      this.emit('disconnected');
    });
  }

  async connect(): Promise<void> {
    const target = await this.cdp.findExtensionTarget(this.extensionId);
    if (!target) {
      throw new Error(
        `Could not find Automa extension (${this.extensionId}) in Chrome debugging targets. ` +
          'Make sure Chrome is running with --remote-debugging-port flag.'
      );
    }

    if (!target.webSocketDebuggerUrl) {
      throw new Error('Extension target has no webSocketDebuggerUrl');
    }

    await this.cdp.connect(target.webSocketDebuggerUrl);
    this._connected = true;
    this.emit('connected');
  }

  disconnect(): void {
    this._connected = false;
    this.cdp.disconnect();
  }

  async sendCommand(command: AgentCommand): Promise<AgentResponse> {
    if (!this._connected) {
      throw new Error('CDP not connected to extension');
    }

    if (!command.id) command.id = generateId();

    // Build JS that sends a message through the Automa extension's internal API
    // and returns the response as a JSON string.
    const js = `
      (async () => {
        const command = ${JSON.stringify(command)};

        // Try automa's internal API first
        if (typeof globalThis.__automaApi !== 'undefined') {
          return await globalThis.__automaApi.handleAgentCommand(command);
        }

        // Fallback: use chrome.runtime messaging
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            ${JSON.stringify(command)},
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(response);
              }
            }
          );
        });
      })()
    `;

    const result = await this.cdp.evaluate(js);
    const value = (result as Record<string, unknown>)?.value;

    if (value && typeof value === 'object') {
      return value as AgentResponse;
    }

    return {
      id: command.id,
      type: command.type,
      success: true,
      data: value,
      timestamp: Date.now(),
    };
  }
}

// ---------------------------------------------------------------------------
// 3. Page Injection Connector
// ---------------------------------------------------------------------------

export class PageInjectionConnector extends EventEmitter implements ExtensionConnector {
  private cdp: ChromeDebugProtocol;
  private extensionId: string;
  private _connected = false;

  get connected(): boolean {
    return this._connected;
  }

  constructor(extensionId: string, chromeDebugPort: number = 9222) {
    super();
    this.extensionId = extensionId;
    this.cdp = new ChromeDebugProtocol(chromeDebugPort);
  }

  async connect(): Promise<void> {
    // Look for any page belonging to the extension (popup, options, dashboard)
    const targets = await this.cdp.listTargets();
    const extPage = targets.find(
      (t) => t.url.includes(this.extensionId) && t.type === 'page'
    );

    if (!extPage) {
      // Fallback: try the service worker
      const sw = targets.find(
        (t) =>
          t.url.includes(this.extensionId) &&
          (t.type === 'service_worker' || t.type === 'background_page')
      );
      if (!sw?.webSocketDebuggerUrl) {
        throw new Error(
          `No Automa extension page or service worker found. ` +
            `Extension ID: ${this.extensionId}`
        );
      }
      await this.cdp.connect(sw.webSocketDebuggerUrl);
    } else {
      if (!extPage.webSocketDebuggerUrl) {
        throw new Error('Extension page has no webSocketDebuggerUrl');
      }
      await this.cdp.connect(extPage.webSocketDebuggerUrl);
    }

    this._connected = true;
    this.emit('connected');
  }

  disconnect(): void {
    this._connected = false;
    this.cdp.disconnect();
  }

  async sendCommand(command: AgentCommand): Promise<AgentResponse> {
    if (!this._connected) {
      throw new Error('Not connected to extension page');
    }

    if (!command.id) command.id = generateId();

    const js = `
      (async () => {
        const command = ${JSON.stringify(command)};

        // Try direct API
        if (typeof window.__automaApi !== 'undefined') {
          return await window.__automaApi.handleAgentCommand(command);
        }

        // Try chrome.runtime.sendMessage to the extension
        return new Promise((resolve, reject) => {
          try {
            chrome.runtime.sendMessage(
              '${this.extensionId}',
              command,
              (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              }
            );
          } catch (e) {
            reject(e);
          }
        });
      })()
    `;

    const result = await this.cdp.evaluate(js);
    const value = (result as Record<string, unknown>)?.value;

    if (value && typeof value === 'object') {
      return value as AgentResponse;
    }

    return {
      id: command.id,
      type: command.type,
      success: true,
      data: value,
      timestamp: Date.now(),
    };
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createConnector(
  mode: ConnectionMode,
  extensionId: string,
  chromeDebugPort?: number
): ExtensionConnector {
  switch (mode) {
    case 'native':
      return new NativeMessagingConnector();
    case 'cdp':
      return new CDPConnector(extensionId, chromeDebugPort);
    case 'inject':
      return new PageInjectionConnector(extensionId, chromeDebugPort);
    default:
      throw new Error(`Unknown connection mode: ${mode}`);
  }
}
