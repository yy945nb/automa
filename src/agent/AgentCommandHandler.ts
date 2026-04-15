/**
 * AgentCommandHandler
 *
 * Routes inbound AgentCommand messages to the appropriate Automa
 * extension APIs and returns an AgentResponse.
 */

import browser from 'webextension-polyfill';
import {
  AgentCommand,
  AgentCommandType,
  AgentResponse,
  WorkflowExecutePayload,
  WorkflowCreatePayload,
  WorkflowImportPayload,
  TabOpenPayload,
  DataGetPayload,
  StorageQueryPayload,
} from './types';
import BackgroundWorkflowUtils from '../background/BackgroundWorkflowUtils';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function ok(id: string, data?: any): AgentResponse {
  return { id, success: true, data };
}

function fail(id: string, error: string): AgentResponse {
  return { id, success: false, error };
}

/* ------------------------------------------------------------------ */
/*  Handler                                                            */
/* ------------------------------------------------------------------ */

export class AgentCommandHandler {
  /**
   * Main entry point – dispatches `cmd.action` to the matching handler.
   */
  async handleCommand(cmd: AgentCommand): Promise<AgentResponse> {
    try {
      switch (cmd.action) {
        case AgentCommandType.WorkflowList:
          return await this.workflowList(cmd);
        case AgentCommandType.WorkflowExecute:
          return await this.workflowExecute(cmd);
        case AgentCommandType.WorkflowStop:
          return await this.workflowStop(cmd);
        case AgentCommandType.WorkflowStatus:
          return await this.workflowStatus(cmd);
        case AgentCommandType.WorkflowCreate:
          return await this.workflowCreate(cmd);
        case AgentCommandType.WorkflowImport:
          return await this.workflowImport(cmd);
        case AgentCommandType.WorkflowExport:
          return await this.workflowExport(cmd);
        case AgentCommandType.RecordingStart:
          return await this.recordingStart(cmd);
        case AgentCommandType.RecordingStop:
          return await this.recordingStop(cmd);
        case AgentCommandType.TabOpen:
          return await this.tabOpen(cmd);
        case AgentCommandType.TabList:
          return await this.tabList(cmd);
        case AgentCommandType.DataGet:
          return await this.dataGet(cmd);
        case AgentCommandType.StorageQuery:
          return await this.storageQuery(cmd);
        case AgentCommandType.Health:
          return this.health(cmd);
        default:
          return fail(cmd.id, `Unknown action: ${cmd.action}`);
      }
    } catch (err: any) {
      return fail(cmd.id, err?.message ?? String(err));
    }
  }

  /* -------------------------------------------------------------- */
  /*  Workflow commands                                               */
  /* -------------------------------------------------------------- */

  private async workflowList(cmd: AgentCommand): Promise<AgentResponse> {
    try {
      const { workflows = {}, teamWorkflows = {} } =
        await browser.storage.local.get(['workflows', 'teamWorkflows']);

      const list = Object.values(workflows as Record<string, any>).map(
        (w: any) => ({
          id: w.id,
          name: w.name,
          description: w.description ?? '',
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
          isDisabled: w.isDisabled ?? false,
        })
      );

      const teamList = Object.values(
        teamWorkflows as Record<string, any>
      ).map((w: any) => ({
        id: w.id,
        name: w.name,
        description: w.description ?? '',
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        isTeam: true,
      }));

      return ok(cmd.id, { workflows: list, teamWorkflows: teamList });
    } catch (err: any) {
      return fail(cmd.id, `Failed to list workflows: ${err.message}`);
    }
  }

  private async workflowExecute(cmd: AgentCommand): Promise<AgentResponse> {
    try {
      const payload = cmd.payload as WorkflowExecutePayload;
      if (!payload?.workflowId) {
        return fail(cmd.id, 'Missing workflowId in payload');
      }

      const { workflows = {} } = await browser.storage.local.get('workflows');
      const workflowData = (workflows as Record<string, any>)[
        payload.workflowId
      ];
      if (!workflowData) {
        return fail(cmd.id, `Workflow not found: ${payload.workflowId}`);
      }

      const options: Record<string, any> = {
        ...(payload.options ?? {}),
      };
      if (payload.variables) {
        options.variables = payload.variables;
      }

      const bgUtils = BackgroundWorkflowUtils.instance;
      const result = await bgUtils.executeWorkflow(workflowData, options);

      return ok(cmd.id, { stateId: result?.id ?? null, started: true });
    } catch (err: any) {
      return fail(cmd.id, `Failed to execute workflow: ${err.message}`);
    }
  }

  private async workflowStop(cmd: AgentCommand): Promise<AgentResponse> {
    try {
      const { stateId } = cmd.payload ?? {};
      if (!stateId) {
        return fail(cmd.id, 'Missing stateId in payload');
      }

      const bgUtils = BackgroundWorkflowUtils.instance;
      await bgUtils.stopExecution(stateId);

      return ok(cmd.id, { stopped: true });
    } catch (err: any) {
      return fail(cmd.id, `Failed to stop workflow: ${err.message}`);
    }
  }

  private async workflowStatus(cmd: AgentCommand): Promise<AgentResponse> {
    try {
      const { stateId, workflowId } = cmd.payload ?? {};

      // Try to get running workflow states from the background utils
      const bgUtils = BackgroundWorkflowUtils.instance;
      const states = (bgUtils as any).states ?? (bgUtils as any).workflowStates;

      if (stateId && states) {
        const state = states instanceof Map ? states.get(stateId) : states[stateId];
        if (state) {
          return ok(cmd.id, {
            stateId,
            status: state.status ?? 'unknown',
            workflowId: state.workflowId,
            startedAt: state.startedAt,
          });
        }
      }

      // Fallback: query storage for workflow logs
      if (workflowId) {
        const { workflowStates = {} } =
          await browser.storage.local.get('workflowStates');
        const matches = Object.values(
          workflowStates as Record<string, any>
        ).filter((s: any) => s.workflowId === workflowId);
        return ok(cmd.id, { states: matches });
      }

      return fail(cmd.id, 'Provide stateId or workflowId in payload');
    } catch (err: any) {
      return fail(cmd.id, `Failed to get workflow status: ${err.message}`);
    }
  }

  private async workflowCreate(cmd: AgentCommand): Promise<AgentResponse> {
    try {
      const payload = cmd.payload as WorkflowCreatePayload;
      if (!payload?.name) {
        return fail(cmd.id, 'Missing name in payload');
      }

      const id = `wf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();

      const workflow: Record<string, any> = {
        id,
        name: payload.name,
        description: payload.description ?? '',
        drawflow: payload.drawflow ?? { nodes: [], edges: [] },
        table: payload.table ?? [],
        settings: payload.settings ?? {},
        createdAt: now,
        updatedAt: now,
        isDisabled: false,
        version: 1,
      };

      const { workflows = {} } = await browser.storage.local.get('workflows');
      (workflows as Record<string, any>)[id] = workflow;
      await browser.storage.local.set({ workflows });

      return ok(cmd.id, { id, name: workflow.name, createdAt: now });
    } catch (err: any) {
      return fail(cmd.id, `Failed to create workflow: ${err.message}`);
    }
  }

  private async workflowImport(cmd: AgentCommand): Promise<AgentResponse> {
    try {
      const payload = cmd.payload as WorkflowImportPayload;
      if (!payload?.workflow) {
        return fail(cmd.id, 'Missing workflow in payload');
      }

      const raw =
        typeof payload.workflow === 'string'
          ? JSON.parse(payload.workflow)
          : payload.workflow;

      const id =
        raw.id ??
        `wf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      raw.id = id;
      raw.updatedAt = now;
      raw.createdAt = raw.createdAt ?? now;

      const { workflows = {} } = await browser.storage.local.get('workflows');
      (workflows as Record<string, any>)[id] = raw;
      await browser.storage.local.set({ workflows });

      return ok(cmd.id, { id, imported: true });
    } catch (err: any) {
      return fail(cmd.id, `Failed to import workflow: ${err.message}`);
    }
  }

  private async workflowExport(cmd: AgentCommand): Promise<AgentResponse> {
    try {
      const { workflowId } = cmd.payload ?? {};
      if (!workflowId) {
        return fail(cmd.id, 'Missing workflowId in payload');
      }

      const { workflows = {} } = await browser.storage.local.get('workflows');
      const workflow = (workflows as Record<string, any>)[workflowId];
      if (!workflow) {
        return fail(cmd.id, `Workflow not found: ${workflowId}`);
      }

      return ok(cmd.id, { workflow });
    } catch (err: any) {
      return fail(cmd.id, `Failed to export workflow: ${err.message}`);
    }
  }

  /* -------------------------------------------------------------- */
  /*  Recording commands                                             */
  /* -------------------------------------------------------------- */

  private async recordingStart(cmd: AgentCommand): Promise<AgentResponse> {
    try {
      // Send internal message to start recording
      await browser.runtime.sendMessage({
        type: 'recording:start',
        data: cmd.payload ?? {},
      });
      return ok(cmd.id, { recording: true });
    } catch (err: any) {
      return fail(cmd.id, `Failed to start recording: ${err.message}`);
    }
  }

  private async recordingStop(cmd: AgentCommand): Promise<AgentResponse> {
    try {
      await browser.runtime.sendMessage({
        type: 'recording:stop',
        data: {},
      });
      return ok(cmd.id, { recording: false });
    } catch (err: any) {
      return fail(cmd.id, `Failed to stop recording: ${err.message}`);
    }
  }

  /* -------------------------------------------------------------- */
  /*  Tab commands                                                   */
  /* -------------------------------------------------------------- */

  private async tabOpen(cmd: AgentCommand): Promise<AgentResponse> {
    try {
      const payload = cmd.payload as TabOpenPayload;
      if (!payload?.url) {
        return fail(cmd.id, 'Missing url in payload');
      }

      const tab = await browser.tabs.create({
        url: payload.url,
        active: payload.active ?? true,
        ...(payload.windowId != null ? { windowId: payload.windowId } : {}),
      });

      return ok(cmd.id, {
        tabId: tab.id,
        windowId: tab.windowId,
        url: tab.url,
      });
    } catch (err: any) {
      return fail(cmd.id, `Failed to open tab: ${err.message}`);
    }
  }

  private async tabList(cmd: AgentCommand): Promise<AgentResponse> {
    try {
      const tabs = await browser.tabs.query({});
      const list = tabs.map((t) => ({
        id: t.id,
        windowId: t.windowId,
        url: t.url,
        title: t.title,
        active: t.active,
        status: t.status,
      }));
      return ok(cmd.id, { tabs: list });
    } catch (err: any) {
      return fail(cmd.id, `Failed to list tabs: ${err.message}`);
    }
  }

  /* -------------------------------------------------------------- */
  /*  Data commands                                                  */
  /* -------------------------------------------------------------- */

  private async dataGet(cmd: AgentCommand): Promise<AgentResponse> {
    try {
      const payload = cmd.payload as DataGetPayload;
      if (!payload?.workflowId) {
        return fail(cmd.id, 'Missing workflowId in payload');
      }

      const storageKey = `data:${payload.workflowId}`;
      const result = await browser.storage.local.get(storageKey);
      const data = result[storageKey] ?? null;

      if (payload.key && data && typeof data === 'object') {
        return ok(cmd.id, { value: (data as Record<string, any>)[payload.key] ?? null });
      }

      return ok(cmd.id, { data });
    } catch (err: any) {
      return fail(cmd.id, `Failed to get data: ${err.message}`);
    }
  }

  private async storageQuery(cmd: AgentCommand): Promise<AgentResponse> {
    try {
      const payload = cmd.payload as StorageQueryPayload;
      if (!payload?.key) {
        return fail(cmd.id, 'Missing key in payload');
      }

      const result = await browser.storage.local.get(payload.key);
      return ok(cmd.id, { value: result[payload.key] ?? null });
    } catch (err: any) {
      return fail(cmd.id, `Failed to query storage: ${err.message}`);
    }
  }

  /* -------------------------------------------------------------- */
  /*  System commands                                                */
  /* -------------------------------------------------------------- */

  private health(cmd: AgentCommand): AgentResponse {
    return ok(cmd.id, {
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: typeof performance !== 'undefined' ? performance.now() : 0,
    });
  }
}

export default AgentCommandHandler;
