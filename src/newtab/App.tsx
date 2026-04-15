import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import browser from 'webextension-polyfill';
import { compare } from 'compare-versions';

import { useWorkflowStore } from '@/stores/workflow';
import { useFolderStore } from '@/stores/folder';
import { usePackageStore } from '@/stores/package';
import { useUserStore } from '@/stores/user';
import { useMainStore } from '@/stores/main';
import { useHostedWorkflowStore } from '@/stores/hostedWorkflow';
import { useSharedWorkflowStore } from '@/stores/sharedWorkflow';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';

import { getUserWorkflows } from '@/utils/api';
import { getWorkflowPermissions } from '@/utils/workflowData';
import { MessageListener } from '@/utils/message';
import dataMigration from '@/utils/dataMigration';
import emitter from '@/lib/mitt';
import dayjs from '@/lib/dayjs';
import dbLogs from '@/db/logs';

// Placeholder components – replace with real implementations
const AppSidebar: React.FC = () => (
  <aside className="fixed left-0 top-0 z-40 flex h-full w-16 flex-col items-center border-r bg-white py-2 dark:border-gray-700 dark:bg-gray-800">
    {/* sidebar nav icons */}
  </aside>
);
const AppLogs: React.FC = () => null; // logs drawer rendered via emitter

interface PermissionState {
  items: string[];
  showModal: boolean;
}

const App: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const workflowStore = useWorkflowStore();
  const folderStore = useFolderStore();
  const packageStore = usePackageStore();
  const userStore = useUserStore();
  const store = useMainStore();
  const hostedWorkflowStore = useHostedWorkflowStore();
  const sharedWorkflowStore = useSharedWorkflowStore();
  const teamWorkflowStore = useTeamWorkflowStore();

  const [retrieved, setRetrieved] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>({
    items: [],
    showModal: false,
  });

  const currentVersion = browser.runtime.getManifest().version;
  const isRecordingRoute = location.pathname === '/recording';

  // ── helpers ──────────────────────────────────────────────

  const fetchUserData = useCallback(async () => {
    try {
      if (!userStore.user) return;

      const { backup, hosted } = await getUserWorkflows();
      userStore.hostedWorkflows = hosted || {};

      if (backup && backup.length > 0) {
        const { lastBackup } = await browser.storage.local.get('lastBackup');
        if (!lastBackup) {
          const backupIds = backup.map(({ id }: any) => id);
          userStore.backupIds = backupIds;
          await browser.storage.local.set({
            backupIds,
            lastBackup: new Date().toISOString(),
          });
        }
        await workflowStore.insertOrUpdate(backup, { checkUpdateDate: true });
      }

      userStore.retrieved = true;
    } catch (error) {
      console.error(error);
    }
  }, [userStore, workflowStore]);

  const autoDeleteLogs = useCallback(() => {
    const deleteAfter = store.settings?.deleteLogAfter;
    if (deleteAfter === 'never') return;

    const lastCheck =
      +(localStorage.getItem('checkDeleteLogs') ?? '') || Date.now() - 8.64e7;
    const dayDiff = dayjs().diff(dayjs(lastCheck), 'day');
    if (dayDiff < 1) return;

    const aDayInMs = 8.64e7;
    const maxLogAge = Date.now() - aDayInMs * (deleteAfter as number);

    dbLogs.items
      .where('endedAt')
      .below(maxLogAge)
      .toArray()
      .then((values: any[]) => {
        const ids = values.map(({ id }: any) => id);
        dbLogs.items.bulkDelete(ids);
        dbLogs.ctxData.where('logId').anyOf(ids).delete();
        dbLogs.logsData.where('logId').anyOf(ids).delete();
        dbLogs.histories.where('logId').anyOf(ids).delete();
        localStorage.setItem('checkDeleteLogs', String(Date.now()));
      });
  }, [store.settings]);

  const syncHostedWorkflows = useCallback(async () => {
    const hostIds: { hostId: string; updatedAt: number }[] = [];
    const userHosted = userStore.getHostedWorkflows;
    const hostedWorkflows = hostedWorkflowStore.workflows;

    Object.keys(hostedWorkflows).forEach((hostId) => {
      const isItsOwn = userHosted.find((item: any) => item.hostId === hostId);
      if (isItsOwn) return;
      hostIds.push({ hostId, updatedAt: hostedWorkflows[hostId].updatedAt });
    });

    if (hostIds.length === 0) return;
    await hostedWorkflowStore.fetchWorkflows(hostIds);
  }, [userStore, hostedWorkflowStore]);

  // ── stop recording helper ────────────────────────────────
  const stopRecording = useCallback(() => {
    if ((window as any).stopRecording) {
      (window as any).stopRecording();
    }
  }, []);

  // ── initialise ──────────────────────────────────────────
  useEffect(() => {
    const prevVersion = localStorage.getItem('ext-version') || '0.0.0';
    (window as any).fromBackground = window.location.href.includes(
      '?fromBackground=true'
    );

    // Message events
    const messageEvents: Record<string, (data: any) => void> = {
      'refresh-packages': () => {
        packageStore.loadData(true);
      },
      'open-logs': (data) => {
        emitter.emit('ui:logs', { show: true, logId: data.logId });
      },
      'workflow:added': (data) => {
        if (data.source === 'team') {
          teamWorkflowStore.loadData().then(() => {
            navigate(
              `/teams/${data.teamId}/workflows/${data.workflowId}?permission=true`
            );
          });
        } else if (data.workflowData) {
          workflowStore
            .insert(data.workflowData, { duplicateId: true })
            .then(async () => {
              try {
                const permissions = await getWorkflowPermissions(
                  data.workflowData
                );
                if (permissions.length === 0) return;
                setPermissionState({ items: permissions, showModal: true });
              } catch (error) {
                console.error(error);
              }
            })
            .catch((error: any) => console.error(error));
        }
      },
      'recording:stop': stopRecording,
      'background--recording:stop': stopRecording,
    };

    const onMessage = ({ type, data }: any) => {
      if (!type || !messageEvents[type]) return;
      messageEvents[type](data);
    };
    browser.runtime.onMessage.addListener(onMessage);

    const onStorageChanged = ({ workflowStates }: any) => {
      if (!workflowStates) return;
      workflowStore.states = Object.values(workflowStates.newValue);
    };
    browser.storage.local.onChanged.addListener(onStorageChanged);

    // Sandbox fetch bridge
    const onWindowMessage = ({ data }: MessageEvent) => {
      if (data?.type !== 'automa-fetch') return;
      const sendResponse = (result: any) => {
        const sandbox = document.getElementById('sandbox') as HTMLIFrameElement;
        sandbox?.contentWindow?.postMessage(
          { type: 'fetchResponse', data: result, id: data.data.id },
          '*'
        );
      };
      MessageListener.sendMessage('fetch', data.data, 'background')
        .then((result: any) => sendResponse({ isError: false, result }))
        .catch((error: any) =>
          sendResponse({ isError: true, result: error.message })
        );
    };
    window.addEventListener('message', onWindowMessage);

    // Beforeunload guard
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const running = workflowStore.popupStates?.length ?? 0;
      if ((window as any).isDataChanged || running > 0) {
        e.preventDefault();
        return t('message.notSaved');
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    // Main bootstrap
    (async () => {
      try {
        const { workflowStates } = await browser.storage.local.get(
          'workflowStates'
        );
        workflowStore.states = Object.values(workflowStates || {});

        const tabs = await browser.tabs.query({
          url: browser.runtime.getURL('/newtab.html'),
        });
        const currentWindow = await browser.windows.getCurrent();
        if (currentWindow.type !== 'popup' && tabs.length > 0) {
          await browser.tabs.remove([tabs[0].id!]);
          return;
        }
        if (tabs.length > 1) {
          const firstTab = tabs.shift()!;
          await browser.windows.update(firstTab.windowId!, { focused: true });
          await browser.tabs.update(firstTab.id, { active: true });
          await browser.tabs.remove(tabs.map((tab) => tab.id!));
          return;
        }

        const { isFirstTime } = await browser.storage.local.get('isFirstTime');
        setIsUpdated(
          !isFirstTime && compare(currentVersion, prevVersion, '>')
        );

        await Promise.allSettled([
          folderStore.load(),
          store.loadSettings(),
          workflowStore.loadData(),
          teamWorkflowStore.loadData(),
          hostedWorkflowStore.loadData(),
          packageStore.loadData(),
        ]);

        await dataMigration();
        await userStore.loadUser({ useCache: false, ttl: 2 });

        setRetrieved(true);

        await Promise.allSettled([
          sharedWorkflowStore.fetchWorkflows(),
          fetchUserData(),
          syncHostedWorkflows(),
        ]);

        const { isRecording } = await browser.storage.local.get('isRecording');
        if (isRecording) {
          navigate('/recording');
          const action = browser.action || (browser as any).browserAction;
          await action.setBadgeBackgroundColor({ color: '#ef4444' });
          await action.setBadgeText({ text: 'rec' });
        }

        autoDeleteLogs();
      } catch (error) {
        setRetrieved(true);
        console.error(error);
      }

      localStorage.setItem('ext-version', currentVersion);
    })();

    return () => {
      browser.runtime.onMessage.removeListener(onMessage);
      browser.storage.local.onChanged.removeListener(onStorageChanged);
      window.removeEventListener('message', onWindowMessage);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── close window when popup finishes ─────────────────────
  useEffect(() => {
    if (
      !(window as any).fromBackground ||
      (workflowStore.popupStates?.length ?? 0) !== 0 ||
      location.pathname !== '/workflows'
    )
      return;
    window.close();
  }, [workflowStore.popupStates, location.pathname]);

  // ── render ───────────────────────────────────────────────
  if (!retrieved) {
    return (
      <div className="py-8 text-center">
        <div className="ui-spinner text-accent" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  return (
    <>
      {!isRecordingRoute && <AppSidebar />}
      <main className={!isRecordingRoute ? 'pl-16' : ''}>
        <Outlet />
      </main>
      <AppLogs />

      {/* Update banner */}
      {isUpdated && (
        <div className="fixed bottom-8 left-1/2 z-50 max-w-xl -translate-x-1/2 text-white dark:text-gray-900">
          <div className="flex items-center rounded-lg bg-accent p-4 shadow-2xl">
            <span className="remix-icon mr-3" data-icon="riInformationLine" />
            <p>
              {t('updateMessage.text1', { version: currentVersion })}
            </p>
            <a
              href="https://github.com/AutomaApp/automa/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 underline"
            >
              {t('updateMessage.text2')}
            </a>
            <div className="flex-1" />
            <button
              className="ml-6 text-gray-200 dark:text-gray-600"
              onClick={() => setIsUpdated(false)}
            >
              <span className="remix-icon" data-icon="riCloseLine" style={{ fontSize: 20 }} />
            </button>
          </div>
        </div>
      )}

      {/* Permissions modal placeholder */}
      {permissionState.showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-lg bg-white p-6 dark:bg-gray-800">
            <p className="font-semibold">Permissions required</p>
            <ul className="mt-2">
              {permissionState.items.map((perm, i) => (
                <li key={i}>{perm}</li>
              ))}
            </ul>
            <button
              className="mt-4 rounded bg-accent px-4 py-2 text-white"
              onClick={() =>
                setPermissionState((s) => ({ ...s, showModal: false }))
              }
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
