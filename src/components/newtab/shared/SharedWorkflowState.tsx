import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getBlocks } from '@/utils/getSharedData';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';
import dayjs from '@/lib/dayjs';

interface SharedWorkflowStateProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function SharedWorkflowState({ children, ...props }: SharedWorkflowStateProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="sharedworkflowstate-wrapper">
      {/* Converted from Vue SFC - template below */}
      <ui-card>
          <div className="mb-4 flex items-center">
            <div className="text-overflow mr-4 flex-1">
              <p className="text-overflow mr-2 w-full">{data.state.name}</p>
              <p
                className="text-overflow mr-2 w-full leading-tight text-gray-600 dark:text-gray-200"
                title={`Started at: ${formatDate(
                  data.state.startedTimestamp,
                  'DD MMM, hh:mm A'
                )}`}
              >
                {formatDate(data.state.startedTimestamp, 'relative')}
              </p>
            </div>
            <ui-button
              {/* v-if: data.state.tabId */}
              icon
              className="mr-2"
              title="Open tab"
              onClick={openTab}
            >
              <i className={"ri-icon"} />
            </ui-button>
            <ui-button variant="accent" onClick={stopWorkflow}>
              <i className={"ri-icon"} />
              <span>{t('common.stop')}</span>
            </ui-button>
          </div>
          <div className="bg-box-transparent divide-y rounded-lg px-4">
            <div
              /* v-for: block in data.state.currentBlock */ key={block.id || block.name}
              className="flex items-center py-2"
            >
              <i className={blocks[block.name].icon} />
              <p className="text-overflow ml-2 mr-4 flex-1">
                {blocks[block.name].name}
              </p>
              <ui-spinner color="text-accent" size="20" />
            </div>
          </div>
          <div
            {/* v-if: data.parentState */}
            className="mt-2 rounded-lg bg-yellow-200 py-2 px-4 text-sm"
          >
            {t('workflow.state.executeBy', { name: data.parentState.name })}
            <span className="lowercase">
              {{
                data.parentState.isCollection
                  ? t('common.collection')
                  : t('common.workflow')
              }}
            </span>
          </div>
        </ui-card>
    </div>
  );
}
