import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LogsVariablesProps {
  currentLog: {
    data?: {
      variables?: Record<string, any>;
    };
  };
}

const LogsVariables: React.FC<LogsVariablesProps> = ({ currentLog }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'gui' | 'raw'>('gui');

  const variables: Record<string, any> = currentLog.data?.variables || {};

  if (Object.keys(variables).length === 0) {
    return (
      <div className="text-center">
        <img src="/assets/svg/files-and-folder.svg" className="mx-auto max-w-sm" />
        <p className="text-xl font-semibold">{t('message.noData')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex">
        <button
          className={activeTab === 'gui' ? 'font-semibold' : ''}
          onClick={() => setActiveTab('gui')}
        >
          GUI
        </button>
        <button
          className={activeTab === 'raw' ? 'ml-2 font-semibold' : 'ml-2'}
          onClick={() => setActiveTab('raw')}
        >
          Raw
        </button>
      </div>
      {activeTab === 'gui' ? (
        <div className="mt-4">
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(variables).map(([varName, varValue]) => (
              <li key={varName} className="flex items-center space-x-2 rounded-lg border-2 px-2 pb-2 pt-1">
                <div className="w-full">
                  <label className="text-sm">{t('common.name')}</label>
                  <input className="w-full" value={String(varName)} readOnly placeholder="EMPTY" />
                </div>
                <div className="w-full">
                  <label className="text-sm">Value</label>
                  <input
                    className="w-full"
                    value={typeof varValue === 'string' ? varValue : JSON.stringify(varValue)}
                    readOnly
                    placeholder="EMPTY"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <pre className="mt-4 rounded-lg bg-gray-900 p-4 text-gray-100 overflow-auto">
          {JSON.stringify(variables, null, 2)}
        </pre>
      )}
    </>
  );
};

export default LogsVariables;
