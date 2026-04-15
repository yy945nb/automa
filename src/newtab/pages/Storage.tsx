import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

// These will be actual components; stubbed for now
const StorageTables: React.FC = () => <div>Storage Tables Component</div>;
const StorageVariables: React.FC = () => <div>Storage Variables Component</div>;
const StorageCredentials: React.FC = () => <div>Storage Credentials Component</div>;

const tabs = ['tables', 'variables', 'credentials'] as const;
type TabValue = typeof tabs[number];

const Storage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') as TabValue | null;
  const [activeTab, setActiveTab] = useState<TabValue>(
    tabParam && tabs.includes(tabParam) ? tabParam : 'tables'
  );

  const onTabChange = (value: TabValue) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  return (
    <div className="container py-8 pb-4">
      <div className="flex items-center">
        <h1 className="text-2xl font-semibold">{t('common.storage')}</h1>
        <a
          href="https://docs.extension.automa.site/reference/storage.html"
          title="Docs"
          className="ml-2 text-gray-600 dark:text-gray-200"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="remix-icon" data-icon="riInformationLine" style={{ fontSize: 20 }} />
        </a>
      </div>
      <div className="mt-5 flex space-x-1 border-b dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === tab
                ? 'border-b-2 border-accent text-accent'
                : 'text-gray-600 dark:text-gray-200'
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
};

export default Storage;