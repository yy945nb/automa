import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useHasPermissions } from '@/composable/hasPermissions';
import { clearCache } from '@/utils/helper';

interface SettingsGeneralProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function SettingsGeneral({ children, ...props }: SettingsGeneralProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="settingsgeneral-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div className="flex items-center">
          <div className="mr-4 flex-1">
            <p>
              {t('workflow.settings.onError.title')}
            </p>
            <p className="text-sm leading-tight text-gray-600 dark:text-gray-200">
              {t('workflow.settings.onError.description')}
            </p>
          </div>
          <ui-select
            model-value={settings.onError}
            onChange={updateSetting('onError', $event)}
          >
            <option /* v-for: item in onError */ key={item.id} value={item.id}>
              {t(`workflow.settings.onError.items.${item.name}`)}
            </option>
          </ui-select>
          <div
            {/* v-if: settings.onError === 'restart-workflow' */}
            title={t('workflow.settings.restartWorkflow.description')}
            className="bg-input ml-4 flex items-center rounded-lg transition-colors"
          >
            <input
              value={settings.restartTimes ?? 3}
              type="number"
              className="w-12 appearance-none rounded-lg bg-transparent py-2 pl-2 text-right"
              onInput={updateSetting('restartTimes', +($event.target.value ?? 3))}
            />
            <span className="px-2 text-sm">
              {t('workflow.settings.restartWorkflow.times')}
            </span>
          </div>
        </div>
        <div {/* v-if: !isFirefox */} className="flex items-center pt-4">
          <div className="mr-4 flex-1">
            <p>Workflow Execution</p>
            <p className="text-sm leading-tight text-gray-600 dark:text-gray-200">
              Workflow execution environment (Use "Popup" if workflow runs more than 5
              minutes)
            </p>
          </div>
          <a
            href="https://docs.extension.automa.site/workflow/settings.html#workflow-execution"
            className="mr-2"
            target="_blank"
          >
            <i className={"ri-icon"} />
          </a>
          <ui-select
            model-value={settings.execContext || 'popup'}
            onChange={updateSetting('execContext', $event)}
          >
            <option value="popup">Popup</option>
            <option value="background">Background</option>
          </ui-select>
        </div>
        <div className="flex items-center pt-4">
          <div className="mr-4 flex-1">
            <p>
              {t('workflow.settings.notification.title')}
            </p>
            <p className="text-sm leading-tight text-gray-600 dark:text-gray-200">
              {{
                t(
                  `workflow.settings.notification.${
                    permissions.has.notifications ? 'description' : 'noPermission'
                  }`
                )
              }}
            </p>
          </div>
          <ui-switch
            {/* v-if: permissions.has.notifications */}
            model-value={settings.notification}
            onChange={updateSetting('notification', $event)}
          />
          <ui-button {/* v-else */} onClick={permissions.request(true)}>
            {t('workflow.blocks.clipboard.grantPermission')}
          </ui-button>
        </div>
        <div
          /* v-for: item in settingItems */ key={item.id}
          className="flex items-center pt-4"
        >
          <div className="mr-4 flex-1">
            <p>
              {item.name}
            </p>
            <p
              {/* v-if: item.notSupport?.includes(browserType) */}
              className="text-sm leading-tight text-red-400 dark:text-red-300"
            >
              {{
                t('log.messages.browser-not-supported', {
                  browser: browserType,
                })
              }}
            </p>
            <p {/* v-else */} className="text-sm leading-tight text-gray-600 dark:text-gray-200">
              {item.description}
            </p>
          </div>
          <ui-switch
            {/* v-if: !item.notSupport?.includes(browserType) */}
            disabled={item.disabled}
            model-value={settings[item.id]}
            onChange={updateSetting(item.id, $event)}
          />
        </div>
        <div className="flex items-center pt-4">
          <div className="mr-4 flex-1">
            <p>
              {t('workflow.settings.clearCache.title')}
            </p>
            <p className="text-sm leading-tight text-gray-600 dark:text-gray-200">
              {t('workflow.settings.clearCache.description')}
            </p>
          </div>
          <ui-button onClick={onClearCacheClick}>
            {t('workflow.settings.clearCache.btn')}
          </ui-button>
        </div>
        <div className="flex items-center pt-4">
          <div className="mr-4 flex-1">
            <p>
              {t('workflow.settings.publicId.title')}
            </p>
            <p className="text-sm leading-tight text-gray-600 dark:text-gray-200">
              {t('workflow.settings.publicId.description')}
            </p>
          </div>
          <a
            href="https://docs.extension.automa.site/blocks/trigger.html#trigger-using-js-customevent"
            target="_blank"
            rel="noopener"
            className="mr-2 text-gray-600 dark:text-gray-200"
          >
            <i className={"ri-icon"} />
          </a>
          <ui-input
            model-value={settings.publicId}
            placeholder="myWorkflowPublicId"
            onChange={updateSetting('publicId', $event)}
          />
        </div>
    </div>
  );
}
