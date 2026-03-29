import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import UiInput from '@/components/ui/UiInput';
import UiButton from '@/components/ui/UiButton';
import UiTable from '@/components/ui/UiTable';

interface StorageVariable {
  id: string;
  name: string;
  value: any;
}

export default function StorageVariables() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [variables, setVariables] = useState<StorageVariable[]>([]);

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
        <UiButton variant="accent" className="ml-4">
          Add variable
        </UiButton>
      </div>
      <UiTable
        headers={tableHeaders}
        items={variables}
        className="mt-4 w-full"
      />
    </div>
  );
}
