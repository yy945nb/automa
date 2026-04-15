import { create } from 'zustand';

interface UserState {
  user: any;
  teams: any[];
  retrieved: boolean;
  loadData: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  teams: [],
  retrieved: false,
  loadData: async () => { /* TODO */ },
}));

export default useUserStore;
