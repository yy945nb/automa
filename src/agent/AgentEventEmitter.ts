/**
 * AgentEventEmitter
 *
 * Singleton that pushes AgentEvent messages to all connected clients.
 * Internal Automa code can call `AgentEventEmitter.instance.emit(...)` to
 * broadcast workflow lifecycle events, extracted data, etc.
 */

import { AgentClient, AgentEvent, AgentEventType } from './types';

type EventCallback = (event: AgentEvent) => void;

/* Use `var` so hot-reloads in dev don't reset the singleton. */
var _agentEventEmitterInstance: AgentEventEmitter | null = null;

export class AgentEventEmitter {
  /* -------------------------------------------------------------- */
  /*  Singleton                                                      */
  /* -------------------------------------------------------------- */

  static get instance(): AgentEventEmitter {
    if (!_agentEventEmitterInstance) {
      _agentEventEmitterInstance = new AgentEventEmitter();
    }
    return _agentEventEmitterInstance;
  }

  /* -------------------------------------------------------------- */
  /*  Internal state                                                 */
  /* -------------------------------------------------------------- */

  /** Registered per-event listeners (internal, not clients). */
  private listeners: Map<string, Set<EventCallback>> = new Map();

  /** Connected external clients that receive push events. */
  private clients: Map<string, AgentClient> = new Map();

  private constructor() {
    // private – use AgentEventEmitter.instance
  }

  /* -------------------------------------------------------------- */
  /*  Client management                                              */
  /* -------------------------------------------------------------- */

  /**
   * Register an external client. All future events will be forwarded
   * to this client via its `send` method.
   */
  addClient(client: AgentClient): void {
    this.clients.set(client.id, client);
  }

  /** Remove a client when it disconnects. */
  removeClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  /** Number of currently connected clients. */
  get clientCount(): number {
    return this.clients.size;
  }

  /** Get a snapshot of connected client ids. */
  getClientIds(): string[] {
    return Array.from(this.clients.keys());
  }

  /* -------------------------------------------------------------- */
  /*  Event listener API (internal subscribers)                      */
  /* -------------------------------------------------------------- */

  /**
   * Subscribe to a specific event type.
   * Returns an unsubscribe function for convenience.
   */
  on(eventType: AgentEventType | string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => this.off(eventType, callback);
  }

  /** Remove a previously registered listener. */
  off(eventType: AgentEventType | string, callback: EventCallback): void {
    const set = this.listeners.get(eventType);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /* -------------------------------------------------------------- */
  /*  Emit                                                           */
  /* -------------------------------------------------------------- */

  /**
   * Emit an event. This:
   *   1. Constructs an AgentEvent with a timestamp.
   *   2. Notifies internal listeners registered via `on()`.
   *   3. Pushes the event to all connected external clients.
   */
  emit(eventType: AgentEventType | string, data: any = {}): void {
    const event: AgentEvent = {
      event: eventType,
      data,
      timestamp: new Date().toISOString(),
    };

    // Internal listeners
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      for (const cb of listeners) {
        try {
          cb(event);
        } catch (err) {
          console.error(
            `[AgentEventEmitter] listener error for "${eventType}":`,
            err
          );
        }
      }
    }

    // Wildcard listeners (subscribe to '*')
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      for (const cb of wildcardListeners) {
        try {
          cb(event);
        } catch (err) {
          console.error(
            '[AgentEventEmitter] wildcard listener error:',
            err
          );
        }
      }
    }

    // Push to connected external clients
    this.sendToAll(event);
  }

  /* -------------------------------------------------------------- */
  /*  Push to external clients                                       */
  /* -------------------------------------------------------------- */

  /**
   * Send an AgentEvent to every connected client.
   * Silently removes clients whose send() throws.
   */
  sendToAll(event: AgentEvent): void {
    const deadClients: string[] = [];

    for (const [id, client] of this.clients) {
      try {
        client.send(event);
      } catch (err) {
        console.warn(
          `[AgentEventEmitter] failed to send to client "${id}", removing:`,
          err
        );
        deadClients.push(id);
      }
    }

    for (const id of deadClients) {
      this.clients.delete(id);
    }
  }

  /* -------------------------------------------------------------- */
  /*  Cleanup                                                        */
  /* -------------------------------------------------------------- */

  /** Remove all listeners and clients – useful for tests / teardown. */
  reset(): void {
    this.listeners.clear();
    this.clients.clear();
  }
}

export default AgentEventEmitter;
