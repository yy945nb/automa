import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function SettingsShortcuts() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="mb-8 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
        <p className="mb-2 font-semibold capitalize">Automa</p>
        <div className="flex items-center justify-between rounded-lg p-2">
          <p className="flex-1">Shortcut</p>
          <div className="flex items-center space-x-2">
            <kbd className="rounded border px-2 py-0.5 text-sm">—</kbd>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('settings.shortcuts.description', 'Manage keyboard shortcuts for your workflows.')}
      </p>
    </div>
  );
}
