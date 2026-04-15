/**
 * Agent API – Module Index
 *
 * Re-exports all Agent API components and provides a single `initAgent()`
 * bootstrap function for the background script.
 */

export { AgentBridge } from './AgentBridge';
export { AgentCommandHandler } from './AgentCommandHandler';
export { AgentEventEmitter } from './AgentEventEmitter';
export { AgentNativeMessaging } from './AgentNativeMessaging';

export type {
  AgentCommand,
  AgentResponse,
  AgentEvent,
  AgentClient,
  AgentEventType,
  WorkflowExecutePayload,
  WorkflowCreatePayload,
  WorkflowImportPayload,
  TabOpenPayload,
  DataGetPayload,
  StorageQueryPayload,
} from './types';

export {
  AgentCommandType,
  ConnectionState,
} from './types';

/* ------------------------------------------------------------------ */
/*  Bootstrap                                                          */
/* ------------------------------------------------------------------ */

import { AgentBridge } from './AgentBridge';
import { AgentNativeMessaging } from './AgentNativeMessaging';

/**
 * Initialise the Agent API.
 *
 * Call once from the extension background script. Returns a cleanup
 * function that tears down all connections and listeners.
 *
 * Usage:
 * ```ts
 * import { initAgent } from './agent';
 * const cleanup = initAgent();
 * // later…
 * cleanup();
 * ```
 */
export function initAgent(): () => void {
  const bridge = AgentBridge.instance;
  bridge.init();

  const nativeMessaging = AgentNativeMessaging.instance;
  nativeMessaging.init();

  console.log('[Agent] Agent API initialized');

  return () => {
    bridge.destroy();
    nativeMessaging.destroy();
    console.log('[Agent] Agent API destroyed');
  };
}
