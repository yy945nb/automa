/**
 * Agent API Type Definitions
 *
 * Types for the external Agent API that allows AI agents (e.g. Hermes)
 * to control Automa workflows via WebSocket, Native Messaging, or
 * chrome.runtime external messaging.
 */

/* ------------------------------------------------------------------ */
/*  Enums                                                              */
/* ------------------------------------------------------------------ */

export enum AgentCommandType {
  // Workflow commands
  WorkflowList = 'workflow:list',
  WorkflowExecute = 'workflow:execute',
  WorkflowStop = 'workflow:stop',
  WorkflowStatus = 'workflow:status',
  WorkflowCreate = 'workflow:create',
  WorkflowImport = 'workflow:import',
  WorkflowExport = 'workflow:export',

  // Recording commands
  RecordingStart = 'recording:start',
  RecordingStop = 'recording:stop',

  // Tab commands
  TabOpen = 'tab:open',
  TabList = 'tab:list',

  // Data commands
  DataGet = 'data:get',
  StorageQuery = 'storage:query',

  // System commands
  Health = 'health',
}

export enum ConnectionState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Error = 'error',
}

/* ------------------------------------------------------------------ */
/*  Core message interfaces                                            */
/* ------------------------------------------------------------------ */

/** Inbound command from an external agent. */
export interface AgentCommand {
  /** Unique request id – the caller generates this. */
  id: string;
  /** One of AgentCommandType values (string form). */
  action: string;
  /** Action-specific payload. */
  payload: any;
  /** Optional per-command timeout in milliseconds. */
  timeout?: number;
}

/** Outbound response sent back to the caller. */
export interface AgentResponse {
  /** Mirrors the request id from AgentCommand. */
  id: string;
  success: boolean;
  data?: any;
  error?: string;
}

/** Push event sent to all connected clients. */
export interface AgentEvent {
  event: string;
  data: any;
  /** ISO-8601 timestamp. */
  timestamp: string;
}

/* ------------------------------------------------------------------ */
/*  Payload interfaces                                                 */
/* ------------------------------------------------------------------ */

export interface WorkflowExecutePayload {
  workflowId: string;
  variables?: Record<string, any>;
  options?: Record<string, any>;
}

export interface WorkflowCreatePayload {
  name: string;
  description?: string;
  drawflow?: any;
  table?: any;
  settings?: Record<string, any>;
}

export interface WorkflowImportPayload {
  /** Serialised JSON string or parsed workflow object. */
  workflow: any;
}

export interface TabOpenPayload {
  url: string;
  active?: boolean;
  windowId?: number;
}

export interface DataGetPayload {
  workflowId: string;
  key?: string;
}

export interface StorageQueryPayload {
  key: string;
}

/* ------------------------------------------------------------------ */
/*  Event types (string union for convenience)                         */
/* ------------------------------------------------------------------ */

export type AgentEventType =
  | 'workflow:started'
  | 'workflow:completed'
  | 'workflow:error'
  | 'workflow:log'
  | 'data:extracted';

/* ------------------------------------------------------------------ */
/*  Client handle – represents a connected external consumer           */
/* ------------------------------------------------------------------ */

export interface AgentClient {
  id: string;
  type: 'port' | 'native' | 'websocket';
  send: (msg: AgentResponse | AgentEvent) => void;
  state: ConnectionState;
}
