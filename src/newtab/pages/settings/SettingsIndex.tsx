import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import UiSelect from '@/components/ui/UiSelect';

const deleteLogDays = ['never', 7, 14, 30, 60, 120] as const;

const supportLocales = [
  { id: 'en', name: 'English' },
  { id: 'zh', name: '中文' },
  { id: 'de', name: 'Deutsch' },
  { id: 'fr', name: 'Français' },
  { id: 'es', name: 'Español' },
  { id: 'pt', name: 'Português' },
  { id: 'ru', name: 'Русский' },
  { id: 'ja', name: '日本語' },
  { id: 'ko', name: '한국어' },
];

const themes = [
  { id: 'light', name: 'Light' },
  { id: 'dark', name: 'Dark' },
  { id: 'system', name: 'System' },
];

export default function SettingsIndex() {
  const { t } = useTranslation();
  const [isLangChange, setIsLangChange] = useState(false);

  function updateLanguage(value: string) {
    setIsLangChange(true);
    // store.updateSettings({ locale: value });
  }

  return (
    <div>
      <div className="mb-12">
        <p className="mb-1 font-semibold">{t('settings.theme')}</p>
        <div className="flex items-center space-x-4">
          {themes.map((item) => (
            <div key={item.id} className="cursor-pointer" role="button">
              <div className="rounded-lg p-0.5">
                <div className="h-20 w-36 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm">
                  {item.name}
                </div>
              </div>
              <span className="ml-1 text-sm text-gray-600 dark:text-gray-200">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center">
        <div id="languages">
          <p className="mb-1 font-semibold">{t('settings.language.label')}</p>
          <select
            className="w-80 rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-800"
            onChange={(e) => updateLanguage(e.target.value)}
          >
            {supportLocales.map((locale) => (
              <option key={locale.id} value={locale.id}>
                {locale.name}
              </option>
            ))}
          </select>
          <a
            className="ml-1 block text-gray-600 dark:text-gray-200"
            href="https://github.com/AutomaApp/automa/wiki/Help-Translate"
            target="_blank"
            rel="noopener"
          >
            {t('settings.language.helpTranslate')}
          </a>
        </div>
        {isLangChange && (
          <p className="ml-4 inline-block">{t('settings.language.reloadPage')}</p>
        )}
      </div>
      <div id="delete-logs" className="mt-12">
        <p className="mb-1 font-semibold">Workflow Logs</p>
        <div className="flex items-center">
          <select
            className="w-80 rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-800"
            onChange={(e) => {
              const val = e.target.value;
              // store.updateSettings({ deleteLogAfter: val === 'never' ? 'never' : +val });
            }}
          >
            {deleteLogDays.map((day) => (
              <option key={day} value={day}>
                {typeof day === 'string'
                  ? t('settings.deleteLog.deleteAfter.never')
                  : t('settings.deleteLog.deleteAfter.days', { day })}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
