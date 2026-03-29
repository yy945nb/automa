import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import browser from 'webextension-polyfill';
import UiDialog from '@/components/ui/UiDialog';
import UiSpinner from '@/components/ui/UiSpinner';
import Home from './pages/Home';
import { useStore } from '@/stores/main';
import { useWorkflowStore } from '@/stores/workflow';
import { useHostedWorkflowStore } from '@/stores/hostedWorkflow';
import { loadLocaleMessages, setI18nLanguage } from '@/lib/vueI18n';
import { sendMessage } from '@/utils/message';

export default function App() {
  const [retrieved, setRetrieved] = useState(false);

  useEffect(() => {
    browser.storage.local.get('isRecording').then(({ isRecording }) => {
      if (!isRecording) return;
      sendMessage('open:dashboard', '/recording', 'background').then(() => {
        window.close();
      });
    });

    const init = async () => {
      try {
        const store = useStore();
        await store.loadSettings();
        await loadLocaleMessages(store.settings.locale, 'popup');
        await setI18nLanguage(store.settings.locale);

        const workflowStore = useWorkflowStore();
        await workflowStore.loadData();

        const hostedWorkflowStore = useHostedWorkflowStore();
        await hostedWorkflowStore.loadData();

        setRetrieved(true);
      } catch (error) {
        console.error(error);
        setRetrieved(true);
      }
    };

    init();
  }, []);

  if (!retrieved) {
    return (
      <div className="flex h-full items-center justify-center py-8 text-center">
        <UiSpinner color="text-accent" size={28} />
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
      <UiDialog />
    </>
  );
}
