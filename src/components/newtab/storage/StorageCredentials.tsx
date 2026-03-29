import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import UiInput from '@/components/ui/UiInput';
import UiButton from '@/components/ui/UiButton';
import UiTable from '@/components/ui/UiTable';

interface Credential {
  id: string;
  name: string;
  value: string;
  description?: string;
}

export default function StorageCredentials() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const tableHeaders = [
    { text: t('common.name'), value: 'name' },
    { text: 'Value', value: 'value' },
    { text: 'Actions', value: 'actions' },
  ];

  return (
    <div className="mt-4">
      <div className="mt-6 flex">
        <UiInput
          modelValue={query}
          onChange={(val) => setQuery(String(val))}
          placeholder={t('common.search')}
          prependIcon="riSearch2Line"
        />
        <div className="grow" />
        <UiButton
          variant="accent"
          className="ml-4"
          onClick={() => setShowAdd(true)}
        >
          {t('credential.add')}
        </UiButton>
      </div>
      <UiTable
        headers={tableHeaders}
        items={credentials}
        className="mt-4 w-full"
      />
    </div>
  );
}
