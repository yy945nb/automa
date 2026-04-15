import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import cloneDeep from 'lodash.clonedeep';
import { useMainStore } from '@/stores/main';

interface EditorSettings {
  minZoom: number;
  maxZoom: number;
  arrow: boolean;
  snapToGrid: boolean;
  snapGrid: [number, number];
  saveWhenExecute: boolean;
}

const SettingsEditor: React.FC = () => {
  const { t } = useTranslation();
  const store = useMainStore();

  const [settings, setSettings] = useState<EditorSettings>({
    minZoom: 0.5,
    maxZoom: 2,
    arrow: false,
    snapToGrid: false,
    snapGrid: [15, 15],
    saveWhenExecute: false,
  });

  useEffect(() => {
    if (store.settings?.editor) {
      setSettings(cloneDeep(store.settings.editor));
    }
  }, []);

  const updateSetting = useCallback(
    (key: keyof EditorSettings, value: any) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        store.updateSettings({ editor: next });
        return next;
      });
    },
    [store]
  );

  const updateSnapGrid = useCallback(
    (index: 0 | 1, value: number) => {
      setSettings((prev) => {
        const snapGrid: [number, number] = [...prev.snapGrid] as [number, number];
        snapGrid[index] = value;
        const next = { ...prev, snapGrid };
        store.updateSettings({ editor: next });
        return next;
      });
    },
    [store]
  );

  return (
    <div className="max-w-2xl">
      <p className="font-semibold">Zoom</p>
      <div className="mt-1 flex items-center space-x-4">
        <input
          type="number"
          value={settings.minZoom}
          onChange={(e) => updateSetting('minZoom', Number(e.target.value))}
          className="input"
          placeholder="Min zoom"
        />
        <input
          type="number"
          value={settings.maxZoom}
          onChange={(e) => updateSetting('maxZoom', Number(e.target.value))}
          className="input"
          placeholder="Max zoom"
        />
      </div>
      <ul className="mt-8 space-y-2">
        <li className="flex items-center p-2">
          <input
            type="checkbox"
            checked={settings.arrow}
            onChange={(e) => updateSetting('arrow', e.target.checked)}
            className="toggle"
          />
          <div className="ml-4 flex-1">
            <p className="leading-tight">{t('settings.editor.arrow.title')}</p>
            <p className="text-sm leading-tight text-gray-600 dark:text-gray-200">
              {t('settings.editor.arrow.description')}
            </p>
          </div>
        </li>
        <li className="flex items-center p-2">
          <input
            type="checkbox"
            checked={settings.snapToGrid}
            onChange={(e) => updateSetting('snapToGrid', e.target.checked)}
            className="toggle"
          />
          <div className="ml-4 flex-1">
            <p className="leading-tight">{t('settings.editor.snapGrid.title')}</p>
            <p className="text-sm leading-tight text-gray-600 dark:text-gray-200">
              {t('settings.editor.snapGrid.description')}
            </p>
          </div>
        </li>
        {settings.snapToGrid && (
          <div className="ml-2 space-x-2 pl-16" style={{ marginTop: 0 }}>
            <input
              type="number"
              value={settings.snapGrid[0]}
              onChange={(e) => updateSnapGrid(0, Number(e.target.value))}
              className="input"
              placeholder="X Axis"
            />
            <input
              type="number"
              value={settings.snapGrid[1]}
              onChange={(e) => updateSnapGrid(1, Number(e.target.value))}
              className="input"
              placeholder="Y Axis"
            />
          </div>
        )}
        <li className="flex items-center p-2">
          <input
            type="checkbox"
            checked={settings.saveWhenExecute}
            onChange={(e) => updateSetting('saveWhenExecute', e.target.checked)}
            className="toggle"
          />
          <div className="ml-4 flex-1">
            <p className="leading-tight">{t('settings.editor.saveWhenExecute.title')}</p>
            <p className="text-sm leading-tight text-gray-600 dark:text-gray-200">
              {t('settings.editor.saveWhenExecute.description')}
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
};

export default SettingsEditor;