import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface SettingsBackupItemsProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function SettingsBackupItems({ children, ...props }: SettingsBackupItemsProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="settingsbackupitems-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div className="scroll content w-full overflow-auto">
          <div {/* v-if: !query && workflows.length === 0 */} className="text-center">
            <img src="@/assets/svg/files-and-folder.svg" className="mx-auto max-w-sm" />
            <p className="text-xl font-semibold">{t('message.noData')}</p>
          </div>
          <ui-list className="space-y-1">
            <ui-list-item
              /* v-for: workflow in workflows */ key={workflow.id}
              className={'bg-box-transparent': isActive(workflow.id)}
              className="group overflow-hidden"
            >
              <ui-checkbox
                {/* v-if: !isLocal || !workflow.isInCloud */}
                disabled={exceedLimit && !isActive(workflow.id)}
                model-value={isActive(workflow.id)}
                className="mr-4"
                onChange={toggleDeleteWorkflow($event, workflow.id)}
              />
              <div {/* v-else */} className="mr-4 h-5 w-5" />
              <ui-img
                {/* v-if: workflow.icon?.startsWith('http') */}
                src={workflow.icon}
                style="height: 24px; width: 24px"
                alt="Can not display"
              />
              <i className={workflow.icon} />
              <div className="ml-2 flex-1 overflow-hidden">
                <p className="text-overflow flex-1">{workflow.name}</p>
                <p
                  className="text-overflow text-sm leading-tight text-gray-600 dark:text-gray-200"
                >
                  {workflow.description}
                </p>
              </div>
              {children}
            </ui-list-item>
          </ui-list>
        </div>
        <div className="flex items-center">
          <ui-checkbox
            model-value={exceedLimit}
            indeterminate={modelValue.length > 0 && modelValue.length < limit}
            className="mt-2 ml-4"
            onChange={emit('select', $event)}
          >
            {{
              t(
                `settings.backupWorkflows.cloud.${
                  modelValue.length > 0 && modelValue.length >= limit
                    ? 'deselectAll'
                    : 'selectAll'
                }`
              )
            }}
          </ui-checkbox>
          <div className="grow"></div>
          <span> {modelValue.length}/{limit} </span>
        </div>
    </div>
  );
}
