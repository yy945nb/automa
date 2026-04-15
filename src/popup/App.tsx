import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import browser from 'webextension-polyfill';
import { useMainStore } from '@/stores/main';
import { sendMessage } from '@/utils/message';
import { useWorkflowStore } from '@/stores/workflow';
import { useHostedWorkflowStore } from '@/stores/hostedWorkflow';
import { loadLocaleMessages, setI18nLanguage } from '@/lib/vueI18n';
import UiDialog from '@/components/ui/UiDialog';

const PopupApp: React.FC = () => {
  const [retrieved, setRetrieved] = useState(false);

  const store = useMainStore();
  const workflowStore = useWorkflowStore();
  const hostedWorkflowStore = useHostedWorkflowStore();

  // Check if recording is in progress; if so, open dashboard and close popup
  useEffect(() => {
    browser.storage.local.get('isRecording').then(({ isRecording }) => {
      if (!isRecording) return;

      sendMessage('open:dashboard', '/recording', 'background').then(() => {
        window.close();
      });
    });
  }, []);

  // Load settings, locale, and workflow data on mount
  useEffect(() => {
    (async () => {
      try {
        await store.loadSettings();
        await loadLocaleMessages(store.settings.locale, 'popup');
        await setI18nLanguage(store.settings.locale);

        await workflowStore.loadData();
        await hostedWorkflowStore.loadData();

        setRetrieved(true);
      } catch (error) {
        console.error(error);
        setRetrieved(true);
      }
    })();
  }, []);

  if (!retrieved) return null;

  return (
    <>
      <Outlet />
      <UiDialog />
    </>
  );
};

export default PopupApp;
