import { create } from 'zustand';
import browser from 'webextension-polyfill';
import defu from 'defu';
import deepmerge from 'lodash.merge';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import { fetchApi } from '@/utils/api';
import firstWorkflows from '@/utils/firstWorkflows';
import { tasks } from '@/utils/shared';
import {
  cleanWorkflowTriggers,
  registerWorkflowTrigger,
} from '@/utils/workflowTrigger';

export interface Workflow {
  id: string;
  name: string;
  icon: string;
  folderId: string | null;
  content: any;
  connectedTable: any;
  drawflow: {
    edges: any[];
    zoom: number;
    nodes: any[];
  };
  table: any[];
  dataColumns: any[];
  description: string;
  trigger: any;
  createdAt: number;
  updatedAt: number;
  isDisabled: boolean;
  settings: Record<string, any>;
  version: string;
  globalData: string;
  [key: string]: any;
}

interface WorkflowStore {
  states: any[];
  workflows: Record<string, Workflow>;
  popupStates: any[];
  retrieved: boolean;
  isFirstTime: boolean;
  // Getters as functions
  getAllStates: () => any[];
  getById: (id: string) => Workflow | undefined;
  getWorkflows: () => Workflow[];
  getWorkflowStates: (id: string) => any[];
  // Actions
  loadData: () => Promise<void>;
  updateStates: (newStates: any[]) => void;
  insert: (data: Partial<Workflow> | Partial<Workflow>[], options?: { duplicateId?: boolean }) => Promise<Record<string, Workflow>>;
  update: (options: { id: string | ((wf: Workflow) => boolean); data?: Partial<Workflow>; deep?: boolean }) => Promise<Record<string, Workflow> | null>;
  insertOrUpdate: (data: Partial<Workflow>[], options?: { checkUpdateDate?: boolean; duplicateId?: boolean }) => Promise<Record<string, Workflow>>;
  delete: (id: string | string[]) => Promise<string | string[]>;
}

const buildDefaultWorkflow = (data: Partial<Workflow> | null = null, options: { duplicateId?: boolean } = {}): Workflow => {
  let workflowData: Workflow = {
    id: nanoid(),
    name: '',
    icon: 'riGlobalLine',
    folderId: null,
    content: null,
    connectedTable: null,
    drawflow: {
      edges: [],
      zoom: 1.3,
      nodes: [
        {
          position: { x: 100, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300 },
          id: nanoid(),
          label: 'trigger',
          data: tasks.trigger.data,
          type: tasks.trigger.component,
        },
      ],
    },
    table: [],
    dataColumns: [],
    description: '',
    trigger: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDisabled: false,
    settings: {
      publicId: '',
      aipowerToken: '',
      blockDelay: 0,
      saveLog: true,
      debugMode: false,
      restartTimes: 3,
      notification: true,
      execContext: 'popup',
      reuseLastState: false,
      inputAutocomplete: true,
      onError: 'stop-workflow',
      executedBlockOnWeb: false,
      insertDefaultColumn: false,
      defaultColumnName: 'column',
    },
    version: browser.runtime.getManifest().version,
    globalData: '{\n\t"key": "value"\n}',
  };

  if (data) {
    if (options.duplicateId && data.id) {
      delete workflowData.id;
    }
    if (data.drawflow?.nodes && data.drawflow.nodes.length > 0) {
      workflowData.drawflow.nodes = [];
    }
    workflowData = defu(data, workflowData) as Workflow;
  }

  return workflowData;
};

const convertWorkflowsToObject = (workflows: Workflow[] | Record<string, Workflow>): Record<string, Workflow> => {
  if (Array.isArray(workflows)) {
    return workflows.reduce<Record<string, Workflow>>((acc, wf) => {
      acc[wf.id] = wf;
      return acc;
    }, {});
  }
  return workflows;
};

const saveWorkflowsToStorage = async (workflows: Record<string, Workflow>) => {
  await browser.storage.local.set({ workflows });
};

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  states: [],
  workflows: {},
  popupStates: [],
  retrieved: false,
  isFirstTime: false,

  getAllStates: () => {
    const { states, popupStates } = get();
    return [...popupStates, ...states];
  },

  getById: (id: string) => get().workflows[id],

  getWorkflows: () => Object.values(get().workflows),

  getWorkflowStates: (id: string) => {
    const { states, popupStates } = get();
    return [...states, ...popupStates].filter(({ workflowId }) => workflowId === id);
  },

  loadData: async () => {
    const { workflows, isFirstTime } = await browser.storage.local.get([
      'workflows',
      'isFirstTime',
    ]);

    let localWorkflows = workflows || {};

    if (isFirstTime) {
      localWorkflows = (firstWorkflows as any[]).map((wf) => buildDefaultWorkflow(wf));
      await browser.storage.local.set({ isFirstTime: false, workflows: localWorkflows });
    }

    set({
      isFirstTime: Boolean(isFirstTime),
      workflows: convertWorkflowsToObject(localWorkflows),
      retrieved: true,
    });
  },

  updateStates: (newStates: any[]) => {
    set({ states: newStates });
  },

  insert: async (data, options = {}) => {
    const insertedWorkflows: Record<string, Workflow> = {};
    const current = get().workflows;
    const updated = { ...current };

    const processItem = (item: Partial<Workflow>) => {
      const copy = { ...item };
      if (!options.duplicateId) delete copy.id;
      const wf = buildDefaultWorkflow(copy, options);
      updated[wf.id] = wf;
      insertedWorkflows[wf.id] = wf;
    };

    if (Array.isArray(data)) {
      data.forEach(processItem);
    } else {
      processItem(data);
    }

    set({ workflows: updated });
    await saveWorkflowsToStorage(updated);

    return insertedWorkflows;
  },

  update: async ({ id, data = {}, deep = false }) => {
    const isFunction = typeof id === 'function';
    const current = get().workflows;

    if (!isFunction && !current[id as string]) return null;

    const updatedWorkflows: Record<string, Workflow> = {};
    const updated = { ...current };
    const updateData = { ...data, updatedAt: Date.now() };

    const workflowUpdater = (workflowId: string) => {
      if (deep) {
        updated[workflowId] = deepmerge({ ...updated[workflowId] }, updateData);
      } else {
        updated[workflowId] = { ...updated[workflowId], ...updateData };
      }
      updated[workflowId].updatedAt = Date.now();
      updatedWorkflows[workflowId] = updated[workflowId];

      if (!('isDisabled' in data)) return;

      if (data.isDisabled) {
        cleanWorkflowTriggers(workflowId);
      } else {
        const triggerBlock = updated[workflowId].drawflow.nodes?.find(
          (node: any) => node.label === 'trigger'
        );
        if (triggerBlock) registerWorkflowTrigger(workflowId, triggerBlock);
      }
    };

    if (isFunction) {
      Object.values(current).forEach((wf) => {
        if ((id as Function)(wf)) workflowUpdater(wf.id);
      });
    } else {
      workflowUpdater(id as string);
    }

    set({ workflows: updated });
    await saveWorkflowsToStorage(updated);

    return updatedWorkflows;
  },

  insertOrUpdate: async (data = [], { checkUpdateDate = false, duplicateId = false } = {}) => {
    const current = get().workflows;
    const updated = { ...current };
    const insertedData: Record<string, Workflow> = {};

    data.forEach((item) => {
      const existing = current[item.id as string];
      if (existing) {
        let shouldInsert = true;
        if (checkUpdateDate && existing.createdAt && item.updatedAt) {
          shouldInsert = dayjs(existing.updatedAt).isBefore(item.updatedAt);
        }
        if (shouldInsert) {
          const merged = deepmerge({ ...existing }, item);
          updated[item.id as string] = merged;
          insertedData[item.id as string] = merged;
        }
      } else {
        const wf = buildDefaultWorkflow(item, { duplicateId });
        updated[wf.id] = wf;
        insertedData[wf.id] = wf;
      }
    });

    set({ workflows: updated });
    await saveWorkflowsToStorage(updated);

    return insertedData;
  },

  delete: async (id) => {
    const current = get().workflows;
    const updated = { ...current };

    if (Array.isArray(id)) {
      id.forEach((wfId) => delete updated[wfId]);
    } else {
      delete updated[id];
    }

    set({ workflows: updated });

    await cleanWorkflowTriggers(id as any);

    // Lazy import to avoid circular deps
    const { useUserStore } = await import('./userStore');
    const userStore = useUserStore.getState();

    const idsToCheck = Array.isArray(id) ? id : [id];
    for (const wfId of idsToCheck) {
      const hostedWorkflow = userStore.hostedWorkflows[wfId];
      const backupIndex = userStore.backupIds.indexOf(wfId);

      if (hostedWorkflow || backupIndex !== -1) {
        const response = await fetchApi(`/me/workflows?id=${wfId}`, {
          auth: true,
          method: 'DELETE',
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        if (backupIndex !== -1) {
          const newBackupIds = [...userStore.backupIds];
          newBackupIds.splice(backupIndex, 1);
          useUserStore.setState({ backupIds: newBackupIds });
          await browser.storage.local.set({ backupIds: newBackupIds });
        }
      }
    }

    await browser.storage.local.remove(
      idsToCheck.flatMap((wfId) => [`state:${wfId}`, `draft:${wfId}`, `draft-team:${wfId}`])
    );

    await saveWorkflowsToStorage(updated);

    const { pinnedWorkflows } = await browser.storage.local.get('pinnedWorkflows');
    if (pinnedWorkflows) {
      const idsSet = new Set(idsToCheck);
      const filtered = pinnedWorkflows.filter((pid: string) => !idsSet.has(pid));
      if (filtered.length !== pinnedWorkflows.length) {
        await browser.storage.local.set({ pinnedWorkflows: filtered });
      }
    }

    return id;
  },
}));
