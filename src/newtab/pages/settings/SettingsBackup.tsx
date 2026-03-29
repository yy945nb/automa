import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import UiButton from '@/components/ui/UiButton';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
}

export default function SettingsBackup() {
  const { t } = useTranslation();
  const [loadingSync, setLoadingSync] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  // Placeholder: real implementation uses userStore
  const user = null as any;
  const lastBackup = null as string | null;

  return (
    <div className="max-w-xl">
      <div className="mb-12 rounded-lg border p-6 dark:border-gray-700">
        <h2 className="mb-2 font-semibold">{t('settings.backupWorkflows.cloud.title')}</h2>
        {user ? (
          <>
            <div className="flex items-center rounded-lg border p-4 dark:border-gray-700">
              <span className="bg-box-transparent inline-block rounded-full p-2">
                <i className="ri-upload-line" />
              </span>
              <div className="ml-4 flex-1 leading-tight">
                <p className="text-sm text-gray-600 dark:text-gray-200">
                  {t('settings.backupWorkflows.cloud.lastBackup')}
                </p>
                <p>{formatDate(lastBackup)}</p>
              </div>
              <UiButton loading={backupLoading} onClick={() => {}}>
                {t('settings.backupWorkflows.backup.button')}
              </UiButton>
            </div>
            <div className="mt-2 flex items-center rounded-lg border p-4 dark:border-gray-700">
              <span className="bg-box-transparent inline-block rounded-full p-2">
                <i className="ri-download-line" />
              </span>
              <p className="ml-4 flex-1">{t('settings.backupWorkflows.cloud.sync')}</p>
              <UiButton loading={loadingSync} className="ml-2" onClick={() => {}}>
                {t('settings.backupWorkflows.cloud.sync')}
              </UiButton>
            </div>
          </>
        ) : (
          <div className="py-4 text-center">
            <p>{t('settings.backupWorkflows.needSignin')}</p>
            <UiButton
              tag="a"
              href="https://extension.automa.site/auth"
              target="_blank"
              className="mt-4 inline-block w-44"
            >
              {t('auth.signIn')}
            </UiButton>
          </div>
        )}
      </div>
      <h2 className="mb-2 font-semibold">{t('settings.backupWorkflows.title')}</h2>
      <div className="flex space-x-4">
        <div className="w-6/12 rounded-lg border p-4 dark:border-gray-700">
          <div className="text-center">
            <span className="bg-box-transparent inline-block rounded-full p-4">
              <i className="ri-download-line text-4xl" />
            </span>
          </div>
          <p className="mt-4 font-semibold">{t('settings.backupWorkflows.export.title', 'Export')}</p>
          <UiButton className="mt-4 w-full" onClick={() => {}}>
            {t('settings.backupWorkflows.export.button', 'Export workflows')}
          </UiButton>
        </div>
        <div className="w-6/12 rounded-lg border p-4 dark:border-gray-700">
          <div className="text-center">
            <span className="bg-box-transparent inline-block rounded-full p-4">
              <i className="ri-upload-line text-4xl" />
            </span>
          </div>
          <p className="mt-4 font-semibold">{t('settings.backupWorkflows.import.title', 'Import')}</p>
          <UiButton className="mt-4 w-full" onClick={() => {}}>
            {t('settings.backupWorkflows.import.button', 'Import workflows')}
          </UiButton>
        </div>
      </div>
    </div>
  );
}
