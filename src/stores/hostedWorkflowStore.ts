import { create } from 'zustand';
import browser from 'webextension-polyfill';
import { fetchApi } from '@/utils/api';
import {
  registerWorkflowTrigger,
  cleanWorkflowTriggers,
} from '@/utils/workflowTrigger';
import { findTriggerBlock } from '@/utils/helper';

interface HostedWorkflow {
  hostId?: string;
  [key: string]: any;
}

interface HostedWorkflowStore {
  workflows: Record<string, HostedWorkflow>;
  retrieved: boolean;
  // Getters as functions
  getById: (id: string) => HostedWorkflow | undefined;
  toArray: () => HostedWorkflow[];
  // Actions
  loadData: () => Promise<void>;
  insert: (data: HostedWorkflow | HostedWorkflow[], idKey?: string) => Promise<HostedWorkflow | HostedWorkflow[]>;
  delete: (id: string) => Promise<string>;
  update: (options: { id: string; data: Partial<HostedWorkflow> }) => Promise<HostedWorkflow | null>;
  fetchWorkflows: (ids: string[]) => Promise<HostedWorkflow[] | null>;
}

const saveToStorage = async (workflows: Record<string, HostedWorkflow>) => {
  await browser.storage.local.set({ workflowHosts: workflows });
};

export const useHostedWorkflowStore = create<HostedWorkflowStore>((set, get) => ({
  workflows: {},
  retrieved: false,

  getById: (id: string) => get().workflows[id],

  toArray: () => Object.values(get().workflows),

  loadData: async () => {
    const { workflowHosts } = await browser.storage.local.get('workflowHosts');
    set({ workflows: workflowHosts || {}, retrieved: true });
  },

  insert: async (data, idKey = 'hostId') => {
    const updated = { ...get().workflows };
    if (Array.isArray(data)) {
      data.forEach((item) => { updated[idKey] = item; });
    } else {
      updated[idKey] = data;
    }
    set({ workflows: updated });
    await saveToStorage(updated);
    return data;
  },

  delete: async (id: string) => {
    const { [id]: _removed, ...rest } = get().workflows;
    set({ workflows: rest });
    await saveToStorage(rest);
    await cleanWorkflowTriggers(id);
    return id;
  },

  update: async ({ id, data }) => {
    const workflows = get().workflows;
    if (!workflows[id]) return null;

    const updated = { ...workflows, [id]: { ...workflows[id], ...data } };
    set({ workflows: updated });
    await saveToStorage(updated);
    return updated[id];
  },

  fetchWorkflows: async (ids: string[]) => {
    if (!ids || ids.length === 0) return null;

    const response = await fetchApi('/workflows/hosted', {
      auth: true,
      method: 'POST',
      body: JSON.stringify({ hosts: ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);

    const updated = { ...get().workflows };
    const dataToReturn: HostedWorkflow[] = [];

    result.forEach(({ hostId, status, data }: any) => {
      if (status === 'deleted') {
        delete updated[hostId];
        cleanWorkflowTriggers(hostId);
        return;
      }
      if (status === 'updated') {
        const triggerBlock = findTriggerBlock(data.drawflow);
        registerWorkflowTrigger(hostId, triggerBlock);
      }
      data.hostId = hostId;
      dataToReturn.push(data);
      updated[hostId] = data;
    });

    set({ workflows: updated });
    await saveToStorage(updated);

    return dataToReturn;
  },
}));
