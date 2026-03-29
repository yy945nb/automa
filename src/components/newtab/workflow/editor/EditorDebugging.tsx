import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from '@/lib/dayjs';
import { tasks } from '@/utils/shared';
import { debounce } from '@/utils/helper';
import { sendMessage } from '@/utils/message';

interface EditorDebuggingProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function EditorDebugging({ children, ...props }: EditorDebuggingProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="editordebugging-wrapper">
      {/* Converted from Vue SFC - template below */}
      <ui-card
          {/* v-if: workflowState?.state */}
          className="shadow-xl flex items-start fixed bottom-8 z-50 left-1/2 -translate-x-1/2"
        >
          <div className="mr-4 w-52">
            <div className="flex items-center gap-2">
              <ui-button
                disabled={workflowState.state.nextBlockBreakpoint}
                variant="accent"
                className="flex-1"
                onClick={toggleExecution}
              >
                <i className={
                    workflowState.status === 'breakpoint'
                      ? 'riPlayLine'
                      : 'riPauseLine'
                  } />
                <span>
                  {{
                    t(
                      `common.${
                        workflowState.status === 'breakpoint' ? 'resume' : 'pause'
                      }`
                    )
                  }}
                </span>
              </ui-button>
              <ui-button
                v-tooltip="t('workflow.testing.nextBlock')"
                disabled={workflowState.status !== 'breakpoint'}
                icon
                onClick={nextBlock}
              >
                <i className={"ri-icon"} />
              </ui-button>
              <ui-button
                v-tooltip="t('common.stop')"
                icon
                className="text-red-500 dark:text-red-600"
                onClick={stopWorkflow}
              >
                <i className={"ri-icon"} />
              </ui-button>
            </div>
            <ui-list
              {/* v-if: workflowState.state */}
              className="mt-4 overflow-auto h-[105px] scroll"
            >
              <ui-list-item
                /* v-for: block in workflowState.state.currentBlock */ key={block.id}
                small
              >
                <div className="text-overflow text-sm w-full">
                  <div className="flex items-center">
                    <p className="flex-1 text-overflow">
                      {getBlockName(block.name)}
                    </p>
                    <i className={"ri-icon"} />
                  </div>
                  <p
                    className="leading-tight text-overflow text-gray-600 dark:text-gray-200"
                  >
                    {t('workflow.testing.startRun')}:
                    {dayjs(block.startedAt).format('HH:mm:ss, SSS')}
                  </p>
                </div>
              </ui-list-item>
            </ui-list>
          </div>
          <div className="w-64">
            <ui-tabs value={activeTab} onChange={(e: any) => { /* TODO update activeTab */ }} className="-mt-1">
              <ui-tab className="!py-2" value="workflow-data">Data</ui-tab>
              <ui-tab className="!py-2" value="workflow-logs">Logs</ui-tab>
            </ui-tabs>
            <ui-tab-panels value={activeTab} onChange={(e: any) => { /* TODO update activeTab */ }}>
              <ui-tab-panel value="workflow-data">
                <shared-codemirror
                  model-value={JSON.stringify(workflowData, null, 2)}
                  line-numbers={false}
                  hide-lang
                  readonly
                  lang="json"
                  className="h-40 scroll breakpoint-data"
                />
              </ui-tab-panel>
              <ui-tab-panel
                ref="workflowLogsContainer"
                value="workflow-logs"
                className="h-40 scroll text-sm overflow-auto"
              >
                <ui-list className="mt-2">
                  <ui-list-item
                    /* v-for: item in (workflowState?.state?.logs ?? [])
                      .slice(-100)
                      .reverse() */ key={item.id}
                    small
                    className="!block"
                  >
                    <div className="flex items-center gap-2 overflow-hidden w-full">
                      <p className="flex-1 text-overflow leading-tight">
                        {getBlockName(item.name)}
                      </p>
                      <p
                        className="text-gray-600 leading-tight dark:text-gray-300 tabular-nums"
                        title={t('log.duration')}
                      >
                        {item.duration}s
                      </p>
                    </div>
                    <p className="flex-1 text-gray-600 leading-tight dark:text-gray-300">
                      {item.description}
                    </p>
                  </ui-list-item>
                </ui-list>
              </ui-tab-panel>
            </ui-tab-panels>
          </div>
        </ui-card>
    </div>
  );
}
