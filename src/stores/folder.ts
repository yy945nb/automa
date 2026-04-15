import { create } from 'zustand';

interface FolderState {
  folders: any[];
  loadData: () => Promise<void>;
  insert: (data: any) => Promise<any>;
  update: (data: any) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

export const useFolderStore = create<FolderState>((set) => ({
  folders: [],
  loadData: async () => { /* TODO */ },
  insert: async (data: any) => data,
  update: async (data: any) => { /* TODO */ },
  delete: async (id: string) => { /* TODO */ },
}));

export default useFolderStore;
