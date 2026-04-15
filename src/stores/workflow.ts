import { create } from 'zustand';

interface WorkflowState {
  workflows: Record<string, any>;
  states: Record<string, any>;
  retrieved: boolean;
  getWorkflows: any[];
  getById: (id: string) => any;
  loadData: () => Promise<void>;
  insert: (data: any) => Promise<any>;
  update: (data: any) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: {},
  states: {},
  retrieved: false,
  getWorkflows: [],
  getById: (id: string) => get().workflows[id] || null,
  loadData: async () => { /* TODO: load from IndexedDB */ },
  insert: async (data: any) => data,
  update: async (data: any) => { /* TODO */ },
  delete: async (id: string) => { /* TODO */ },
}));

export default useWorkflowStore;
