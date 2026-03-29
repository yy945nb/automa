import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import UiInput from '@/components/ui/UiInput';
import UiButton from '@/components/ui/UiButton';
import UiTable from '@/components/ui/UiTable';

interface StorageTable {
  id: string;
  name: string;
  rowsCount?: number;
  createdAt?: number;
}

export default function StorageTables() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<StorageTable[]>([]);

  const tableHeaders = [
    { text: t('common.name'), value: 'name' },
    { text: 'Rows', value: 'rowsCount' },
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
          {t('storage.table.add')}
        </UiButton>
      </div>
      <div className="scroll w-full overflow-x-auto">
        <UiTable
          headers={tableHeaders}
          items={items}
          className="mt-4 w-full"
        />
      </div>
    </div>
  );
}
