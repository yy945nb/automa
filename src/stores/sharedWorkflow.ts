import { create } from 'zustand';

interface SharedWorkflowState {
  workflows: Record<string, any>;
  retrieved: boolean;
  loadData: () => Promise<void>;
}

export const useSharedWorkflowStore = create<SharedWorkflowState>((set) => ({
  workflows: {},
  retrieved: false,
  loadData: async () => { /* TODO */ },
}));

export default useSharedWorkflowStore;
