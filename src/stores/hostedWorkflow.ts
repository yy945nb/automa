import { create } from 'zustand';

interface HostedWorkflowState {
  workflows: Record<string, any>;
  retrieved: boolean;
  loadData: () => Promise<void>;
  insert: (data: any) => Promise<any>;
  update: (data: any) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

export const useHostedWorkflowStore = create<HostedWorkflowState>((set) => ({
  workflows: {},
  retrieved: false,
  loadData: async () => { /* TODO */ },
  insert: async (data: any) => data,
  update: async (data: any) => { /* TODO */ },
  delete: async (id: string) => { /* TODO */ },
}));

export default useHostedWorkflowStore;
