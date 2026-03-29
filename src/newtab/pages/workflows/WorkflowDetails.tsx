import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';

export default function WorkflowDetails() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="container pt-8 pb-4">
      <div className="flex items-center mb-4">
        <button
          className="hoverable mr-4 rounded-lg p-2"
          onClick={() => navigate(-1)}
        >
          <i className="ri-arrow-left-line" />
        </button>
        <h1 className="text-2xl font-semibold">{t('common.workflow')}</h1>
      </div>
      <p className="text-gray-500">Workflow ID: {id}</p>
    </div>
  );
}
