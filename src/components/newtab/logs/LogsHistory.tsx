import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from '@/lib/dayjs';
import { countDuration } from '@/utils/helper';
// TODO: import { getBlocks } from '@/utils/getSharedData';
// TODO: import { dataExportTypes, messageHasReferences } from '@/utils/shared';
// TODO: import objectPath from 'object-path';
// TODO: import Papa from 'papaparse';
// TODO: import { fileSaver } from '@/utils/helper';

interface LogHistoryItem {
  id?: string | number;
  type?: string;
  name?: string;
  description?: string;
  message?: string;
  messageId?: string;
  timestamp?: number;
  duration?: number;
  blockId?: string;
  logId?: string;
}

interface LogsHistoryProps {
  currentLog: {
    history: LogHistoryItem[];
    status?: string;
    name?: string;
    workflowId?: string;
    teamId?: string;
    parentLog?: { id?: string };
    collectionLogId?: string;
  };
  ctxData?: Record<string, any>;
  parentLog?: { name?: string; id?: string } | null;
  isRunning?: boolean;
  children?: React.ReactNode;
  headerPrepend?: React.ReactNode;
  appendItems?: React.ReactNode;
}

const logsType: Record<string, { color: string; icon: string }> = {
  success: { color: 'text-green-400', icon: 'riCheckLine' },
  stop: { color: 'text-yellow-400', icon: 'riStopLine' },
  stopped: { color: 'text-yellow-400', icon: 'riStopLine' },
  error: { color: 'text-red-400', icon: 'riErrorWarningLine' },
  finish: { color: 'text-blue-300', icon: 'riFlagLine' },
};

const tabs = [
  { id: 'all', name: 'All' },
  { id: 'referenceData.loopData', name: 'Loop data' },
  { id: 'referenceData.variables', name: 'Variables' },
  { id: 'referenceData.prevBlockData', name: 'Previous block data' },
  { id: 'replacedValue', name: 'Replaced value' },
];

const dataExportTypes = [
  { id: 'json', name: 'JSON' },
  { id: 'csv', name: 'CSV' },
  { id: 'plain-text', name: 'Plain Text' },
];

const LogsHistory: React.FC<LogsHistoryProps> = ({
  currentLog,
  ctxData = {},
  parentLog = null,
  isRunning = false,
  headerPrepend,
  appendItems,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [itemId, setItemId] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [activeLog, setActiveLog] = useState<LogHistoryItem | null>(null);
  const [perPage, setPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLog = useMemo(() => {
    const query = search.toLowerCase();
    return (currentLog.history || []).filter(
      (log) =>
        (log.name || '').toLowerCase().includes(query) ||
        (log.description || '').toLowerCase().includes(query)
    );
  }, [currentLog.history, search]);

  const history = useMemo(() =>
    filteredLog.slice((currentPage - 1) * perPage, currentPage * perPage),
    [filteredLog, currentPage, perPage]
  );

  function setActiveLogItem(item: LogHistoryItem) {
    setItemId(String(item.id || ''));
    setActiveLog(item);
  }

  function clearActiveItem() {
    setItemId('');
    setActiveLog(null);
  }

  function exportLogs(type: string) {
    // TODO: implement export logic
    console.log('Export logs as', type);
  }

  const parentLogTo = parentLog
    ? '/logs/' + (currentLog.parentLog?.id || currentLog.collectionLogId)
    : null;

  return (
    <>
      {parentLog && parentLogTo && (
        <a href={parentLogTo} className="mb-4 flex">
          <i className="riArrowLeftLine mr-2"></i>
          {t('log.goBack', { name: parentLog.name })}
        </a>
      )}
      <div className="flex flex-col-reverse items-start lg:flex-row">
        <div className="w-full lg:w-auto lg:flex-1">
          <div className="dark rounded-lg bg-gray-900 text-gray-100">
            <div className="mb-4 flex items-center border-b p-4 text-gray-200">
              {headerPrepend}
              <div className="grow" />
              {!isRunning && (
                <>
                  {/* TODO: Export popover */}
                  <div className="mr-4">
                    <button className="rounded border px-3 py-1">
                      Export logs ▼
                    </button>
                    <div style={{ display: 'none' }}>
                      {dataExportTypes.map((type) => (
                        <button key={type.id} onClick={() => exportLogs(type.id)}>
                          {type.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    value={search}
                    placeholder={t('common.search')}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </>
              )}
            </div>
            <div id="log-history" style={{ maxHeight: 500 }} className="scroll overflow-auto p-4">
              {(currentLog.history || []).length === 0 && (
                <p className="text-center text-gray-300">The workflow log is not saved</p>
              )}
              <div className="w-full space-y-1 overflow-auto font-mono text-sm">
                {history.map((item, index) => (
                  <div
                    key={item.id ?? index}
                    className={[
                      'hoverable group flex w-full cursor-default items-start rounded-md px-2 py-1 text-left focus:ring-0',
                      item.id && String(item.id) === itemId ? 'bg-box-transparent' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => setActiveLogItem(item)}
                  >
                    <div style={{ minWidth: 54 }} className="text-overflow mr-4 shrink-0 text-gray-400">
                      {item.timestamp ? (
                        <span title={dayjs(item.timestamp).format('YYYY-MM-DDTHH:mm:ss.SSS')}>
                          {dayjs(item.timestamp).format('HH:mm:ss')}{' '}
                          ({countDuration(0, item.duration || 0).trim()})
                        </span>
                      ) : (
                        <span title={`${Math.round((item.duration || 0) / 1000)}s`}>
                          {countDuration(0, item.duration || 0)}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-overflow w-2/12 shrink-0 ${logsType[item.type || '']?.color || ''}`}
                      title={item.type}
                    >
                      <i className={logsType[item.type || '']?.icon}></i>
                      {' '}{item.name}
                    </span>
                    <span className="text-overflow ml-2 w-2/12 shrink-0">
                      {item.description}
                    </span>
                    <p className="line-clamp ml-2 flex-1 text-sm leading-tight text-gray-600 dark:text-gray-200" title={item.message}>
                      {item.message}
                      {item.messageId && (
                        <a
                          href={`https://docs.extension.automa.site/reference/workflow-common-errors.html#${item.messageId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="About the error"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <i className="riArrowLeftLine text-gray-300"></i>
                        </a>
                      )}
                    </p>
                    {item.logId && (
                      <a href={`/logs/${item.logId}`} className="ml-2">
                        <i className="riFileTextLine text-gray-300" title="Open log detail"></i>
                      </a>
                    )}
                    {!isRunning && item.blockId && currentLog.workflowId && (
                      <a
                        href={`/workflows/${currentLog.workflowId}?blockId=${item.blockId}`}
                        className="invisible ml-2 group-hover:visible"
                      >
                        <i className="riExternalLinkLine text-gray-300" title="Go to block"></i>
                      </a>
                    )}
                  </div>
                ))}
                {appendItems}
              </div>
            </div>
          </div>
          {(currentLog.history || []).length >= 25 && (
            <div className="mt-4 lg:flex lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                {t('components.pagination.text1')}
                <select value={perPage} className="bg-input rounded-md p-1" onChange={(e) => setPerPage(Number(e.target.value))}>
                  {[25, 50, 75, 100, 150, 200].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                {t('components.pagination.text2', { count: filteredLog.length })}
              </div>
              {/* TODO: UiPagination component */}
            </div>
          )}
        </div>
        {itemId && activeLog && (
          <div className="dark mb-4 w-full rounded-lg bg-gray-900 text-gray-100 lg:ml-8 lg:mb-0 lg:w-4/12">
            <div className="relative p-4">
              <button
                className="absolute top-2 right-2 cursor-pointer text-gray-500"
                onClick={clearActiveItem}
              >
                <i className="riCloseLine"></i>
              </button>
              <table className="w-full">
                <tbody>
                  <tr><td className="text-gray-300">Name</td><td>{activeLog.name}</td></tr>
                  <tr><td className="text-gray-300">Description</td><td><p className="line-clamp">{activeLog.description}</p></td></tr>
                  <tr><td className="text-gray-300">Status</td><td className="capitalize">{activeLog.type}</td></tr>
                  <tr>
                    <td className="text-gray-300">Timestamp/Duration</td>
                    <td>
                      {activeLog.timestamp && <span>{dayjs(activeLog.timestamp).format('DD MMM, HH:mm:ss')} / </span>}
                      {countDuration(0, activeLog.duration || 0).trim()}
                    </td>
                  </tr>
                  {activeLog.message && (
                    <tr><td className="text-gray-300">Message</td><td><p className="line-clamp">{activeLog.message}</p></td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center px-4 pb-4">
              <p>Log data</p>
              <div className="grow" />
              <select value={activeTab} onChange={(e) => setActiveTab(e.target.value)}>
                {tabs.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
            <div className="px-2 pb-4">
              {/* TODO: SharedCodemirror */}
              <pre className="overflow-auto rounded bg-gray-800 p-2 text-xs text-gray-200" style={{ maxHeight: 460 }}>
                {JSON.stringify(ctxData[itemId] || null, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LogsHistory;
