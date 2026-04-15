import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface WorkflowShareProps {
  show?: boolean;
  onClose?: () => void;
}

export default function WorkflowShare({ show = false, onClose }: WorkflowShareProps) {
  const { t } = useTranslation();

  if (!show) return null;

  // TODO: Full share workflow implementation (username check, description editor, category picker, publish)
  return (
    <div className="share-workflow w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
      <div className="mb-4 flex items-center">
        <p className="flex-1 text-lg font-semibold">{t('workflow.share.title')}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      <p className="text-center text-gray-500">
        {t('workflow.share.title')} — TODO: implement share form
      </p>
    </div>
  );
}
