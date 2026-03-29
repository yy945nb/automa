import { create } from 'zustand';
import { fetchApi, cacheApi } from '@/utils/api';
import { useUserStore } from './userStore';

interface SharedWorkflow {
  id: string;
  table?: any[];
  dataColumns?: any[];
  createdAt?: number;
  [key: string]: any;
}

interface SharedWorkflowStore {
  workflows: Record<string, SharedWorkflow>;
  // Getters as functions
  toArray: () => SharedWorkflow[];
  getById: (id: string) => SharedWorkflow | null;
  // Actions
  insert: (data: SharedWorkflow | SharedWorkflow[]) => void;
  update: (options: { id: string; data: Partial<SharedWorkflow> }) => SharedWorkflow | null;
  delete: (id: string) => void;
  fetchWorkflows: (useCache?: boolean) => Promise<void>;
}

export const useSharedWorkflowStore = create<SharedWorkflowStore>((set, get) => ({
  workflows: {},

  toArray: () => Object.values(get().workflows),

  getById: (id: string) => get().workflows[id] ?? null,

  insert: (data) => {
    set((state) => {
      const updated = { ...state.workflows };
      if (Array.isArray(data)) {
        data.forEach((item) => { updated[item.id] = item; });
      } else {
        updated[data.id] = data;
      }
      return { workflows: updated };
    });
  },

  update: ({ id, data }) => {
    const workflows = get().workflows;
    if (!workflows[id]) return null;

    const updated = { ...workflows, [id]: { ...workflows[id], ...data } };
    set({ workflows: updated });
    return updated[id];
  },

  delete: (id: string) => {
    set((state) => {
      const { [id]: _removed, ...rest } = state.workflows;
      return { workflows: rest };
    });
  },

  fetchWorkflows: async (useCache = true) => {
    const userStore = useUserStore.getState();
    if (!userStore.user) return;

    const workflows = await cacheApi(
      'shared-workflows',
      async () => {
        try {
          const response = await fetchApi('/me/workflows/shared?data=all', {
            auth: true,
          });

          if (response.status !== 200) throw new Error(response.statusText);

          const result = await response.json();
          return result.reduce((acc: Record<string, SharedWorkflow>, item: any) => {
            item.table = item.table || item.dataColumns || [];
            item.createdAt = new Date(item.createdAt || Date.now()).getTime();
            acc[item.id] = item;
            return acc;
          }, {});
        } catch (error) {
          console.error(error);
          return {};
        }
      },
      useCache
    );

    set({ workflows: workflows || {} });
  },
}));
