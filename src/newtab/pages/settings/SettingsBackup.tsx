import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import browser from 'webextension-polyfill';
import dayjs from 'dayjs';
import AES from 'crypto-js/aes';
import encUtf8 from 'crypto-js/enc-utf8';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import cronParser from 'cron-parser';

import { useUserStore } from '@/stores/user';
import { useWorkflowStore } from '@/stores/workflow';
import { getUserWorkflows } from '@/utils/api';
import { fileSaver, openFilePicker, parseJSON } from '@/utils/helper';
import { readableCron } from '@/lib/cronstrue';
import dbStorage from '@/db/storage';

const BACKUP_SCHEDULES: Record<string, string> = {
  '0 8 * * *': 'Every day',
  '0 8 * * 0': 'Every week',
};

const BACKUP_ITEMS_INCLUDES = [
  { id: 'storage:table', name: 'Storage tables' },
  { id: 'storage:variables', name: 'Storage variables' },
];

interface BackupState {
  ids: string[];
  modal: boolean;
  loading: boolean;
}

interface LocalBackupSchedule {
  schedule: string;
  lastBackup: string | null;
  includedItems: string[];
  customSchedule: string;
  folderName: string;
}

const SettingsBackup: React.FC = () => {
  const { t } = useTranslation();
  const userStore = useUserStore();
  const workflowStore = useWorkflowStore();

  const [encrypt, setEncrypt] = useState(false);
  const [updateIfExists, setUpdateIfExists] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [loadingSync, setLoadingSync] = useState(false);

  const [backupState, setBackupState] = useState<BackupState>({
    ids: [],
    modal: false,
    loading: false,
  });

  const [localBackupSchedule, setLocalBackupSchedule] =
    useState<LocalBackupSchedule>({
      schedule: '',
      lastBackup: null,
      includedItems: [],
      customSchedule: '',
      folderName: 'automa-backup',
    });

  // ── helpers ─────────────────────────────────────────────

  const formatDate = (date: string | null) => {
    if (!date) return 'null';
    return dayjs(date).format('DD MMMM YYYY, hh:mm A');
  };

  const getBackupScheduleCron = () => {
    try {
      return readableCron(localBackupSchedule.customSchedule);
    } catch (error: any) {
      return error.message;
    }
  };

  const registerScheduleBackup = useCallback(async () => {
    try {
      if (!localBackupSchedule.schedule.trim()) {
        await browser.alarms.clear('schedule-local-backup');
      } else {
        const expression =
          localBackupSchedule.schedule === 'custom'
            ? localBackupSchedule.customSchedule
            : localBackupSchedule.schedule;
        const parsedExpression = cronParser
          .parseExpression(expression)
          .next();
        if (!parsedExpression) return;

        await browser.alarms.create('schedule-local-backup', {
          when: (parsedExpression as any).getTime(),
        });
      }

      browser.storage.local.set({
        localBackupSettings: { ...localBackupSchedule },
      });
    } catch (error) {
      console.error(error);
    }
  }, [localBackupSchedule]);

  const syncBackupWorkflows = async () => {
    try {
      setLoadingSync(true);
      const { backup, hosted } = await getUserWorkflows(false);
      const backupIds = backup.map(({ id }: any) => id);

      userStore.backupIds = backupIds;
      userStore.hostedWorkflows = hosted;

      await browser.storage.local.set({
        backupIds,
        lastBackup: new Date().toISOString(),
      });

      await workflowStore.insertOrUpdate(backup, { checkUpdateDate: true });
      setLoadingSync(false);
    } catch (error) {
      console.error(error);
      setLoadingSync(false);
    }
  };

  const backupWorkflows = async () => {
    try {
      const workflows = (workflowStore.getWorkflows ?? []).reduce(
        (acc: any[], workflow: any) => {
          if (workflow.isProtected) return acc;
          const copy = { ...workflow };
          delete copy.$id;
          delete copy.createdAt;
          delete copy.data;
          delete copy.isDisabled;
          delete copy.isProtected;
          acc.push(copy);
          return acc;
        },
        []
      );

      const payload: Record<string, any> = {
        isProtected: encrypt,
        workflows: JSON.stringify(workflows),
      };

      if (localBackupSchedule.includedItems.includes('storage:table')) {
        const tables = await dbStorage.tablesItems.toArray();
        payload.storageTables = JSON.stringify(tables);
      }
      if (localBackupSchedule.includedItems.includes('storage:variables')) {
        const variables = await dbStorage.variables.toArray();
        payload.storageVariables = JSON.stringify(variables);
      }

      const downloadFile = (data: any) => {
        const fileName = `automa-${dayjs().format('DD-MM-YYYY')}.json`;
        const blob = new Blob([JSON.stringify(data)], {
          type: 'application/json',
        });
        const objectUrl = URL.createObjectURL(blob);
        fileSaver(fileName, objectUrl);
        URL.revokeObjectURL(objectUrl);
      };

      if (encrypt) {
        const password = window.prompt(t('common.password'));
        if (!password) return;

        const encryptedWorkflows = AES.encrypt(
          payload.workflows,
          password
        ).toString();
        const hmac = hmacSHA256(encryptedWorkflows, password).toString();
        payload.workflows = hmac + encryptedWorkflows;
        downloadFile(payload);
      } else {
        downloadFile(payload);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const restoreWorkflows = async () => {
    try {
      const [file] = await openFilePicker('application/json');
      const reader = new FileReader();

      const insertWorkflows = (workflows: any[]) => {
        const newWorkflows = workflows.map((workflow) => {
          if (!updateIfExists) {
            workflow.createdAt = Date.now();
            delete workflow.id;
          }
          return workflow;
        });

        if (updateIfExists) {
          return workflowStore.insertOrUpdate(newWorkflows, {
            duplicateId: true,
          });
        }
        return workflowStore.insert(newWorkflows);
      };

      reader.onload = ({ target }) => {
        let payload = parseJSON(target?.result as string, null);
        if (!payload)
          payload = parseJSON(
            window.decodeURIComponent(target?.result as string),
            null
          );
        if (!payload) return;

        const storageTables = parseJSON(payload.storageTables, null);
        if (Array.isArray(storageTables)) {
          dbStorage.tablesItems.bulkPut(storageTables);
        }

        const storageVariables = parseJSON(payload.storageVariables, null);
        if (Array.isArray(storageVariables)) {
          dbStorage.variables.bulkPut(storageVariables);
        }

        if (payload.isProtected) {
          const password = window.prompt(t('common.password'));
          if (!password) return;

          const hmac = payload.workflows.substring(0, 64);
          const encryptedWorkflows = payload.workflows.substring(64);
          const decryptedHmac = hmacSHA256(
            encryptedWorkflows,
            password
          ).toString();

          if (hmac !== decryptedHmac) {
            alert(t('settings.backupWorkflows.invalidPassword'));
            return;
          }

          const decryptedWorkflows = AES.decrypt(
            encryptedWorkflows,
            password
          ).toString(encUtf8);
          payload.workflows = parseJSON(decryptedWorkflows, []);
          insertWorkflows(payload.workflows);
        } else {
          payload.workflows = parseJSON(payload.workflows, []);
          insertWorkflows(payload.workflows);
        }
      };

      reader.readAsText(file);
    } catch (error: any) {
      console.error(error);
    }
  };

  // ── mount ───────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      const { lastBackup: lb, lastSync, localBackupSettings } =
        await browser.storage.local.get([
          'lastSync',
          'lastBackup',
          'localBackupSettings',
        ]);

      if (localBackupSettings) {
        setLocalBackupSchedule((prev) => ({ ...prev, ...localBackupSettings }));
      }

      setLastBackup(lb ?? null);
    })();
  }, []);

  // ── helpers for included items toggle ────────────────────
  const toggleIncludedItem = (itemId: string, checked: boolean) => {
    setLocalBackupSchedule((prev) => {
      const items = checked
        ? [...prev.includedItems, itemId]
        : prev.includedItems.filter((id) => id !== itemId);
      return { ...prev, includedItems: items };
    });
  };

  return (
    <div className="max-w-xl">
      {/* Cloud backup card */}
      <div className="mb-12 rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-2 font-semibold">
          {t('settings.backupWorkflows.cloud.title')}
        </h2>

        {userStore.user ? (
          <>
            <div className="flex items-center rounded-lg border p-4 dark:border-gray-700">
              <span className="bg-box-transparent inline-block rounded-full p-2">
                <span className="remix-icon" data-icon="riUploadLine" />
              </span>
              <div className="ml-4 flex-1 leading-tight">
                <p className="text-sm text-gray-600 dark:text-gray-200">
                  {t('settings.backupWorkflows.cloud.lastBackup')}
                </p>
                <p>{formatDate(lastBackup)}</p>
              </div>
              <button
                className="btn"
                disabled={backupState.loading}
                onClick={() =>
                  setBackupState((s) => ({ ...s, modal: true }))
                }
              >
                {t('settings.backupWorkflows.backup.button')}
              </button>
            </div>
            <div className="mt-2 flex items-center rounded-lg border p-4 dark:border-gray-700">
              <span className="bg-box-transparent inline-block rounded-full p-2">
                <span className="remix-icon" data-icon="riDownloadLine" />
              </span>
              <p className="ml-4 flex-1">
                {t('settings.backupWorkflows.cloud.sync')}
              </p>
              <button
                className="btn ml-2"
                disabled={loadingSync}
                onClick={syncBackupWorkflows}
              >
                {t('settings.backupWorkflows.cloud.sync')}
              </button>
            </div>
          </>
        ) : (
          <div className="py-4 text-center">
            <p>{t('settings.backupWorkflows.needSignin')}</p>
            <a
              href="https://extension.automa.site/auth"
              target="_blank"
              rel="noopener noreferrer"
              className="btn mt-4 inline-block w-44"
            >
              {t('auth.signIn')}
            </a>
          </div>
        )}
      </div>

      {/* Local backup */}
      <h2 className="mb-2 font-semibold">
        {t('settings.backupWorkflows.title')}
      </h2>
      <div className="flex space-x-4">
        {/* Backup panel */}
        <div className="w-6/12 rounded-lg border p-4 dark:border-gray-700">
          <div className="text-center">
            <span className="bg-box-transparent inline-block rounded-full p-4">
              <span
                className="remix-icon"
                data-icon="riDownloadLine"
                style={{ fontSize: 36 }}
              />
            </span>
          </div>
          <label className="mt-6 mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={encrypt}
              onChange={(e) => setEncrypt(e.target.checked)}
            />
            {t('settings.backupWorkflows.backup.encrypt')}
          </label>
          <div className="flex items-center gap-2">
            <details
              className="relative"
              onToggle={(e) => {
                if (!(e.target as HTMLDetailsElement).open) {
                  registerScheduleBackup();
                }
              }}
            >
              <summary
                className={`btn icon ${
                  localBackupSchedule.schedule ? 'text-primary' : ''
                }`}
                title={t('settings.backupWorkflows.backup.settings')}
              >
                <span className="remix-icon" data-icon="riSettings3Line" />
              </summary>
              <div className="absolute left-0 z-10 mt-1 w-64 rounded-lg border bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <p className="mb-2 font-semibold">
                  {t('settings.backupWorkflows.backup.settings')}
                </p>
                <p>Also backup</p>
                <div className="mt-1 flex flex-col gap-2">
                  {BACKUP_ITEMS_INCLUDES.map((item) => (
                    <label key={item.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={localBackupSchedule.includedItems.includes(
                          item.id
                        )}
                        onChange={(e) =>
                          toggleIncludedItem(item.id, e.target.checked)
                        }
                      />
                      {item.name}
                    </label>
                  ))}
                </div>
                <p className="mt-4">
                  {t('settings.backupWorkflows.backup.schedule')}
                </p>
                <select
                  value={localBackupSchedule.schedule}
                  onChange={(e) =>
                    setLocalBackupSchedule((prev) => ({
                      ...prev,
                      schedule: e.target.value,
                    }))
                  }
                  className="mt-2 w-full select"
                >
                  <option value="">Never</option>
                  {Object.entries(BACKUP_SCHEDULES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
                {localBackupSchedule.schedule === 'custom' && (
                  <>
                    <input
                      value={localBackupSchedule.customSchedule}
                      onChange={(e) =>
                        setLocalBackupSchedule((prev) => ({
                          ...prev,
                          customSchedule: e.target.value,
                        }))
                      }
                      className="input mt-2 w-full"
                      placeholder="0 8 * * *"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {getBackupScheduleCron()}
                    </p>
                  </>
                )}
                {localBackupSchedule.schedule !== '' && (
                  <input
                    value={localBackupSchedule.folderName}
                    onChange={(e) =>
                      setLocalBackupSchedule((prev) => ({
                        ...prev,
                        folderName: e.target.value,
                      }))
                    }
                    className="input mt-2 w-full"
                    placeholder="backup-folder"
                  />
                )}
                {localBackupSchedule.lastBackup && (
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                    Last backup:{' '}
                    {dayjs(localBackupSchedule.lastBackup).fromNow()}
                  </p>
                )}
              </div>
            </details>
            <button className="btn flex-1" onClick={backupWorkflows}>
              {t('settings.backupWorkflows.backup.button')}
            </button>
          </div>
        </div>

        {/* Restore panel */}
        <div className="w-6/12 rounded-lg border p-4 dark:border-gray-700">
          <div className="text-center">
            <span className="bg-box-transparent inline-block rounded-full p-4">
              <span
                className="remix-icon"
                data-icon="riUploadLine"
                style={{ fontSize: 36 }}
              />
            </span>
          </div>
          <label className="mt-6 mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={updateIfExists}
              onChange={(e) => setUpdateIfExists(e.target.checked)}
            />
            {t('settings.backupWorkflows.restore.update')}
          </label>
          <button className="btn w-full" onClick={restoreWorkflows}>
            {t('settings.backupWorkflows.restore.button')}
          </button>
        </div>
      </div>

      {/* Cloud backup modal */}
      {backupState.modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="max-w-5xl rounded-lg bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold">
              {t('settings.backupWorkflows.cloud.title')}
            </h3>
            {/* SettingsCloudBackup component placeholder */}
            <p className="text-gray-600 dark:text-gray-300">
              Cloud backup UI (SettingsCloudBackup component)
            </p>
            <button
              className="btn mt-4"
              onClick={() =>
                setBackupState((s) => ({ ...s, modal: false }))
              }
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsBackup;
