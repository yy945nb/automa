import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import UiButton from '@/components/ui/UiButton';
import UiSpinner from '@/components/ui/UiSpinner';

export default function WorkflowHost() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [retrieved, setRetrieved] = useState(false);
  const [loadingSync, setLoadingSync] = useState(false);

  useEffect(() => {
    setRetrieved(true);
  }, [id]);

  if (!retrieved) {
    return (
      <div className="flex h-screen items-center justify-center">
        <UiSpinner color="text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="relative h-screen">
      <div className="absolute top-0 left-0 z-10 flex w-full items-center p-4">
        <div className="flex items-center">
          <button
            className="hoverable mr-4 rounded-lg p-2"
            onClick={() => navigate('/workflows')}
          >
            <i className="ri-arrow-left-line" />
          </button>
          <p className="font-semibold">{t('workflow.host.title', 'Hosted Workflow')}</p>
        </div>
        <div className="grow" />
        <UiButton loading={loadingSync} variant="accent">
          {t('workflow.host.sync.title', 'Sync')}
        </UiButton>
      </div>
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Hosted workflow: {id}</p>
      </div>
    </div>
  );
}
