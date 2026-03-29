import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ScheduledWorkflow() {
  const { t } = useTranslation();
  return (
    <div className="container pt-8 pb-4">
      <h1 className="text-2xl font-semibold">{t('scheduledWorkflow.title', 'Scheduled Workflows')}</h1>
    </div>
  );
}
