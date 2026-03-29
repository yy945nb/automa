import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import cloneDeep from 'lodash.clonedeep';
import { debounce } from '@/utils/helper';
import SettingsTable from './settings/SettingsTable.tsx';
import SettingsBlocks from './settings/SettingsBlocks.tsx';
import SettingsEvents from './settings/SettingsEvents.tsx';
import SettingsGeneral from './settings/SettingsGeneral.tsx';

interface WorkflowSettingsProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function WorkflowSettings({ children, ...props }: WorkflowSettingsProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="workflowsettings-wrapper">
      {/* Converted from Vue SFC - template below */}
      <ui-card padding="p-0" className="workflow-settings w-full max-w-2xl">
          <div className="flex items-center px-4 pt-4">
            <p className="flex-1">
              {t('common.settings')}
            </p>
            <i className={"ri-icon"} />
          </div>
          <div className="space-x-2 px-4 pt-2">
            <ui-tabs value={activeTab} onChange={(e: any) => { /* TODO update activeTab */ }} className="space-x-2">
              <ui-tab /* v-for: tab in tabs */ key={tab.value} value={tab.value}>
                {tab.name}
              </ui-tab>
            </ui-tabs>
          </div>
          <ui-tab-panels
            value={activeTab} onChange={(e: any) => { /* TODO update activeTab */ }}
            className="scroll settings-content overflow-auto p-4"
            style="height: calc(100vh - 10rem); max-height: 600px"
          >
            <ui-tab-panel /* v-for: tab in tabs */ key={tab.value} value={tab.value}>
              <component
                data-is={tab.component}
                settings={settings}
                onUpdate={settings[$event.key] = $event.value}
              />
            </ui-tab-panel>
          </ui-tab-panels>
        </ui-card>
    </div>
  );
}
