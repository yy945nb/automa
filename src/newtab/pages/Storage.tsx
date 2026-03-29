import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import StorageTables from '@/components/newtab/storage/StorageTables';
import StorageVariables from '@/components/newtab/storage/StorageVariables';
import StorageCredentials from '@/components/newtab/storage/StorageCredentials';

const TABS = ['tables', 'variables', 'credentials'] as const;
type TabValue = typeof TABS[number];

export default function Storage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabValue>(
    TABS.includes(initialTab as TabValue) ? (initialTab as TabValue) : 'tables'
  );

  function handleTabChange(tab: TabValue) {
    setActiveTab(tab);
    setSearchParams({ tab });
  }

  return (
    <div className="container py-8 pb-4">
      <div className="flex items-center">
        <h1 className="text-2xl font-semibold">{t('common.storage')}</h1>
        <a
          href="https://docs.extension.automa.site/reference/storage.html"
          title="Docs"
          className="ml-2 text-gray-600 dark:text-gray-200"
          target="_blank"
          rel="noopener"
        >
          <i className="ri-information-line" style={{ fontSize: '20px' }} />
        </a>
      </div>
      <div className="mt-5 flex space-x-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              activeTab === tab
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-600 dark:text-gray-300 hoverable'
            }`}
          >
            {tab === 'tables' && t('workflow.table.title', { count: 2 })}
            {tab === 'variables' && t('workflow.variables.title', { count: 2 })}
            {tab === 'credentials' && t('credential.title', { count: 2 })}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {activeTab === 'tables' && <StorageTables />}
        {activeTab === 'variables' && <StorageVariables />}
        {activeTab === 'credentials' && <StorageCredentials />}
      </div>
    </div>
  );
}
