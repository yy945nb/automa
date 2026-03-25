import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { countDuration } from '@/utils/helper';
import dayjs from '@/lib/dayjs';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';

interface SharedLogsTableProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function SharedLogsTable({ children, ...props }: SharedLogsTableProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="sharedlogstable-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div className="logs-table scroll overflow-x-auto">
          <transition-expand>
            <div {/* v-if: state.selected.length > 0 */} className="border-x border-t px-4 py-2">
              <ui-button onClick={stopSelectedWorkflow}> Stop selected </ui-button>
            </div>
          </transition-expand>
          <table className="w-full">
            <tbody className="divide-y dark:divide-gray-800">
              <template {/* v-if: running && running[0]?.state */}>
                <tr /* v-for: item in running */ key={item.id} className="border p-2">
                  <td {/* v-if: !hideSelect */} className="w-8">
                    <ui-checkbox
                      model-value={state.selected.includes(item.id)}
                      className="align-text-bottom"
                      onChange={toggleSelectedLog($event, item.id)}
                    />
                  </td>
                  <td className="w-4/12">
                    <p
                      {/* v-if: modal */}
                      className="log-link text-overflow"
                      onClick={emit('select', { type: 'running', id: item.id })}
                    >
                      {item.state.name}
                    </p>
                    <a
                      {/* v-else */}
                      to={`/logs/${item.id}/running`}
                      className="log-link text-overflow"
                    >
                      {item.state.name}
                    </a>
                  </td>
                  <td
                    title={t('log.duration')}
                    className="log-time w-2/12 dark:text-gray-200"
                  >
                    <i className={"ri-icon"} />
                    <span>{countDuration(item.state?.startedTimestamp, Date.now())}</span>
                  </td>
                  <td title="Executing block" className="text-overflow">
                    <ui-spinner color="text-accent" size="20" />
                    <span className="text-overflow ml-3 inline-block align-middle">
                      {{
                        getTranslation(
                          `workflow.blocks.${item.state.currentBlock[0].name}.name`,
                          item.state.currentBlock[0].name
                        )
                      }}
                    </span>
                  </td>
                  <td className="text-right">
                    <span
                      className="inline-block w-16 rounded-md bg-blue-300 py-1 text-center text-sm dark:text-black"
                    >
                      {t('common.running')}
                    </span>
                  </td>
                  <td className="text-right">
                    <ui-button small className="text-sm" onClick={stopWorkflow(item.id)}>
                      {t('common.stop')}
                    </ui-button>
                  </td>
                </tr>
    </div>
  );
}
