import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface EditorSettings {
  minZoom: number;
  maxZoom: number;
  arrow: boolean;
  snapToGrid: boolean;
  snapGrid: [number, number];
  saveWhenExecute: boolean;
}

export default function SettingsEditor() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<EditorSettings>({
    minZoom: 0.1,
    maxZoom: 2,
    arrow: true,
    snapToGrid: false,
    snapGrid: [15, 15],
    saveWhenExecute: false,
  });

  function updateSetting<K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      // store.updateSettings({ editor: next });
      return next;
    });
  }

  return (
    <div className="max-w-2xl">
      <p className="font-semibold">Zoom</p>
      <div className="mt-1 flex items-center space-x-4">
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Min zoom</label>
          <input
            type="number"
            value={settings.minZoom}
            onChange={(e) => updateSetting('minZoom', +e.target.value)}
            className="w-32 rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Max zoom</label>
          <input
            type="number"
            value={settings.maxZoom}
            onChange={(e) => updateSetting('maxZoom', +e.target.value)}
            className="w-32 rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
      </div>
      <ul className="mt-8 space-y-4">
        <li className="flex items-center rounded-lg p-2">
          <input
            type="checkbox"
            id="arrow"
            checked={settings.arrow}
            onChange={(e) => updateSetting('arrow', e.target.checked)}
            className="mr-4 h-5 w-5 cursor-pointer"
          />
          <div className="flex-1">
            <label htmlFor="arrow" className="cursor-pointer leading-tight">
              {t('settings.editor.arrow.title')}
            </label>
            <p className="text-sm leading-tight text-gray-600 dark:text-gray-200">
              {t('settings.editor.arrow.description')}
            </p>
          </div>
        </li>
        <li className="flex items-center rounded-lg p-2">
          <input
            type="checkbox"
            id="snapToGrid"
            checked={settings.snapToGrid}
            onChange={(e) => updateSetting('snapToGrid', e.target.checked)}
            className="mr-4 h-5 w-5 cursor-pointer"
          />
          <div className="flex-1">
            <label htmlFor="snapToGrid" className="cursor-pointer leading-tight">
              {t('settings.editor.snapGrid.title')}
            </label>
            <p className="text-sm leading-tight text-gray-600 dark:text-gray-200">
              {t('settings.editor.snapGrid.description')}
            </p>
          </div>
        </li>
        {settings.snapToGrid && (
          <li className="ml-2 flex space-x-2 pl-16">
            <div>
              <label className="mb-1 block text-sm">X Axis</label>
              <input
                type="number"
                value={settings.snapGrid[0]}
                onChange={(e) => updateSetting('snapGrid', [+e.target.value, settings.snapGrid[1]])}
                className="w-28 rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Y Axis</label>
              <input
                type="number"
                value={settings.snapGrid[1]}
                onChange={(e) => updateSetting('snapGrid', [settings.snapGrid[0], +e.target.value])}
                className="w-28 rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
          </li>
        )}
        <li className="flex items-center rounded-lg p-2">
          <input
            type="checkbox"
            id="saveWhenExecute"
            checked={settings.saveWhenExecute}
            onChange={(e) => updateSetting('saveWhenExecute', e.target.checked)}
            className="mr-4 h-5 w-5 cursor-pointer"
          />
          <div className="flex-1">
            <label htmlFor="saveWhenExecute" className="cursor-pointer leading-tight">
              {t('settings.editor.saveWhenExecute.title')}
            </label>
            <p className="text-sm leading-tight text-gray-600 dark:text-gray-200">
              {t('settings.editor.saveWhenExecute.description')}
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}
