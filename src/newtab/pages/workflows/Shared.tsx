import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import UiButton from '@/components/ui/UiButton';
import UiSpinner from '@/components/ui/UiSpinner';

export default function WorkflowShared() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [retrieved, setRetrieved] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

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
          <p className="font-semibold">{t('workflow.share.title', 'Shared Workflow')}</p>
        </div>
        <div className="grow" />
        <div className="flex items-center space-x-2">
          <button
            className="hoverable relative rounded-lg p-2"
            onClick={() => {}}
          >
            {isUnpublishing && <UiSpinner color="text-accent" className="absolute top-2 left-2" />}
            <i className={`ri-lock-2-line ${isUnpublishing ? 'opacity-75' : ''}`} />
          </button>
          <UiButton
            loading={isUpdating}
            disabled={isUnpublishing}
            variant="accent"
            onClick={() => {}}
          >
            {t('workflow.share.update', 'Update')}
          </UiButton>
        </div>
      </div>
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Shared workflow: {id}</p>
      </div>
    </div>
  );
}
