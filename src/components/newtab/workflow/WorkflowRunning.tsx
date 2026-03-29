import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getBlocks } from '@/utils/getSharedData';
import dayjs from '@/lib/dayjs';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';

interface WorkflowRunningProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function WorkflowRunning({ children, ...props }: WorkflowRunningProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="workflowrunning-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div className="grid grid-cols-2 gap-4">
          <ui-card /* v-for: item in data */ key={item}>
            <div className="mb-4 flex items-center">
              <div className="text-overflow mr-4 flex-1">
                <p className="text-overflow mr-2 w-full">{item.state.name}</p>
                <p
                  className="text-overflow mr-2 w-full leading-tight text-gray-600 dark:text-gray-200"
                  title={`Started at: ${formatDate(
                    item.state.startedTimestamp,
                    'DD MMM, hh:mm A'
                  )}`}
                >
                  {formatDate(item.state.startedTimestamp, 'relative')}
                </p>
              </div>
              <ui-button
                {/* v-if: item.state.tabId */}
                icon
                className="mr-2"
                title="Open tab"
                onClick={openTab(item.state.tabId)}
              >
                <i className={"ri-icon"} />
              </ui-button>
              <ui-button variant="accent" onClick={stopWorkflow(item)}>
                <i className={"ri-icon"} />
                <span>{t('common.stop')}</span>
              </ui-button>
            </div>
            <div className="bg-box-transparent flex items-center rounded-lg px-4 py-2">
              <template {/* v-if: item.state.currentBlock */}>
                <i className={getBlock(item).icon} />
                <p className="ml-2 mr-4 flex-1">{getBlock(item).name}</p>
                <ui-spinner color="text-accent" size="20" />
    </div>
  );
}
