import { create } from 'zustand';
import browser from 'webextension-polyfill';
import lodashDeepmerge from 'lodash.merge';
import { cleanWorkflowTriggers } from '@/utils/workflowTrigger';

type TeamWorkflows = Record<string, Record<string, any>>;

interface TeamWorkflowStore {
  workflows: TeamWorkflows;
  retrieved: boolean;
  // Getters as functions
  toArray: () => any[];
  getByTeam: (teamId: string) => any[];
  getById: (teamId: string, id: string) => any | null;
  // Actions
  insert: (teamId: string, data: any | any[]) => Promise<void>;
  update: (options: { teamId: string; id: string; data: any; deepmerge?: boolean }) => Promise<any | null>;
  delete: (teamId: string, id: string) => Promise<void>;
  loadData: () => Promise<void>;
}

const saveToStorage = async (workflows: TeamWorkflows) => {
  await browser.storage.local.set({ teamWorkflows: workflows });
};

export const useTeamWorkflowStore = create<TeamWorkflowStore>((set, get) => ({
  workflows: {},
  retrieved: false,

  toArray: () => {
    const { workflows } = get();
    return Object.values(workflows).flatMap((team) => Object.values(team));
  },

  getByTeam: (teamId: string) => {
    const { workflows } = get();
    if (!workflows) return [];
    return Object.values(workflows[teamId] || {});
  },

  getById: (teamId: string, id: string) => {
    const { workflows } = get();
    if (!workflows || !workflows[teamId]) return null;
    return workflows[teamId][id] ?? null;
  },

  insert: async (teamId: string, data) => {
    const updated = { ...get().workflows };
    if (!updated[teamId]) updated[teamId] = {};

    const team = { ...updated[teamId] };
    if (Array.isArray(data)) {
      data.forEach((item) => { team[item.id] = item; });
    } else {
      team[data.id] = data;
    }
    updated[teamId] = team;

    set({ workflows: updated });
    await saveToStorage(updated);
  },

  update: async ({ teamId, id, data, deepmerge = false }) => {
    const workflows = get().workflows;
    if (!workflows[teamId]?.[id]) return null;

    const updated = { ...workflows };
    const team = { ...updated[teamId] };

    if (deepmerge) {
      team[id] = lodashDeepmerge({ ...team[id] }, data);
    } else {
      team[id] = { ...team[id], ...data };
    }
    updated[teamId] = team;

    set({ workflows: updated });
    await saveToStorage(updated);

    return updated[teamId][id];
  },

  delete: async (teamId: string, id: string) => {
    const workflows = get().workflows;
    if (!workflows[teamId]) return;

    const updated = { ...workflows };
    const team = { ...updated[teamId] };
    delete team[id];
    updated[teamId] = team;

    set({ workflows: updated });
    await saveToStorage(updated);
    await cleanWorkflowTriggers(id);
  },

  loadData: async () => {
    const { teamWorkflows } = await browser.storage.local.get('teamWorkflows');
    set({ workflows: teamWorkflows || {}, retrieved: true });
  },
}));
