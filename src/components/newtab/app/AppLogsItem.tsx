import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
// TODO: replace with React state/context (Pinia: useWorkflowStore)
// TODO: replace with React Router (useNavigate / Link)
// TODO: replace with React-compatible DB (dbLogs from '@/db/logs')
// TODO: import dayjs from '@/lib/dayjs'
// TODO: import { countDuration, convertArrObjTo2DArr } from '@/utils/helper'
// TODO: import LogsTable from '@/components/newtab/logs/LogsTable'
// TODO: import LogsHistory from '@/components/newtab/logs/LogsHistory'
// TODO: import LogsVariables from '@/components/newtab/logs/LogsVariables'

interface AppLogsItemProps {
  logId?: string;
  onClose?: (closeModal?: boolean) => void;
}

interface LogData {
  id?: string;
  name?: string;
  status?: string;
  startedAt?: number;
  endedAt?: number;
  workflowId?: string;
  history?: unknown[];
  data?: {
    table?: Record<string, unknown>[];
    variables?: Record<string, unknown>;
  };
}

interface TableData {
  converted: boolean;
  body: Record<string, unknown>[];
  header: { text: string; value: string; filterable?: boolean; sortable?: boolean }[];
}

const AppLogsItem: React.FC<AppLogsItemProps> = ({ logId = '', onClose }) => {
  const { t } = useTranslation();

  const tabs = useMemo(
    () => [
      { id: 'logs', name: t('common.log', { count: 2 }) },
      { id: 'table', name: t('workflow.table.title') },
      { id: 'variables', name: t('workflow.variables.title', { count: 2 }) },
    ],
    [t]
  );

  const [activeTab, setActiveTab] = useState('logs');
  const [workflowExists, setWorkflowExists] = useState(false);
  const [ctxData, setCtxData] = useState<Record<string, unknown>>({});
  const [parentLog, setParentLog] = useState<unknown>(null);
  const [currentLog, setCurrentLog] = useState<LogData>({
    history: [],
    data: { table: [], variables: {} },
  });
  const [tableData, setTableData] = useState<TableData>({
    converted: false,
    body: [],
    header: [],
  });

  const deleteLog = useCallback(() => {
    // TODO: dbLogs.items.where('id').equals(logId).delete().then(() => onClose?.())
    onClose?.();
  }, [logId, onClose]);

  const goToWorkflow = useCallback(() => {
    // TODO: navigate(`/workflows/${currentLog.workflowId}`)
    onClose?.(true);
  }, [currentLog, onClose]);

  const convertToTableData = useCallback(() => {
    const data = currentLog.data?.table;
    if (!data || data.length === 0) return;
    // TODO: const [header] = convertArrObjTo2DArr(data)
    const header: string[] = Object.keys(data[0] || {});
    const mappedHeader = header.map((name) => ({ text: name, value: name, filterable: true }));
    mappedHeader.unshift({ text: '', value: 'id', filterable: false });
    setTableData({
      converted: true,
      body: data.map((item, index) => ({ ...item, id: index + 1 })),
      header: mappedHeader,
    });
  }, [currentLog]);

  const onTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      if (value === 'table' && !tableData.converted) {
        convertToTableData();
      }
    },
    [tableData.converted, convertToTableData]
  );

  const fetchLog = useCallback(async () => {
    if (!logId) return;
    // TODO: replace with actual dbLogs queries
    // const logDetail = await dbLogs.items.where('id').equals(logId).last();
    // if (!logDetail) return;
    // setTableData({ body: [], header: [], converted: false });
    // setParentLog(null);
    // const [logCtxData, logHistory, logsData] = await Promise.all(
    //   ['ctxData', 'histories', 'logsData'].map((key) =>
    //     dbLogs[key].where('logId').equals(logId).last()
    //   )
    // );
    // setCtxData(logCtxData?.data || {});
    // setCurrentLog({
    //   history: logHistory?.data || [],
    //   data: logsData?.data || {},
    //   ...logDetail,
    // });
    // TODO: setWorkflowExists(Boolean(workflowStore.getById(logDetail.workflowId)))
    // const parentLogId = logDetail.collectionLogId || logDetail.parentLog?.id;
    // if (parentLogId) {
    //   setParentLog((await dbLogs.items.where('id').equals(parentLogId).last()) || null);
    // }
  }, [logId]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  if (!currentLog.id) return null;

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
        <div>
          <h1 className="text-overflow max-w-md text-2xl font-semibold">
            {currentLog.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-200">
            {t('log.description.text', {
              status: t(`log.description.status.${currentLog.status || 'success'}`),
              // TODO: date: dayjs(currentLog.startedAt).format('DD MMM')
              date: currentLog.startedAt
                ? new Date(currentLog.startedAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
                : '',
              // TODO: duration: countDuration(currentLog.startedAt, currentLog.endedAt)
              duration: '',
            })}
          </p>
        </div>
        <div className="grow"></div>
        {workflowExists && (
          <button className="mr-4" onClick={goToWorkflow}>
            <i className="ri-external-link-line"></i>
          </button>
        )}
        <button
          className="text-red-500 dark:text-red-400"
          onClick={deleteLog}
        >
          {t('common.delete')}
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={[
              'mr-4',
              activeTab === tab.id ? 'border-b-2 border-accent font-semibold' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div
        className="scroll mt-4 overflow-auto px-2 pb-4"
        style={{ minHeight: 500, maxHeight: 'calc(100vh - 15rem)' }}
      >
        {activeTab === 'logs' && (
          // TODO: <LogsHistory currentLog={currentLog} ctxData={ctxData} parentLog={parentLog} />
          <div>{t('common.log', { count: 2 })}</div>
        )}
        {activeTab === 'table' && (
          // TODO: <LogsTable currentLog={currentLog} tableData={tableData} />
          <div>{t('workflow.table.title')}</div>
        )}
        {activeTab === 'variables' && (
          // TODO: <LogsVariables currentLog={currentLog} />
          <div>{t('workflow.variables.title', { count: 2 })}</div>
        )}
      </div>
    </div>
  );
};

export default AppLogsItem;
