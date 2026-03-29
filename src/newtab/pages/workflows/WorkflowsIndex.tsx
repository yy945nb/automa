import React from 'react';
import { useTranslation } from 'react-i18next';

export default function WorkflowsIndex() {
  const { t } = useTranslation();
  return (
    <div className="container pt-8 pb-4">
      <h1 className="text-2xl font-semibold capitalize">{t('common.workflow', { count: 2 })}</h1>
    </div>
  );
}
