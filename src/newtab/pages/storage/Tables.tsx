import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function StorageTablesPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="container py-8 pb-4">
      <div className="mb-4 flex items-center">
        <button
          className="hoverable mr-4 rounded-lg p-2"
          onClick={() => navigate('/storage')}
        >
          <i className="ri-arrow-left-line" />
        </button>
        <h1 className="text-2xl font-semibold">{t('storage.table.title', 'Table')}</h1>
      </div>
      <p className="text-gray-500">Table ID: {id}</p>
    </div>
  );
}
