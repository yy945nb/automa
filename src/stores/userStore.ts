import { create } from 'zustand';
import browser from 'webextension-polyfill';
import { cacheApi, fetchApi } from '@/utils/api';

interface UserTeam {
  id: number | string;
  access: string[];
  [key: string]: any;
}

interface User {
  username: string;
  teams?: UserTeam[];
  [key: string]: any;
}

interface UserStore {
  user: User | null;
  backupIds: string[];
  retrieved: boolean;
  hostedWorkflows: Record<string, any>;
  sharedPackages: any[];
  // Getters as functions
  getHostedWorkflows: () => any[];
  validateTeamAccess: (teamId: string | number, access?: string[]) => boolean;
  // Actions
  loadUser: (options?: any) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  backupIds: [],
  retrieved: false,
  hostedWorkflows: {},
  sharedPackages: [],

  getHostedWorkflows: () => Object.values(get().hostedWorkflows),

  validateTeamAccess: (teamId, access = []) => {
    const { user } = get();
    const currentTeam = user?.teams?.find(
      ({ id }) => teamId === id || +teamId === id
    );
    if (!currentTeam) return false;
    return access.some((item) => currentTeam.access.includes(item));
  },

  loadUser: async (options = false) => {
    try {
      const user = await cacheApi(
        'user-profile',
        async () => {
          try {
            const response = await fetchApi('/me', { auth: true });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            return result;
          } catch (error) {
            console.error(error);
            return null;
          }
        },
        options
      );

      const username = localStorage.getItem('username');
      if (!user || username !== user.username) {
        sessionStorage.removeItem('shared-workflows');
        sessionStorage.removeItem('user-workflows');
        sessionStorage.removeItem('backup-workflows');

        await browser.storage.local.remove(['backupIds', 'lastSync', 'lastBackup']);

        if (!user) {
          set({ retrieved: true });
          return;
        }
      }

      localStorage.setItem('username', user?.username);

      const { backupIds } = await browser.storage.local.get('backupIds');

      set({ user, backupIds: backupIds || [], retrieved: true });

      if (user) {
        await browser.storage.local.set({ user });
      } else {
        await browser.storage.local.remove('user');
      }
    } catch (error) {
      set({ retrieved: true });
      console.error(error);
    }
  },

  signOut: async () => {
    try {
      await browser.storage.local.remove([
        'session',
        'sessionToken',
        'user',
        'backupIds',
      ]);

      localStorage.removeItem('username');

      set({
        user: null,
        backupIds: [],
        hostedWorkflows: {},
        sharedPackages: [],
        retrieved: false,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },
}));
