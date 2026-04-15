import { create } from 'zustand';

interface PackageState {
  packages: Record<string, any>;
  retrieved: boolean;
  loadData: () => Promise<void>;
}

export const usePackageStore = create<PackageState>((set) => ({
  packages: {},
  retrieved: false,
  loadData: async () => { /* TODO */ },
}));

export default usePackageStore;
