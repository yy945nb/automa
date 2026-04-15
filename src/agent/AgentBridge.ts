/**
 * AgentBridge
 *
 * Core bridge class that connects external AI agents (e.g. Hermes) to
 * the Automa extension via chrome.runtime external messaging and
 * persistent port connections.
 *
 * Singleton – use AgentBridge.instance.
 */

import browser from 'webextension-polyfill';
import {
  AgentCommand,
  AgentResponse,
  AgentEvent,
  AgentClient,
  ConnectionState,
} from './types';
import { AgentCommandHandler } from './AgentCommandHandler';
import { AgentEventEmitter } from './AgentEventEmitter';

const PORT_NAME = 'hermes-agent';
const LOG_PREFIX = '[AgentBridge]';

export class AgentBridge {
  /* ---------------------------------------------------------------- */
  /*  Singleton                                                        */
  /* ---------------------------------------------------------------- */

  private static _instance: AgentBridge;

  static get instance(): AgentBridge {
    if (!this._instance) {
      this._instance = new AgentBridge();
    }
    return this._instance;
  }

  /* ---------------------------------------------------------------- */
  /*  Internal state                                                   */
  /* ---------------------------------------------------------------- */

  private state: ConnectionState = ConnectionState.Disconnected;
  private ports: Map<string, browser.Runtime.Port> = new Map();
  private commandHandler: AgentCommandHandler;
  private eventEmitter: AgentEventEmitter;

  /** Bound references so we can remove listeners on destroy(). */
  private boundOnMessageExternal: (
    message: any,
    sender: browser.Runtime.MessageSender
  ) => Promise<AgentResponse> | undefined;
  private boundOnConnectExternal: (port: browser.Runtime.Port) => void;

  private constructor() {
    this.commandHandler = new AgentCommandHandler();
    this.eventEmitter = AgentEventEmitter.instance;

    this.boundOnMessageExternal = this.handleExternalMessage.bind(this);
    this.boundOnConnectExternal = this.handlePortConnect.bind(this);
  }

  /* ---------------------------------------------------------------- */
  /*  Initialisation                                                   */
  /* ---------------------------------------------------------------- */

  /**
   * Register external messaging listeners. Call once from background
   * script startup.
   */
  init(): void {
    if (this.state === ConnectionState.Connected) {
      console.warn(`${LOG_PREFIX} Already initialised – skipping.`);
      return;
    }

    try {
      this.state = ConnectionState.Connecting;

      // One-shot external messages (from extensions / web pages with externally_connectable)
      browser.runtime.onMessageExternal.addListener(
        this.boundOnMessageExternal as any
      );

      // Persistent port connections
      browser.runtime.onConnectExternal.addListener(
        this.boundOnConnectExternal as any
      );

      this.state = ConnectionState.Connected;
      console.log(`${LOG_PREFIX} Initialised – listening for external connections.`);
    } catch (err) {
      this.state = ConnectionState.Error;
      console.error(`${LOG_PREFIX} Failed to initialise:`, err);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  External one-shot messages                                       */
  /* ---------------------------------------------------------------- */

  /**
   * Handler for chrome.runtime.onMessageExternal.
   * Expects the message to conform to AgentCommand shape.
   * Returns a Promise<AgentResponse>.
   */
  private handleExternalMessage(
    message: any,
    sender: browser.Runtime.MessageSender
  ): Promise<AgentResponse> | undefined {
    // Basic shape validation
    if (!message || typeof message !== 'object' || !message.id || !message.action) {
      return Promise.resolve({
        id: message?.id ?? 'unknown',
        success: false,
        error: 'Invalid AgentCommand: missing id or action',
      });
    }

    const cmd: AgentCommand = {
      id: message.id,
      action: message.action,
      payload: message.payload ?? {},
      ...(message.timeout != null ? { timeout: message.timeout } : {}),
    };

    console.log(
      `${LOG_PREFIX} External message from ${sender.id ?? 'unknown'}:`,
      cmd.action
    );

    return this.commandHandler.handleCommand(cmd);
  }

  /* ---------------------------------------------------------------- */
  /*  Persistent port connections                                      */
  /* ---------------------------------------------------------------- */

  /**
   * Handler for chrome.runtime.onConnectExternal.
   * Only accepts ports named 'hermes-agent'.
   */
  private handlePortConnect(port: browser.Runtime.Port): void {
    if (port.name !== PORT_NAME) {
      console.warn(
        `${LOG_PREFIX} Rejected port with unexpected name: "${port.name}"`
      );
      port.disconnect();
      return;
    }

    const portId =
      port.sender?.id ??
      `port-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    console.log(`${LOG_PREFIX} Port connected: ${portId}`);
    this.ports.set(portId, port);

    // Register this port as an AgentClient so it receives push events
    const client: AgentClient = {
      id: portId,
      type: 'port',
      state: ConnectionState.Connected,
      send: (msg: AgentResponse | AgentEvent) => {
        try {
          port.postMessage(msg);
        } catch {
          // Port may have disconnected – will be cleaned up by onDisconnect
        }
      },
    };
    this.eventEmitter.addClient(client);

    // Listen for messages on this port
    port.onMessage.addListener((message: any) => {
      this.handlePortMessage(portId, message);
    });

    // Cleanup on disconnect
    port.onDisconnect.addListener(() => {
      this.handlePortDisconnect(portId);
    });
  }

  /**
   * Process an incoming message on a connected port.
   * Expects AgentCommand shape; sends AgentResponse back on the same port.
   */
  private async handlePortMessage(portId: string, message: any): Promise<void> {
    const port = this.ports.get(portId);
    if (!port) {
      console.warn(`${LOG_PREFIX} Message on unknown port: ${portId}`);
      return;
    }

    if (!message || typeof message !== 'object' || !message.id || !message.action) {
      const errorResponse: AgentResponse = {
        id: message?.id ?? 'unknown',
        success: false,
        error: 'Invalid AgentCommand: missing id or action',
      };
      try {
        port.postMessage(errorResponse);
      } catch {
        // Port may already be disconnected
      }
      return;
    }

    const cmd: AgentCommand = {
      id: message.id,
      action: message.action,
      payload: message.payload ?? {},
      ...(message.timeout != null ? { timeout: message.timeout } : {}),
    };

    console.log(`${LOG_PREFIX} Port message from ${portId}:`, cmd.action);

    const response = await this.commandHandler.handleCommand(cmd);

    try {
      port.postMessage(response);
    } catch {
      // Port disconnected before we could respond
      console.warn(`${LOG_PREFIX} Could not send response to port ${portId} – disconnected.`);
    }
  }

  /**
   * Cleanup when a port disconnects.
   */
  private handlePortDisconnect(portId: string): void {
    console.log(`${LOG_PREFIX} Port disconnected: ${portId}`);
    this.ports.delete(portId);
    this.eventEmitter.removeClient(portId);
  }

  /* ---------------------------------------------------------------- */
  /*  Event broadcasting                                               */
  /* ---------------------------------------------------------------- */

  /**
   * Broadcast an AgentEvent to all connected ports.
   * This supplements AgentEventEmitter – it directly pushes to ports
   * managed by this bridge.
   */
  broadcastEvent(event: AgentEvent): void {
    const deadPorts: string[] = [];

    for (const [id, port] of this.ports) {
      try {
        port.postMessage(event);
      } catch {
        console.warn(
          `${LOG_PREFIX} Failed to broadcast to port "${id}", removing.`
        );
        deadPorts.push(id);
      }
    }

    for (const id of deadPorts) {
      this.ports.delete(id);
      this.eventEmitter.removeClient(id);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  State                                                            */
  /* ---------------------------------------------------------------- */

  /** Return current connection state. */
  getState(): ConnectionState {
    return this.state;
  }

  /** Number of currently connected ports. */
  get portCount(): number {
    return this.ports.size;
  }

  /* ---------------------------------------------------------------- */
  /*  Cleanup                                                          */
  /* ---------------------------------------------------------------- */

  /**
   * Tear down all connections and remove listeners.
   */
  destroy(): void {
    console.log(`${LOG_PREFIX} Destroying bridge...`);

    // Disconnect all ports
    for (const [id, port] of this.ports) {
      try {
        port.disconnect();
      } catch {
        // already disconnected
      }
      this.eventEmitter.removeClient(id);
    }
    this.ports.clear();

    // Remove external listeners
    try {
      browser.runtime.onMessageExternal.removeListener(
        this.boundOnMessageExternal as any
      );
    } catch {
      // listener may not exist
    }

    try {
      browser.runtime.onConnectExternal.removeListener(
        this.boundOnConnectExternal as any
      );
    } catch {
      // listener may not exist
    }

    this.state = ConnectionState.Disconnected;
    console.log(`${LOG_PREFIX} Destroyed.`);
  }
}

export default AgentBridge;
