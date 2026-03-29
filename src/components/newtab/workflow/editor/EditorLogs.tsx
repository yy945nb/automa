import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import dbLogs from '@/db/logs';
import { useLiveQuery } from '@/composable/liveQuery';
import SharedLogsTable from '@/components/newtab/shared/SharedLogsTable.vue';

interface EditorLogsProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function EditorLogs({ children, ...props }: EditorLogsProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="editorlogs-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div
          {/* v-if: (!logs || logs.length === 0) && workflowStates.length === 0 */}
          className="text-center"
        >
          <img src="@/assets/svg/files-and-folder.svg" className="mx-auto max-w-sm" />
          <p className="text-xl font-semibold">{t('message.noData')}</p>
        </div>
        <shared-logs-table
          logs={logs}
          running={workflowStates}
          hide-select
          className="w-full"
        >
          <template #item-append="{ log: itemLog }">
            <td className="text-right">
              <i className={"ri-icon"} />
            </td>
    </div>
  );
}
