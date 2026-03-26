import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import cloneDeep from 'lodash.clonedeep';
import { getBlocks } from '@/utils/getSharedData';
import { debounce } from '@/utils/helper';

interface PackageSettingsProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function PackageSettings({ children, ...props }: PackageSettingsProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="packagesettings-wrapper">
      {/* Converted from Vue SFC - template below */}
      <label className="inline-flex items-center">
          <ui-switch value={packageState.settings.asBlock} onChange={(e: any) => { /* TODO update packageState.settings.asBlock */ }} />
          <span className="ml-4">
            {t('packages.settings.asBlock')}
          </span>
        </label>
        <div {/* v-if: packageState.settings.asBlock */} className="mt-6 flex space-x-6 pb-8">
          <div className="flex-1">
            <p className="font-semibold">Block inputs</p>
            <div className="mt-4">
              <div
                {/* v-if: packageState.inputs.length > 0 */}
                className="grid grid-cols-12 gap-x-4"
              >
                <div className="col-span-5 pl-1 text-sm">Input name</div>
                <div className="col-span-6 pl-1 text-sm">Block</div>
              </div>
              <draggable
                value={packageState.inputs} onChange={(e: any) => { /* TODO update packageState.inputs */ }}
                group="inputs"
                handle=".handle"
                item-key="id"
              >
                <template #item="{ element, index }">
                  <div
                    className="group relative mb-2 grid grid-cols-12 items-center gap-x-4"
                  >
                    <span
                      className="handle invisible absolute left-0 -ml-6 cursor-move group-hover:visible"
                    >
                      <i className={"ri-icon"} />
                    </span>
                    <ui-input
                      value={element.name} onChange={(e: any) => { /* TODO update element.name */ }}
                      className="col-span-5"
                      placeholder={`Input ${index + 1}`}
                    />
                    <div className="col-span-6 flex items-center">
                      <ui-button
                        v-tooltip="'Go to block'"
                        className="mr-2"
                        icon
                        onClick={emit('goBlock', element.blockId)}
                      >
                        <i className={"ri-icon"} />
                      </ui-button>
                      <p
                        title={getBlockIOName('inputs', element)}
                        className="text-overflow flex-1"
                      >
                        {getBlockIOName('inputs', element)}
                      </p>
                    </div>
                    <div className="col-span-1 text-right">
                      <i className={"ri-icon"} />
                    </div>
                  </div>
    </div>
  );
}
