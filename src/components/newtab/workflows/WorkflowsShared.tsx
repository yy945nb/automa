import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SharedCard from '@/components/newtab/shared/SharedCard.tsx';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';
import { useSharedWorkflowStore } from '@/stores/sharedWorkflow';
import { arraySorter } from '@/utils/helper';

interface WorkflowsSharedProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function WorkflowsShared({ children, ...props }: WorkflowsSharedProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="workflowsshared-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div
          {/* v-if: workflows.length === 0 */}
          className="md:flex items-center md:text-left text-center py-12"
        >
          <img src="@/assets/svg/alien.svg" className="w-96" />
          <div className="ml-4">
            <h1 className="mb-6 max-w-md text-2xl font-semibold">
              {t('message.empty')}
            </h1>
          </div>
        </div>
        <div {/* v-else */} className="workflows-container">
          <shared-card
            /* v-for: workflow in workflows */ key={workflow.id}
            data={workflow}
            show-details={false}
            onExecute={RendererWorkflowService.executeWorkflow(workflow)}
            onClick={$router.push(`/workflows/${$event.id}/shared`)}
          />
        </div>
    </div>
  );
}
