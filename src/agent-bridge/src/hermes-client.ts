/**
 * Hermes Automa Client - TypeScript
 *
 * A high-level client library for Hermes Agent to interact with the
 * Automa Agent Bridge server over HTTP (REST) and WebSocket (events).
 *
 * Usage:
 *   import { AutomaClient } from './hermes-client';
 *   const client = new AutomaClient();
 *   client.connect('http://localhost:8528');
 *   const workflows = await client.listWorkflows();
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HealthResponse {
  status: string;
  version: string;
  connected?: boolean;
  mode?: string;
  uptime?: number;
  timestamp?: number;
}

export interface BridgeResponse<T = any> {
  ok: boolean;
  id?: string;
  data?: T;
  error?: string;
}

export interface AutomaClientOptions {
  /** Base URL of the bridge server (default: http://localhost:8528) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

// ---------------------------------------------------------------------------
// AutomaClient
// ---------------------------------------------------------------------------

export class AutomaClient {
  private baseUrl: string = 'http://localhost:8528';
  private wsUrl: string = 'ws://localhost:8528';
  private timeout: number = 30_000;
  private ws: WebSocket | null = null;
  private eventHandlers: Set<(event: any) => void> = new Set();
  private _connected: boolean = false;

  /**
   * Connect to the Automa Agent Bridge server.
   * @param url Base HTTP URL (e.g. http://localhost:8528). WebSocket URL is derived automatically.
   */
  connect(url?: string): void {
    if (url) {
      this.baseUrl = url.replace(/\/$/, '');
      // Derive WebSocket URL from HTTP URL
      this.wsUrl = this.baseUrl.replace(/^http/, 'ws');
    }
    this._connected = true;
  }

  /**
   * Configure client options.
   */
  configure(options: AutomaClientOptions): void {
    if (options.baseUrl) {
      this.connect(options.baseUrl);
    }
    if (options.timeout !== undefined) {
      this.timeout = options.timeout;
    }
  }

  // -----------------------------------------------------------------------
  // Internal HTTP helpers
  // -----------------------------------------------------------------------

  private async request<T = any>(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const init: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      };

      if (method === 'POST' && body !== undefined) {
        init.body = JSON.stringify(body);
      }

      const resp = await fetch(url, init);

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`HTTP ${resp.status}: ${text || resp.statusText}`);
      }

      const json = (await resp.json()) as BridgeResponse<T>;

      if (!json.ok) {
        throw new Error(json.error ?? 'Unknown bridge error');
      }

      return json.data as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${this.timeout}ms: ${method} ${path}`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  private async post<T = any>(path: string, body?: Record<string, unknown>): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  private async get<T = any>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  // -----------------------------------------------------------------------
  // Workflow API
  // -----------------------------------------------------------------------

  /**
   * List all workflows available in the Automa extension.
   */
  async listWorkflows(): Promise<any[]> {
    return this.post<any[]>('/api/workflow/list');
  }

  /**
   * Execute a workflow by ID with optional input variables.
   */
  async executeWorkflow(
    workflowId: string,
    variables?: Record<string, any>
  ): Promise<any> {
    return this.post('/api/workflow/execute', { workflowId, variables });
  }

  /**
   * Stop a running workflow by its state ID.
   */
  async stopWorkflow(stateId: string): Promise<void> {
    await this.post('/api/workflow/stop', { stateId });
  }

  /**
   * Get the execution status of a workflow by state ID.
   */
  async getWorkflowStatus(stateId: string): Promise<any> {
    return this.post('/api/workflow/status', { stateId });
  }

  /**
   * Import a workflow definition into the extension.
   */
  async importWorkflow(workflow: any): Promise<any> {
    return this.post('/api/workflow/import', { workflow });
  }

  /**
   * Export a workflow definition by its ID.
   */
  async exportWorkflow(workflowId: string): Promise<any> {
    return this.post('/api/workflow/export', { workflowId });
  }

  // -----------------------------------------------------------------------
  // Recording API
  // -----------------------------------------------------------------------

  /**
   * Start recording browser actions.
   */
  async startRecording(): Promise<void> {
    await this.post('/api/recording/start');
  }

  /**
   * Stop recording and return the recorded actions/workflow.
   */
  async stopRecording(): Promise<any> {
    return this.post('/api/recording/stop');
  }

  // -----------------------------------------------------------------------
  // Tab API
  // -----------------------------------------------------------------------

  /**
   * Open a new browser tab with the given URL.
   */
  async openTab(url: string): Promise<any> {
    return this.post('/api/tab/open', { url });
  }

  /**
   * List all open browser tabs.
   */
  async listTabs(): Promise<any[]> {
    return this.get<any[]>('/api/tab/list');
  }

  // -----------------------------------------------------------------------
  // Data API
  // -----------------------------------------------------------------------

  /**
   * Get workflow execution data/logs by log ID.
   */
  async getData(logId: string): Promise<any> {
    return this.get(`/api/data/${encodeURIComponent(logId)}`);
  }

  // -----------------------------------------------------------------------
  // Health
  // -----------------------------------------------------------------------

  /**
   * Check bridge server health.
   */
  async health(): Promise<HealthResponse> {
    const url = `${this.baseUrl}/api/health`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const resp = await fetch(url, { signal: controller.signal });
      if (!resp.ok) {
        throw new Error(`Health check failed: HTTP ${resp.status}`);
      }
      return (await resp.json()) as HealthResponse;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Health check timed out');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  // -----------------------------------------------------------------------
  // WebSocket Event Subscription
  // -----------------------------------------------------------------------

  /**
   * Subscribe to real-time events from the bridge via WebSocket.
   * Returns an unsubscribe function.
   *
   * @param handler Callback invoked for each event received
   * @returns A function that, when called, unsubscribes this handler
   *
   * @example
   *   const unsub = client.subscribeEvents((event) => {
   *     console.log('Event:', event);
   *   });
   *   // Later:
   *   unsub();
   */
  subscribeEvents(handler: (event: any) => void): () => void {
    this.eventHandlers.add(handler);

    // Lazily open the WebSocket connection
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connectWebSocket();
    }

    // Return unsubscribe function
    return () => {
      this.eventHandlers.delete(handler);

      // Close WebSocket if no more subscribers
      if (this.eventHandlers.size === 0 && this.ws) {
        this.ws.close();
        this.ws = null;
      }
    };
  }

  private connectWebSocket(): void {
    const wsFullUrl = `${this.wsUrl}/ws`;
    this.ws = new WebSocket(wsFullUrl);

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(
          typeof event.data === 'string' ? event.data : event.data.toString()
        );
        for (const handler of this.eventHandlers) {
          try {
            handler(data);
          } catch (err) {
            console.error('[AutomaClient] Event handler error:', err);
          }
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    this.ws.onclose = () => {
      // Auto-reconnect if there are still subscribers
      if (this.eventHandlers.size > 0) {
        setTimeout(() => {
          if (this.eventHandlers.size > 0) {
            console.log('[AutomaClient] Reconnecting WebSocket...');
            this.connectWebSocket();
          }
        }, 3000);
      }
    };

    this.ws.onerror = (err) => {
      console.error('[AutomaClient] WebSocket error:', err);
    };
  }

  /**
   * Disconnect all connections and clean up.
   */
  disconnect(): void {
    this._connected = false;
    this.eventHandlers.clear();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Default export for convenience
// ---------------------------------------------------------------------------

export default AutomaClient;
