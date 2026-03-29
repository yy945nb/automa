import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
// TODO: import dataExporter from '@/utils/dataExporter';
// TODO: import { dataExportTypes } from '@/utils/shared';

interface TableHeader {
  value: string;
  text: string;
  filterable?: boolean;
  sortable?: boolean;
}

interface LogsTableProps {
  tableData: {
    body: any[];
    header: TableHeader[];
    converted?: boolean;
  };
  currentLog: {
    name?: string;
    data?: {
      table?: any[];
    };
  };
}

const LogsTable: React.FC<LogsTableProps> = ({ tableData, currentLog }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'table' | 'raw'>('table');
  const [query, setQuery] = useState('');

  if (tableData.body.length === 0) {
    return (
      <div className="text-center">
        <img src="/assets/svg/files-and-folder.svg" className="mx-auto max-w-sm" />
        <p className="text-xl font-semibold">{t('message.noData')}</p>
      </div>
    );
  }

  const filteredBody = query
    ? tableData.body.filter((row) =>
        Object.values(row).some((v) => String(v).toLowerCase().includes(query.toLowerCase()))
      )
    : tableData.body;

  return (
    <>
      <div className="flex items-center">
        <div className="mb-4 flex">
          <button className={activeTab === 'table' ? 'font-semibold' : ''} onClick={() => setActiveTab('table')}>Table</button>
          <button className={activeTab === 'raw' ? 'ml-2 font-semibold' : 'ml-2'} onClick={() => setActiveTab('raw')}>Raw</button>
        </div>
        <div className="grow"></div>
        {activeTab === 'table' && (
          <input
            value={query}
            placeholder={t('common.search')}
            className="mr-4"
            type="search"
            onChange={(e) => setQuery(e.target.value)}
          />
        )}
        {/* TODO: Export popover */}
        <button className="rounded bg-blue-500 px-3 py-1 text-white">
          {t('log.exportData.title')} ▼
        </button>
      </div>
      {activeTab === 'raw' ? (
        <pre className="overflow-auto rounded-lg bg-gray-900 p-4 text-gray-100" style={{ maxHeight: 600 }}>
          {JSON.stringify(currentLog.data?.table, null, 2)}
        </pre>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {tableData.header.map((h) => (
                  <th key={h.value} className="p-2 text-left">{h.text || h.value}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredBody.map((row, i) => (
                <tr key={row.id ?? i} className="border-t">
                  {tableData.header.map((h) => (
                    <td key={h.value} className="p-2">{String(row[h.value] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default LogsTable;
