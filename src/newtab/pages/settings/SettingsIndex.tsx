import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMainStore } from '@/stores/main';
import { supportLocales } from '@/utils/shared';
// import { useTheme } from '@/composable/theme';

const deleteLogDays = ['never', 7, 14, 30, 60, 120] as const;

const SettingsIndex: React.FC = () => {
  const { t } = useTranslation();
  const store = useMainStore();
  // const theme = useTheme();

  const [isLangChange, setIsLangChange] = useState(false);
  const settings = useMemo(() => store.settings, [store.settings]);

  const updateSetting = (path: string, value: any) => {
    store.updateSettings({ [path]: value });
  };

  const updateLanguage = (value: string) => {
    setIsLangChange(true);
    updateSetting('locale', value);
  };

  return (
    <>
      <div className="mb-12">
        <p className="mb-1 font-semibold">{t('settings.theme')}</p>
        <div className="flex items-center space-x-4">
          {/* Theme selection buttons would go here */}
          {['light', 'dark', 'system'].map((themeId) => (
            <div key={themeId} className="cursor-pointer" role="button" onClick={() => { /* theme.set(themeId) */ }}>
              <div className="rounded-lg p-0.5">
                <div className="w-36 h-24 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm capitalize">
                  {themeId}
                </div>
              </div>
              <span className="ml-1 text-sm text-gray-600 dark:text-gray-200 capitalize">{themeId}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center">
        <div id="languages">
          <p className="mb-1 font-semibold">{t('settings.language.label')}</p>
          <select
            value={settings?.locale || 'en'}
            onChange={(e) => updateLanguage(e.target.value)}
            className="w-80 select"
          >
            {(supportLocales || []).map((locale: any) => (
              <option key={locale.id} value={locale.id}>
                {locale.name}
              </option>
            ))}
          </select>
          <a
            className="ml-1 block text-gray-600 dark:text-gray-200"
            href="https://github.com/AutomaApp/automa/wiki/Help-Translate"
            target="_blank"
            rel="noopener noreferrer"
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
            value={settings?.deleteLogAfter ?? 'never'}
            onChange={(e) => {
              const val = e.target.value;
              updateSetting('deleteLogAfter', val === 'never' ? 'never' : Number(val));
            }}
            className="w-80 select"
          >
            {deleteLogDays.map((day) => (
              <option key={String(day)} value={day}>
                {typeof day === 'string'
                  ? t('settings.deleteLog.deleteAfter.never')
                  : t('settings.deleteLog.deleteAfter.days', { day })}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={settings?.logsLimit ?? 1000}
            min={10}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateSetting('logsLimit', val <= 0 ? 1000 : val);
            }}
            className="ml-4 input"
            placeholder="Logs limit"
          />
        </div>
      </div>
    </>
  );
};

export default SettingsIndex;