import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import defu from 'defu';
import { excludeOnError } from '@/utils/shared';
import BlockSettingLines from './BlockSetting/BlockSettingLines.vue';
import BlockSettingOnError from './BlockSetting/BlockSettingOnError.vue';
import BlockSettingGeneral from './BlockSetting/BlockSettingGeneral.vue';

interface EditBlockSettingsProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function EditBlockSettings({ children, ...props }: EditBlockSettingsProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="editblocksettings-wrapper">
      {/* Converted from Vue SFC - template below */}
      <ui-tabs value={state.activeTab} onChange={(e: any) => { /* TODO update state.activeTab */ }} className="-mt-2">
          <ui-tab /* v-for: tab in tabs */ key={tab.id} value={tab.id}>
            {tab.name}
          </ui-tab>
        </ui-tabs>
        <ui-tab-panels {/* v-if: state.retrieved */} value={state.activeTab} onChange={(e: any) => { /* TODO update state.activeTab */ }} className="mt-4">
          <ui-tab-panel value="general">
            <block-setting-general
              v-modeldata={state.settings}
              block={data}
              onChange={onDataChange('settings', $event)}
            />
          </ui-tab-panel>
          <ui-tab-panel value="on-error">
            {/* slot: on-error */}
          </ui-tab-panel>
          <ui-tab-panel value="lines">
            <block-setting-lines block-id={data.blockId} />
          </ui-tab-panel>
        </ui-tab-panels>
    </div>
  );
}
