import { create } from 'zustand';
import browser from 'webextension-polyfill';
import defu from 'defu';
import deepmerge from 'lodash.merge';
import { fetchGapi, fetchApi } from '@/utils/api';

interface EditorSettings {
  minZoom: number;
  maxZoom: number;
  arrow: boolean;
  snapToGrid: boolean;
  lineType: string;
  saveWhenExecute: boolean;
  snapGrid: Record<string, number>;
}

interface MainSettings {
  locale: string;
  deleteLogAfter: number | 'never';
  logsLimit: number;
  editor: EditorSettings;
}

interface MainStore {
  tabs: any[];
  copiedEls: { edges: any[]; nodes: any[] };
  settings: MainSettings;
  integrations: { googleDrive: boolean };
  integrationsRetrieved: { googleDrive: boolean };
  retrieved: boolean;
  connectedSheets: any[];
  connectedSheetsRetrieved: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<MainSettings>) => Promise<void>;
  checkGDriveIntegration: (force?: boolean, retryCount?: number) => Promise<void>;
  getConnectedSheets: () => Promise<void>;
}

const defaultSettings: MainSettings = {
  locale: 'en',
  deleteLogAfter: 30,
  logsLimit: 1000,
  editor: {
    minZoom: 0.3,
    maxZoom: 1.3,
    arrow: true,
    snapToGrid: false,
    lineType: 'default',
    saveWhenExecute: false,
    snapGrid: { 0: 15, 1: 15 },
  },
};

export const useMainStore = create<MainStore>((set, get) => ({
  tabs: [],
  copiedEls: { edges: [], nodes: [] },
  settings: defaultSettings,
  integrations: { googleDrive: false },
  integrationsRetrieved: { googleDrive: false },
  retrieved: true,
  connectedSheets: [],
  connectedSheetsRetrieved: false,

  loadSettings: async () => {
    const { settings } = await browser.storage.local.get('settings');
    set({ settings: defu(settings || {}, defaultSettings) });
  },

  updateSettings: async (newSettings) => {
    const merged = deepmerge({ ...get().settings }, newSettings);
    set({ settings: merged });
    await browser.storage.local.set({ settings: merged });
  },

  checkGDriveIntegration: async (force = false, retryCount = 0) => {
    try {
      const { integrationsRetrieved } = get();
      if (integrationsRetrieved.googleDrive && !force) return;

      const result = await fetchGapi(
        'https://www.googleapis.com/oauth2/v1/tokeninfo'
      );
      if (!result) return;

      const isIntegrated = result.scope.includes('auth/drive.file');
      const { sessionToken } = await browser.storage.local.get('sessionToken');

      if (!isIntegrated && sessionToken?.refresh && retryCount < 3) {
        const response = await fetchApi(
          `/me/refresh-session?token=${sessionToken.refresh}`,
          { auth: true }
        );
        const refreshResult = await response.json();
        if (!response.ok) throw new Error(refreshResult.message);

        await browser.storage.local.set({
          sessionToken: { ...sessionToken, access: refreshResult.token },
        });
        await get().checkGDriveIntegration(force, retryCount + 1);
        return;
      }

      set((state) => ({
        integrations: { ...state.integrations, googleDrive: isIntegrated },
        integrationsRetrieved: { ...state.integrationsRetrieved, googleDrive: true },
      }));
    } catch (error) {
      console.error(error);
    }
  },

  getConnectedSheets: async () => {
    try {
      if (get().connectedSheetsRetrieved) return;

      const result = await fetchGapi(
        'https://www.googleapis.com/drive/v3/files'
      );

      set((state) => ({
        integrations: { ...state.integrations, googleDrive: true },
        connectedSheets: result.files.filter(
          (file: any) =>
            file.mimeType === 'application/vnd.google-apps.spreadsheet'
        ),
        connectedSheetsRetrieved: true,
      }));
    } catch (error: any) {
      if (
        error.message === 'no-scope' ||
        error.message.includes('insufficient authentication')
      ) {
        set((state) => ({
          integrations: { ...state.integrations, googleDrive: false },
        }));
      }
      console.error(error);
    }
  },
}));

// Alias for backward compatibility
export const useStore = useMainStore;
