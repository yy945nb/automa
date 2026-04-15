import { create } from 'zustand';

interface TeamWorkflowState {
  workflows: Record<string, any>;
  retrieved: boolean;
  getByTeam: (teamId: string) => any[];
  loadData: () => Promise<void>;
}

export const useTeamWorkflowStore = create<TeamWorkflowState>((set, get) => ({
  workflows: {},
  retrieved: false,
  getByTeam: (teamId: string) => Object.values(get().workflows).filter((w: any) => w.teamId === teamId),
  loadData: async () => { /* TODO */ },
}));

export default useTeamWorkflowStore;
