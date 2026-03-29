import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// TODO: import dbLogs from '@/db/logs';
// TODO: import { dataExportTypes } from '@/utils/shared';
// TODO: import { objectHasKey } from '@/utils/helper';
// TODO: import dataExporter from '@/utils/dataExporter';

interface LogsDataViewerProps {
  log: {
    id?: string;
    name?: string;
  };
  editorClass?: string;
}

const LogsDataViewer: React.FC<LogsDataViewerProps> = ({ log, editorClass = '' }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [activeTab, setActiveTab] = useState<'table' | 'variables'>('table');
  const [fileName, setFileName] = useState(log.name || '');
  const [logsData, setLogsData] = useState<Record<string, string>>({ table: '', variables: '' });

  useEffect(() => {
    async function fetchData() {
      // TODO: replace with actual dbLogs fetch
      // const data = await dbLogs.logsData.where('logId').equals(log.id).last();
      // if (!data) { setStatus('error'); return; }
      // const newData: Record<string, string> = {};
      // Object.keys(data.data).forEach((key) => { newData[key] = JSON.stringify(data.data[key], null, 2); });
      // setLogsData(newData);
      setStatus('idle');
    }
    fetchData();
  }, [log.id]);

  const dataStr = status === 'idle' ? (logsData[activeTab] || '') : '';

  function exportData(type: string) {
    // TODO: dataExporter(logsData?.table || logsData, { name: fileName, type }, true);
  }

  if (status === 'loading') {
    return (
      <div className="py-8 text-center">
        <span className="text-primary">Loading...</span>
      </div>
    );
  }

  return (
    <>
      <div className="mb-2 flex items-center">
        <input
          value={fileName}
          placeholder={t('common.fileName')}
          title={t('common.fileName')}
          onChange={(e) => setFileName(e.target.value)}
        />
        <div className="grow"></div>
        {/* TODO: Export popover */}
        <button className="rounded bg-blue-500 px-3 py-1 text-white" onClick={() => exportData('json')}>
          {t('log.exportData.title')} ▼
        </button>
      </div>
      {logsData.table && (
        <div className="flex mb-2">
          <button className={activeTab === 'table' ? 'font-semibold mr-2' : 'mr-2'} onClick={() => setActiveTab('table')}>
            {t('workflow.table.title')}
          </button>
          <button className={activeTab === 'variables' ? 'font-semibold' : ''} onClick={() => setActiveTab('variables')}>
            {t('workflow.variables.title', { count: 2 })}
          </button>
        </div>
      )}
      <pre
        className={`rounded-lg bg-gray-900 p-4 text-gray-100 overflow-auto ${editorClass}`}
      >
        {dataStr}
      </pre>
    </>
  );
};

export default LogsDataViewer;
