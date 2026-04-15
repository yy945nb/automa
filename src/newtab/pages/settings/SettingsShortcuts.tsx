import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastification';
import browser from 'webextension-polyfill';
import { mapShortcuts, getReadableShortcut } from '@/composable/shortcut';
import { recordShortcut } from '@/utils/recordKeys';

interface RecordingState {
  id: string;
  keys: string[];
  isChanged: boolean;
}

const SettingsShortcuts: React.FC = () => {
  const { t } = useTranslation();

  const [shortcuts, setShortcuts] = useState<Record<string, any>>(mapShortcuts);
  const [automaShortcut, setAutomaShortcut] = useState(getReadableShortcut('mod+shift+e'));
  const [recording, setRecording] = useState<RecordingState>({
    id: '',
    keys: [],
    isChanged: false,
  });

  const recordingRef = useRef(recording);
  recordingRef.current = recording;

  const shortcutsCats = useMemo(() => {
    const arr = Object.values(shortcuts);
    const result: Record<string, any[]> = {};

    arr.forEach((item: any) => {
      const [category, shortcutName] = item.id.split(':');
      const readableKey = getReadableShortcut(item.combo);
      const name = shortcutName.replace('-', ' ');

      (result[category] = result[category] || []).push({
        ...item,
        name,
        keys: readableKey.split('+'),
      });
    });

    return result;
  }, [shortcuts]);

  const keydownListener = useCallback((event: KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!recordingRef.current.id) {
      document.removeEventListener('keydown', keydownListener, true);
      return;
    }

    recordShortcut(event, (keys: string[]) => {
      setRecording((prev) => ({ ...prev, keys }));
    });
  }, []);

  const cleanUp = useCallback(() => {
    setRecording((prev) => ({ ...prev, id: '', keys: [] }));
    document.removeEventListener('keydown', keydownListener, true);
  }, [keydownListener]);

  const startRecording = useCallback(
    ({ id }: { id: string }) => {
      if (!recordingRef.current.id) {
        document.addEventListener('keydown', keydownListener, true);
      }
      setRecording((prev) => ({ ...prev, keys: [], id }));
    },
    [keydownListener]
  );

  const removeShortcut = useCallback((shortcutId: string) => {
    if (shortcutId !== 'automa:shortcut') return;
    browser.storage.local.set({ automaShortcut: [] });
    setAutomaShortcut('');
  }, []);

  const stopRecording = useCallback(() => {
    const rec = recordingRef.current;
    if (rec.keys.length === 0) return;

    const newCombo = rec.keys.join('+');

    if (rec.id.startsWith('automa')) {
      browser.storage.local.set({ automaShortcut: newCombo });
      setAutomaShortcut(getReadableShortcut(newCombo));
      cleanUp();
      return;
    }

    const isDuplicate = Object.keys(shortcuts).find((key) => {
      return shortcuts[key].combo === newCombo && key !== rec.id;
    });

    if (isDuplicate) {
      toast.error(t('settings.shortcuts.duplicate', { name: isDuplicate }));
      return;
    }

    setShortcuts((prev) => {
      const next = { ...prev };
      next[rec.id] = { ...next[rec.id], combo: newCombo };
      localStorage.setItem('shortcuts', JSON.stringify(next));
      return next;
    });
    cleanUp();
    setRecording((prev) => ({ ...prev, isChanged: true }));
  }, [shortcuts, cleanUp, t]);

  useEffect(() => {
    browser.storage.local.get('automaShortcut').then((storage: any) => {
      if (!storage.automaShortcut) return;
      setAutomaShortcut(getReadableShortcut(storage.automaShortcut));
    });

    return () => {
      document.removeEventListener('keydown', keydownListener, true);
    };
  }, []);

  return (
    <>
      {recording.isChanged && (
        <p className="mb-4 text-gray-600 dark:text-gray-200">
          {t('settings.language.reloadPage')}
        </p>
      )}
      <div className="mb-8 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
        <p className="mb-2 font-semibold capitalize">Automa</p>
        <ul>
          <li className="group flex items-center p-2">
            <p className="flex-1">Shortcut</p>
            {recording.id === 'automa:shortcut' ? (
              <>
                {recording.keys.map((key) => (
                  <kbd key={key} className="ml-1 rounded-lg border p-1 px-2 text-sm shadow" style={{ minWidth: 30, textAlign: 'center', textTransform: 'uppercase' }}>
                    {getReadableShortcut(key)}
                  </kbd>
                ))}
                <button className="mr-2 ml-4" title={t('common.cancel')} onClick={cleanUp}>
                  <span className="remix-icon" data-icon="riCloseLine" />
                </button>
                <button title={t('workflow.blocks.trigger.shortcut.stopRecord')} onClick={stopRecording}>
                  <span className="remix-icon" data-icon="riStopLine" />
                </button>
              </>
            ) : (
              <>
                <button
                  className="invisible mr-4 group-hover:visible"
                  title="Remove shortcut"
                  onClick={() => removeShortcut('automa:shortcut')}
                >
                  <span className="remix-icon" data-icon="riDeleteBin7Line" />
                </button>
                <button
                  className="invisible group-hover:visible"
                  title={t('workflow.blocks.trigger.shortcut.tooltip')}
                  onClick={() => startRecording({ id: 'automa:shortcut' })}
                >
                  <span className="remix-icon" data-icon="riRecordCircleLine" />
                </button>
                {automaShortcut.split('+').map((key) => (
                  <kbd key={key} className="ml-1 rounded-lg border p-1 px-2 text-sm shadow" style={{ minWidth: 30, textAlign: 'center', textTransform: 'uppercase' }}>
                    {key}
                  </kbd>
                ))}
              </>
            )}
          </li>
        </ul>
      </div>
      {Object.entries(shortcutsCats).map(([category, items]) => (
        <div key={category} className="mb-8 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <p className="mb-2 font-semibold capitalize">{category}</p>
          <ul className="space-y-1 text-gray-600 dark:text-gray-200">
            {items.map((shortcut: any) => (
              <li key={shortcut.id} className="group flex h-12 items-center p-2">
                <p className="mr-4 flex-1 capitalize">{shortcut.name}</p>
                {recording.id === shortcut.id ? (
                  <>
                    {recording.keys.map((key) => (
                      <kbd key={key} className="ml-1 rounded-lg border p-1 px-2 text-sm shadow" style={{ minWidth: 30, textAlign: 'center', textTransform: 'uppercase' }}>
                        {getReadableShortcut(key)}
                      </kbd>
                    ))}
                    <button className="mr-2 ml-4" title={t('common.cancel')} onClick={cleanUp}>
                      <span className="remix-icon" data-icon="riCloseLine" />
                    </button>
                    <button title={t('workflow.blocks.trigger.shortcut.stopRecord')} onClick={stopRecording}>
                      <span className="remix-icon" data-icon="riStopLine" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="invisible group-hover:visible"
                      title={t('workflow.blocks.trigger.shortcut.tooltip')}
                      onClick={() => startRecording(shortcut)}
                    >
                      <span className="remix-icon" data-icon="riRecordCircleLine" />
                    </button>
                    {shortcut.keys.map((key: string) => (
                      <kbd key={key} className="ml-1 rounded-lg border p-1 px-2 text-sm shadow" style={{ minWidth: 30, textAlign: 'center', textTransform: 'uppercase' }}>
                        {key}
                      </kbd>
                    ))}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
};

export default SettingsShortcuts;