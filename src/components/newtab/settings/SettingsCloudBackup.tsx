import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchApi, cacheApi } from '@/utils/api';
import { convertWorkflow } from '@/utils/workflowData';
import { parseJSON } from '@/utils/helper';
import { useUserStore } from '@/stores/user';
import { useWorkflowStore } from '@/stores/workflow';
import dayjs from '@/lib/dayjs';
import SettingsBackupItems from './SettingsBackupItems.tsx';

interface SettingsCloudBackupProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function SettingsCloudBackup({ children, ...props }: SettingsCloudBackupProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="settingscloudbackup-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div className="cloud-backup mt-4 flex items-start">
          <div className="w-56">
            <ui-input
              value={state.query} onChange={(e: any) => { /* TODO update state.query */ }}
              placeholder={t('common.search')}
              autocomplete="off"
              prepend-icon="riSearch2Line"
            />
            <ui-list className="mt-4">
              <p className="mb-1 text-sm text-gray-600 dark:text-gray-200">
                {t('settings.backupWorkflows.cloud.location')}
              </p>
              <ui-list-item
                /* v-for: location in ['local', 'cloud'] */ key={location}
                active={location === state.activeTab}
                disabled={backupState.uploading || backupState.deleting}
                color="bg-box-transparent"
                className="mb-1 cursor-pointer"
                onClick={state.activeTab = location}
              >
                {t(`settings.backupWorkflows.cloud.buttons.${location}`)}
                <span
                  {/* v-if: location === 'cloud' */}
                  className="ml-2 rounded-full bg-accent text-center text-sm text-gray-100 dark:text-black"
                  style="height: 29px; width: 29px; line-height: 29px"
                >
                  {state.cloudWorkflows.length}
                </span>
              </ui-list-item>
            </ui-list>
            <ui-button
              {/* v-if: state.selectedWorkflows.length > 0 && state.activeTab === 'local' */}
              loading={backupState.uploading}
              variant="accent"
              className="mt-4 w-8/12"
              onClick={backupWorkflowsToCloud()}
            >
              {t('settings.backupWorkflows.backup.button')}
              ({state.selectedWorkflows.length})
            </ui-button>
            <ui-button
              {/* v-if: state.deleteIds.length > 0 && state.activeTab === 'cloud' */}
              loading={backupState.deleting}
              variant="danger"
              className="mt-4"
              onClick={deleteBackup()}
            >
              {t('settings.backupWorkflows.cloud.delete')}
              ({state.deleteIds.length})
            </ui-button>
          </div>
          <div {/* v-if: !state.backupRetrieved */} className="content block flex-1 text-center">
            <ui-spinner color="text-accent" />
          </div>
          <div {/* v-else */} className="ml-4 flex-1 overflow-hidden">
            <template {/* v-if: state.activeTab === 'cloud' */}>
              <settings-backup-items
                v-slot="{ workflow }"
                value={state.deleteIds} onChange={(e: any) => { /* TODO update state.deleteIds */ }}
                workflows={backupWorkflows}
                limit={state.cloudWorkflows.length}
                query={state.query}
                onSelect={selectAllCloud}
              >
                <p
                  title={`Last updated: ${formatDate(
                    workflow,
                    'DD MMMM YYYY, hh:mm A'
                  )}`}
                  className="ml-4 mr-8 w-3/12"
                >
                  {formatDate(workflow, 'DD MMM YYYY')}
                </p>
                <ui-spinner
                  {/* v-if: backupState.workflowId === workflow.id */}
                  color="text-accent"
                  className="ml-4"
                />
                <div {/* v-else */} className="invisible ml-4 group-hover:visible">
                  <button
                    {/* v-if: workflow.hasLocalCopy */}
                    title="Sync cloud backup to local"
                    onClick={syncCloudToLocal(workflow)}
                  >
                    <i className={"ri-icon"} />
                  </button>
                  <button
                    {/* v-else */}
                    title="Add to local"
                    onClick={syncCloudToLocal(workflow)}
                  >
                    <i className={"ri-icon"} />
                  </button>
                  <button
                    {/* v-if: !backupState.deleting */}
                    aria-label={t('settings.backupWorkflows.cloud.delete')}
                    className="ml-4"
                    title="Delete backup"
                    onClick={deleteBackup(workflow.id)}
                  >
                    <i className={"ri-icon"} />
                  </button>
                </div>
              </settings-backup-items>
    </div>
  );
}
