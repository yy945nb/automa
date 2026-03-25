import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SharedCard from '@/components/newtab/shared/SharedCard.vue';
import { useDialog } from '@/composable/dialog';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';
import { useHostedWorkflowStore } from '@/stores/hostedWorkflow';
import { arraySorter } from '@/utils/helper';

interface WorkflowsHostedProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function WorkflowsHosted({ children, ...props }: WorkflowsHostedProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="workflowshosted-wrapper">
      {/* Converted from Vue SFC - template below */}
      <shared-card
          /* v-for: workflow in workflows */ key={workflow.hostId}
          data={workflow}
          menu={menu}
          onExecute={RendererWorkflowService.executeWorkflow(workflow)}
          onClick={$router.push(`/workflows/${$event.hostId}/host`)}
          onMenuSelected={deleteWorkflow(workflow)}
        />
    </div>
  );
}
