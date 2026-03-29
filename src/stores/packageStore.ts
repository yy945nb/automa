import { create } from 'zustand';
import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';
import { fetchApi } from '@/utils/api';

interface Package {
  id: string;
  name: string;
  icon: string;
  isExtenal: boolean;
  content: any;
  inputs: any[];
  outputs: any[];
  variable: any[];
  settings: { asBlock: boolean };
  data: { edges: any[]; nodes: any[] };
  createdAt?: number;
  [key: string]: any;
}

interface PackageStore {
  packages: Package[];
  sharedPkgs: any[];
  retrieved: boolean;
  sharedRetrieved: boolean;
  // Getters as functions
  getById: (pkgId: string) => Package | undefined;
  isShared: (pkgId: string) => boolean;
  // Actions
  insert: (data: Partial<Package>, newId?: boolean) => Promise<void>;
  update: (options: { id: string; data: Partial<Package> }) => Promise<Package | null>;
  delete: (id: string) => Promise<Package | null>;
  deleteShared: (id: string) => void;
  insertShared: (id: string) => void;
  loadData: (force?: boolean) => Promise<Package[]>;
  loadShared: () => Promise<void>;
}

const defaultPackage: Omit<Package, 'id'> = {
  name: '',
  icon: 'mdiPackageVariantClosed',
  isExtenal: false,
  content: null,
  inputs: [],
  outputs: [],
  variable: [],
  settings: { asBlock: false },
  data: { edges: [], nodes: [] },
};

const savePackagesToStorage = async (packages: Package[]) => {
  await browser.storage.local.set({ savedBlocks: packages });
};

export const usePackageStore = create<PackageStore>((set, get) => ({
  packages: [],
  sharedPkgs: [],
  retrieved: false,
  sharedRetrieved: false,

  getById: (pkgId: string) => get().packages.find((pkg) => pkg.id === pkgId),

  isShared: (pkgId: string) => get().sharedPkgs.some((pkg) => pkg.id === pkgId),

  insert: async (data, newId = true) => {
    const pkg: Package = {
      ...defaultPackage,
      ...data,
      id: newId ? nanoid() : (data.id ?? nanoid()),
      createdAt: Date.now(),
    };
    const packages = [...get().packages, pkg];
    set({ packages });
    await savePackagesToStorage(packages);
  },

  update: async ({ id, data }) => {
    const packages = get().packages;
    const index = packages.findIndex((pkg) => pkg.id === id);
    if (index === -1) return null;

    const updated = packages.map((pkg, i) =>
      i === index ? { ...pkg, ...data } : pkg
    );
    set({ packages: updated });
    await savePackagesToStorage(updated);
    return updated[index];
  },

  delete: async (id: string) => {
    const packages = get().packages;
    const index = packages.findIndex((pkg) => pkg.id === id);
    if (index === -1) return null;

    const deleted = packages[index];
    const updated = packages.filter((pkg) => pkg.id !== id);
    set({ packages: updated });
    await savePackagesToStorage(updated);
    return deleted;
  },

  deleteShared: (id: string) => {
    set((state) => ({
      sharedPkgs: state.sharedPkgs.filter((item) => item.id !== id),
    }));
  },

  insertShared: (id: string) => {
    set((state) => ({ sharedPkgs: [...state.sharedPkgs, { id }] }));
  },

  loadData: async (force = false) => {
    const { packages, retrieved } = get();
    if (retrieved && !force) return packages;

    const { savedBlocks } = await browser.storage.local.get('savedBlocks');
    const loaded: Package[] = savedBlocks || [];
    set({ packages: loaded, retrieved: true });
    return loaded;
  },

  loadShared: async () => {
    try {
      if (get().sharedRetrieved) return;

      const response = await fetchApi('/me/packages', { auth: true });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message);

      set({ sharedPkgs: result, sharedRetrieved: true });
    } catch (error: any) {
      console.error(error.message);
      throw error;
    }
  },
}));
