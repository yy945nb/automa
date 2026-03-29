import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function Recording() {
  const { t } = useTranslation();

  useEffect(() => {
    // Recording page - stop recording on unmount
    return () => {
      if (typeof (window as any).stopRecording === 'function') {
        (window as any).stopRecording();
      }
    };
  }, []);

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
        <i className="ri-record-circle-line text-3xl text-red-500" />
      </div>
      <h1 className="text-2xl font-semibold">{t('recording.title', 'Recording')}</h1>
      <p className="mt-2 text-gray-500">{t('recording.description', 'Recording in progress...')}</p>
    </div>
  );
}
