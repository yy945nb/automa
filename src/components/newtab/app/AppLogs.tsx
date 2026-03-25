import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
// TODO: replace emitter subscription with React context or event bus
// import emitter from '@/lib/mitt';
import AppLogsItem from './AppLogsItem';
import AppLogsItems from './AppLogsItems';
import AppLogsItemRunning from './AppLogsItemRunning';

interface AppLogsState {
  logId: string;
  source: string;
  show: boolean;
  workflowId: string;
  runningWorkflow: boolean;
}

interface AppLogsProps {
  /** Optionally control visibility from a parent component */
  show?: boolean;
  onClose?: () => void;
}

const AppLogs: React.FC<AppLogsProps> = ({ show: showProp, onClose }) => {
  const { t } = useTranslation();

  const [state, setState] = useState<AppLogsState>({
    logId: '',
    source: '',
    show: false,
    workflowId: '',
    runningWorkflow: false,
  });

  // Sync external show prop into local state
  useEffect(() => {
    if (showProp !== undefined) {
      setState((prev) => ({ ...prev, show: showProp }));
    }
  }, [showProp]);

  // TODO: subscribe to emitter 'ui:logs' events
  // useEffect(() => {
  //   const handler = (event: Partial<AppLogsState> = {}) => {
  //     setState((prev) => ({ ...prev, ...event }));
  //   };
  //   emitter.on('ui:logs', handler);
  //   return () => { emitter.off('ui:logs', handler); };
  // }, []);

  const clearState = useCallback(() => {
    setState((prev) => ({
      ...prev,
      show: false,
      logId: '',
      source: '',
      runningWorkflow: false,
    }));
    onClose?.();
  }, [onClose]);

  const closeItemPage = useCallback((closeModal = false) => {
    setState((prev) => ({ ...prev, logId: '' }));
    if (closeModal) {
      clearState();
    }
  }, [clearState]);

  const onSelectLog = useCallback(({ id, type }: { id: string; type: string }) => {
    setState((prev) => ({
      ...prev,
      runningWorkflow: type === 'running',
      logId: id,
    }));
  }, []);

  if (!state.show) return null;

  return (
    // TODO: replace with ui-modal component
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) clearState();
      }}
    >
      {/* TODO: replace with ui-card component */}
      <div
        className="mt-8 w-full rounded-lg bg-white p-6 dark:bg-gray-800"
        style={{ maxWidth: 1400, minHeight: 600 }}
      >
        {!state.logId ? (
          <AppLogsItems
            workflowId={state.workflowId}
            onSelect={onSelectLog}
            onClose={clearState}
          />
        ) : state.runningWorkflow ? (
          <AppLogsItemRunning logId={state.logId} onClose={closeItemPage} />
        ) : (
          <AppLogsItem logId={state.logId} onClose={closeItemPage} />
        )}
      </div>
    </div>
  );
};

export default AppLogs;
