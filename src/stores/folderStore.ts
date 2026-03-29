import { create } from 'zustand';
import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';

interface Folder {
  id: string;
  name: string;
  [key: string]: any;
}

interface FolderStore {
  items: Folder[];
  retrieved: boolean;
  load: () => Promise<Folder[]>;
  addFolder: (name: string) => Promise<Folder>;
  updateFolder: (id: string, data: Partial<Folder>) => Promise<Folder | null>;
  deleteFolder: (id: string) => Promise<number | null>;
}

const saveFoldersToStorage = async (items: Folder[]) => {
  await browser.storage.local.set({ folders: items });
};

export const useFolderStore = create<FolderStore>((set, get) => ({
  items: [],
  retrieved: false,

  load: async () => {
    const { folders } = await browser.storage.local.get('folders');
    const items: Folder[] = folders || [];
    set({ items, retrieved: true });
    return items;
  },

  addFolder: async (name: string) => {
    const folder: Folder = { id: nanoid(), name };
    const items = [...get().items, folder];
    set({ items });
    await saveFoldersToStorage(items);
    return folder;
  },

  updateFolder: async (id: string, data: Partial<Folder>) => {
    const items = get().items;
    const index = items.findIndex((f) => f.id === id);
    if (index === -1) return null;

    const updated = items.map((f, i) => (i === index ? { ...f, ...data } : f));
    set({ items: updated });
    await saveFoldersToStorage(updated);
    return updated[index];
  },

  deleteFolder: async (id: string) => {
    const items = get().items;
    const index = items.findIndex((f) => f.id === id);
    if (index === -1) return null;

    const updated = items.filter((f) => f.id !== id);
    set({ items: updated });
    await saveFoldersToStorage(updated);
    return index;
  },
}));
