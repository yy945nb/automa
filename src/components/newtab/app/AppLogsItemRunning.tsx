import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
// TODO: replace with React state/context (Pinia: useWorkflowStore)
// TODO: import { countDuration } from '@/utils/helper'
// TODO: import dayjs from '@/lib/dayjs'
// TODO: import dbLogs from '@/db/logs'
// TODO: import LogsHistory from '@/components/newtab/logs/LogsHistory'
// TODO: import RendererWorkflowService from '@/service/renderer/RendererWorkflowService'

interface CurrentBlock {
  id: string;
  name: string;
  startedAt: number;
}

interface RunningState {
  id: string;
  workflowId: string;
  state: {
    name: string;
    startedTimestamp: number;
    logs: unknown[];
    currentBlock: CurrentBlock[];
  };
}

interface AppLogsItemRunningProps {
  logId?: string;
  onClose?: (closeModal?: boolean) => void;
}

const AppLogsItemRunning: React.FC<AppLogsItemRunningProps> = ({
  logId = '',
  onClose,
}) => {
  const { t } = useTranslation();

  // Force re-render every second for live duration display
  const [tick, setTick] = useState(0);

  // TODO: replace with actual workflowStore.getAllStates.find(({ id }) => id === logId)
  const running: RunningState | undefined = undefined;

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Watch running state — if it disappears, navigate to the completed log
  useEffect(() => {
    if (!running && logId) {
      (async () => {
        // TODO: const log = await dbLogs.items.where('id').equals(logId).first();
        // TODO: navigate(log ? `/logs/${logId}` : '/logs');
      })();
    }
  }, [running, logId]);

  const stopWorkflow = useCallback(() => {
    if (!running) return;
    // TODO: RendererWorkflowService.stopWorkflowExecution(running.id)
    onClose?.();
  }, [running, onClose]);

  // TODO: countDuration stub — replace with actual import
  const countDuration = (startedAt: number, endedAt: number): string => {
    const diff = endedAt - startedAt;
    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${minutes}m ${seconds}s`;
  };

  if (!running) return null;

  return (
    <div>
      <div className="flex items-center">
        <button
          role="button"
          className="bg-input mr-2 h-12 rounded-lg px-1 text-gray-600 transition dark:text-gray-300"
          onClick={() => onClose?.()}
        >
          <i className="ri-arrow-left-s-line"></i>
        </button>
        <div className="grow overflow-hidden">
          <h1 className="text-overflow max-w-md text-2xl font-semibold">
            {running.state.name}
          </h1>
          <p>
            {t('running.start', {
              // TODO: date: dayjs(running.state.startedTimestamp).format('DD MMM, hh:mm A')
              date: new Date(running.state.startedTimestamp).toLocaleString(undefined, {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }),
            })}
          </p>
        </div>
        <button onClick={stopWorkflow}>{t('common.stop')}</button>
      </div>

      <div className="mt-8">
        {/* TODO: replace with LogsHistory component */}
        {/* <LogsHistory
          isRunning={true}
          currentLog={{ history: running.state.logs, workflowId: running.workflowId }}
          appendItems={
            running.state.currentBlock.map((block) => (
              <div
                key={block.id}
                className="hoverable group flex w-full items-center rounded-md px-2 py-1"
              >
                <span className="text-overflow ml-6 w-14 shrink-0 text-gray-400">
                  {countDuration(block.startedAt, Date.now())}
                </span>
                <span className="mr-2 text-accent">...</span>
                <p className="flex-1">{t(`workflow.blocks.${block.name}.name`)}</p>
              </div>
            ))
          }
        /> */}
        <div>
          <ul>
            {(running.state.logs as unknown[]).map((log, index) => (
              // TODO: render log entry via LogsHistory
              <li key={index}>{JSON.stringify(log)}</li>
            ))}
          </ul>
          {/* Currently running blocks */}
          {running.state.currentBlock.map((block) => (
            <div
              key={block.id}
              className="hoverable group flex w-full items-center rounded-md px-2 py-1"
            >
              <span className="text-overflow ml-6 w-14 shrink-0 text-gray-400">
                {countDuration(block.startedAt, Date.now())}
              </span>
              {/* TODO: replace with ui-spinner */}
              <span className="mr-2 animate-spin text-accent">⟳</span>
              <p className="flex-1">{t(`workflow.blocks.${block.name}.name`)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppLogsItemRunning;
