import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SharedCard from '@/components/newtab/shared/SharedCard.tsx';

interface WorkflowsLocalCardProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function WorkflowsLocalCard({ children, ...props }: WorkflowsLocalCardProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="workflowslocalcard-wrapper">
      {/* Converted from Vue SFC - template below */}
      <shared-card
          data={workflow}
          data-workflow={workflow.id}
          draggable="true"
          className="local-workflow cursor-default select-none ring-accent"
          onClick={$router.push(`/workflows/${$event.id}`)}
        >
          <template #header>
            <div className="mb-4 flex items-center">
              <template {/* v-if: workflow && !workflow.isDisabled */}>
                <ui-img
                  {/* v-if: workflow.icon.startsWith('http') */}
                  src={workflow.icon}
                  className="overflow-hidden rounded-lg"
                  style="height: 40px; width: 40px"
                  alt="Can not display"
                />
                <span {/* v-else */} className="bg-box-transparent inline-block rounded-lg p-2">
                  <i className={workflow.icon} />
                </span>
    </div>
  );
}
