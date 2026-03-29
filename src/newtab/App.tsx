import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import browser from 'webextension-polyfill';
import AppSidebar from '@/components/newtab/app/AppSidebar';
import AppLogs from '@/components/newtab/app/AppLogs';
import UiDialog from '@/components/ui/UiDialog';
import UiButton from '@/components/ui/UiButton';
import UiSpinner from '@/components/ui/UiSpinner';
import SharedPermissionsModal from '@/components/newtab/shared/SharedPermissionsModal';

import Welcome from './pages/Welcome';
import Packages from './pages/Packages';
import WorkflowContainer from './pages/Workflows';
import WorkflowsIndex from './pages/workflows/WorkflowsIndex';
import WorkflowDetails from './pages/workflows/WorkflowDetails';
import WorkflowHost from './pages/workflows/Host';
import WorkflowShared from './pages/workflows/Shared';
import ScheduledWorkflow from './pages/ScheduledWorkflow';
import Storage from './pages/Storage';
import StorageTables from './pages/storage/Tables';
import LogsDetails from './pages/logs/LogsDetails';
import Recording from './pages/Recording';
import Settings from './pages/Settings';
import SettingsIndex from './pages/settings/SettingsIndex';
import SettingsAbout from './pages/settings/SettingsAbout';
import SettingsProfile from './pages/settings/SettingsProfile';
import SettingsShortcuts from './pages/settings/SettingsShortcuts';
import SettingsBackup from './pages/settings/SettingsBackup';
import SettingsEditor from './pages/settings/SettingsEditor';

interface PermissionState {
  showModal: boolean;
  items: string[];
}

export default function App() {
  const { t } = useTranslation();
  const location = useLocation();
  const [retrieved, setRetrieved] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>({
    showModal: false,
    items: [],
  });
  const currentVersion = useRef(browser.runtime.getManifest().version);

  const isRecordingRoute = location.pathname === '/recording';

  useEffect(() => {
    const init = async () => {
      try {
        const { workflowStates } = await browser.storage.local.get('workflowStates');
        const states = Object.values((workflowStates as Record<string, unknown>) || {});
        // workflowStore.states = states; // Pinia store - kept for compatibility

        const prevVersion = localStorage.getItem('ext-version') || '0.0.0';
        const { isFirstTime } = await browser.storage.local.get('isFirstTime') as { isFirstTime?: boolean };

        try {
          const { compare } = await import('compare-versions');
          if (!isFirstTime && compare(currentVersion.current, prevVersion, '>')) {
            setIsUpdated(true);
          }
        } catch {
          // compare-versions not available
        }

        setRetrieved(true);

        const { isRecording } = await browser.storage.local.get('isRecording') as { isRecording?: boolean };
        if (isRecording) {
          try {
            await (browser.action || (browser as any).browserAction).setBadgeBackgroundColor({ color: '#ef4444' });
            await (browser.action || (browser as any).browserAction).setBadgeText({ text: 'rec' });
          } catch {
            // badge APIs may not be available
          }
        }
      } catch (error) {
        console.error(error);
        setRetrieved(true);
      }
      localStorage.setItem('ext-version', currentVersion.current);
    };

    init();
  }, []);

  useEffect(() => {
    const handleMessage = ({ type, data }: { type: string; data: any }) => {
      if (!type) return;

      if (type === 'workflow:added' && data?.workflowData) {
        // Handle workflow added - kept for compatibility
      }
    };

    browser.runtime.onMessage.addListener(handleMessage as any);
    return () => {
      browser.runtime.onMessage.removeListener(handleMessage as any);
    };
  }, []);

  useEffect(() => {
    const handleStorageChanged = (changes: Record<string, browser.Storage.StorageChange>) => {
      if (!changes.workflowStates) return;
      // workflowStore.states = Object.values(changes.workflowStates.newValue || {});
    };

    browser.storage.local.onChanged.addListener(handleStorageChanged);
    return () => {
      browser.storage.local.onChanged.removeListener(handleStorageChanged);
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'automa-fetch') return;

      const sandbox = document.getElementById('sandbox') as HTMLIFrameElement | null;
      if (!sandbox?.contentWindow) return;

      const sendResponse = (result: unknown) => {
        sandbox.contentWindow!.postMessage(
          { type: 'fetchResponse', data: result, id: event.data.data.id },
          '*'
        );
      };

      // MessageListener.sendMessage handled by background
      sendResponse({ isError: true, result: 'Not implemented in React context' });
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!retrieved) {
    return (
      <div className="py-8 text-center">
        <UiSpinner color="text-accent" size={28} />
      </div>
    );
  }

  return (
    <>
      {!isRecordingRoute && <AppSidebar />}
      <main className={!isRecordingRoute ? 'pl-16' : ''}>
        <Routes>
          <Route path="/" element={<Navigate to="/workflows" replace />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/packages/:id" element={<WorkflowDetails />} />
          <Route path="/recording" element={<Recording />} />
          <Route path="/workflows" element={<WorkflowContainer />}>
            <Route index element={<WorkflowsIndex />} />
            <Route path=":id" element={<WorkflowDetails />} />
            <Route path=":id/host" element={<WorkflowHost />} />
            <Route path=":id/shared" element={<WorkflowShared />} />
          </Route>
          <Route path="/teams/:teamId/workflows/:id" element={<WorkflowDetails />} />
          <Route path="/schedule" element={<ScheduledWorkflow />} />
          <Route path="/storage" element={<Storage />} />
          <Route path="/storage/tables/:id" element={<StorageTables />} />
          <Route path="/logs/:id?" element={<LogsDetails />} />
          <Route path="/settings" element={<Settings />}>
            <Route index element={<SettingsIndex />} />
            <Route path="profile" element={<SettingsProfile />} />
            <Route path="about" element={<SettingsAbout />} />
            <Route path="backup" element={<SettingsBackup />} />
            <Route path="editor" element={<SettingsEditor />} />
            <Route path="shortcuts" element={<SettingsShortcuts />} />
          </Route>
        </Routes>
      </main>

      <AppLogs />

      <UiDialog>
        <div slot="auth" className="text-center">
          <p className="text-xl font-semibold">Oops!! 😬</p>
          <p className="mt-2 text-gray-600 dark:text-gray-200">{t('auth.text')}</p>
          <UiButton
            tag="a"
            href="https://extension.automa.site/auth"
            className="mt-6 block w-full"
            variant="accent"
          >
            {t('auth.signIn')}
          </UiButton>
        </div>
      </UiDialog>

      {isUpdated && (
        <div className="fixed bottom-8 left-1/2 z-50 max-w-xl -translate-x-1/2 text-white dark:text-gray-900">
          <div className="flex items-center rounded-lg bg-accent p-4 shadow-2xl">
            <i className="ri-information-line mr-3" />
            <p>
              {t('updateMessage.text1', { version: currentVersion.current })}
            </p>
            <a
              href="https://github.com/AutomaApp/automa/releases/latest"
              target="_blank"
              rel="noopener"
              className="ml-1 underline"
            >
              {t('updateMessage.text2')}
            </a>
            <div className="flex-1" />
            <button
              className="ml-6 text-gray-200 dark:text-gray-600"
              onClick={() => setIsUpdated(false)}
            >
              <i className="ri-close-line" style={{ fontSize: '20px' }} />
            </button>
          </div>
        </div>
      )}

      <SharedPermissionsModal
        modelValue={permissionState.showModal}
        permissions={permissionState.items}
        onUpdate:modelValue={(val: boolean) =>
          setPermissionState((prev) => ({ ...prev, showModal: val }))
        }
      />
    </>
  );
}
