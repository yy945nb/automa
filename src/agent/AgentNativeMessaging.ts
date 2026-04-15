/**
 * AgentNativeMessaging
 *
 * Handles the Chrome Native Messaging protocol for communication with a
 * native host application (e.g. the Hermes agent desktop process).
 *
 * Uses chrome.runtime.connectNative('com.hermes.automa_agent') to establish
 * a persistent connection. Incoming JSON messages are decoded and routed
 * through AgentCommandHandler; responses are sent back via the native port.
 *
 * Singleton – use AgentNativeMessaging.instance.
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

const NATIVE_HOST_NAME = 'com.hermes.automa_agent';
const LOG_PREFIX = '[AgentNativeMessaging]';

/** Reconnect configuration. */
const RECONNECT_INITIAL_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30_000;
const RECONNECT_BACKOFF_FACTOR = 2;

export class AgentNativeMessaging {
  /* ---------------------------------------------------------------- */
  /*  Singleton                                                        */
  /* ---------------------------------------------------------------- */

  private static _instance: AgentNativeMessaging;

  static get instance(): AgentNativeMessaging {
    if (!this._instance) {
      this._instance = new AgentNativeMessaging();
    }
    return this._instance;
  }

  /* ---------------------------------------------------------------- */
  /*  Internal state                                                   */
  /* ---------------------------------------------------------------- */

  private state: ConnectionState = ConnectionState.Disconnected;
  private port: browser.Runtime.Port | null = null;
  private commandHandler: AgentCommandHandler;
  private eventEmitter: AgentEventEmitter;

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay: number = RECONNECT_INITIAL_DELAY_MS;
  private shouldReconnect: boolean = false;
  private clientId: string = 'native-host';

  private constructor() {
    this.commandHandler = new AgentCommandHandler();
    this.eventEmitter = AgentEventEmitter.instance;
  }

  /* ---------------------------------------------------------------- */
  /*  Initialisation                                                   */
  /* ---------------------------------------------------------------- */

  /**
   * Connect to the native host and start listening for messages.
   * Safe to call multiple times – reconnects if already disconnected.
   */
  init(): void {
    if (this.state === ConnectionState.Connected && this.port) {
      console.warn(`${LOG_PREFIX} Already connected – skipping.`);
      return;
    }

    this.shouldReconnect = true;
    this.connect();
  }

  /* ---------------------------------------------------------------- */
  /*  Connection management                                            */
  /* ---------------------------------------------------------------- */

  /**
   * Establish the native messaging port connection.
   */
  private connect(): void {
    if (this.state === ConnectionState.Connecting) {
      return;
    }

    this.state = ConnectionState.Connecting;
    console.log(`${LOG_PREFIX} Connecting to native host: ${NATIVE_HOST_NAME}`);

    try {
      this.port = browser.runtime.connectNative(NATIVE_HOST_NAME);

      // Listen for incoming messages
      this.port.onMessage.addListener((message: any) => {
        this.handleMessage(message);
      });

      // Handle disconnection
      this.port.onDisconnect.addListener(() => {
        this.handleDisconnect();
      });

      // Register as an AgentClient for push events
      const client: AgentClient = {
        id: this.clientId,
        type: 'native',
        state: ConnectionState.Connected,
        send: (msg: AgentResponse | AgentEvent) => {
          this.sendMessage(msg);
        },
      };
      this.eventEmitter.addClient(client);

      this.state = ConnectionState.Connected;
      this.reconnectDelay = RECONNECT_INITIAL_DELAY_MS;
      console.log(`${LOG_PREFIX} Connected to native host.`);
    } catch (err) {
      console.error(`${LOG_PREFIX} Failed to connect:`, err);
      this.state = ConnectionState.Error;
      this.port = null;
      this.scheduleReconnect();
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Incoming message handling                                        */
  /* ---------------------------------------------------------------- */

  /**
   * Process an incoming JSON message from the native host.
   * Expects AgentCommand shape. Sends AgentResponse back.
   */
  private async handleMessage(message: any): Promise<void> {
    // The native messaging protocol automatically handles JSON decoding,
    // but we still need to validate the shape.
    if (!message || typeof message !== 'object') {
      console.warn(`${LOG_PREFIX} Received non-object message, ignoring.`);
      return;
    }

    // If the message lacks required AgentCommand fields, send an error
    if (!message.id || !message.action) {
      const errorResponse: AgentResponse = {
        id: message.id ?? 'unknown',
        success: false,
        error: 'Invalid AgentCommand: missing id or action',
      };
      this.sendMessage(errorResponse);
      return;
    }

    const cmd: AgentCommand = {
      id: message.id,
      action: message.action,
      payload: message.payload ?? {},
      ...(message.timeout != null ? { timeout: message.timeout } : {}),
    };

    console.log(`${LOG_PREFIX} Received command:`, cmd.action);

    try {
      const response = await this.commandHandler.handleCommand(cmd);
      this.sendMessage(response);
    } catch (err: any) {
      const errorResponse: AgentResponse = {
        id: cmd.id,
        success: false,
        error: err?.message ?? String(err),
      };
      this.sendMessage(errorResponse);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Outgoing messages                                                */
  /* ---------------------------------------------------------------- */

  /**
   * Send a message to the native host.
   * Chrome handles the length-prefix encoding automatically.
   */
  private sendMessage(message: AgentResponse | AgentEvent): void {
    if (!this.port) {
      console.warn(`${LOG_PREFIX} Cannot send – not connected.`);
      return;
    }

    try {
      this.port.postMessage(message);
    } catch (err) {
      console.error(`${LOG_PREFIX} Failed to send message:`, err);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Disconnection & reconnect                                        */
  /* ---------------------------------------------------------------- */

  /**
   * Handle native port disconnection. Logs the error (if any) and
   * schedules a reconnect attempt.
   */
  private handleDisconnect(): void {
    const lastError = browser.runtime.lastError;
    const reason = lastError?.message ?? 'unknown reason';

    console.warn(`${LOG_PREFIX} Disconnected from native host: ${reason}`);

    this.port = null;
    this.state = ConnectionState.Disconnected;
    this.eventEmitter.removeClient(this.clientId);

    if (this.shouldReconnect) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule a reconnect attempt with exponential backoff.
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return; // already scheduled
    }

    if (!this.shouldReconnect) {
      return;
    }

    console.log(
      `${LOG_PREFIX} Scheduling reconnect in ${this.reconnectDelay}ms...`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect) {
        this.connect();
      }
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(
      this.reconnectDelay * RECONNECT_BACKOFF_FACTOR,
      RECONNECT_MAX_DELAY_MS
    );
  }

  /* ---------------------------------------------------------------- */
  /*  State                                                            */
  /* ---------------------------------------------------------------- */

  /** Return current connection state. */
  getState(): ConnectionState {
    return this.state;
  }

  /** Whether we are currently connected to the native host. */
  get isConnected(): boolean {
    return this.state === ConnectionState.Connected && this.port !== null;
  }

  /* ---------------------------------------------------------------- */
  /*  Cleanup                                                          */
  /* ---------------------------------------------------------------- */

  /**
   * Disconnect from the native host and stop reconnect attempts.
   */
  destroy(): void {
    console.log(`${LOG_PREFIX} Destroying native messaging connection...`);

    this.shouldReconnect = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.port) {
      try {
        this.port.disconnect();
      } catch {
        // already disconnected
      }
      this.port = null;
    }

    this.eventEmitter.removeClient(this.clientId);
    this.state = ConnectionState.Disconnected;
    this.reconnectDelay = RECONNECT_INITIAL_DELAY_MS;

    console.log(`${LOG_PREFIX} Destroyed.`);
  }
}

export default AgentNativeMessaging;
