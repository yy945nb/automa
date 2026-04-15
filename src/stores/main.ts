import { create } from 'zustand';

interface MainState {
  settings: Record<string, any>;
  logs: any[];
  loading: boolean;
  setSettings: (s: Record<string, any>) => void;
  setLoading: (l: boolean) => void;
}

export const useMainStore = create<MainState>((set) => ({
  settings: {},
  logs: [],
  loading: false,
  setSettings: (s) => set({ settings: s }),
  setLoading: (l) => set({ loading: l }),
}));

export default useMainStore;
