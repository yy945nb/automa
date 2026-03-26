import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useShortcut } from '@/composable/shortcut';
import { categories } from '@/utils/shared';
import { getBlocks } from '@/utils/getSharedData';
import WorkflowBlockList from './WorkflowBlockList.vue';

interface WorkflowDetailsCardProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function WorkflowDetailsCard({ children, ...props }: WorkflowDetailsCardProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="workflowdetailscard-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div className="mb-2 mt-1 flex items-start px-4">
          <ui-popover className="mr-2 h-8">
            <template #trigger>
              <span
                title={t('workflow.sidebar.workflowIcon')}
                className="inline-block h-full cursor-pointer"
              >
                <ui-img
                  {/* v-if: workflow.icon.startsWith('http') */}
                  src={workflow.icon}
                  className="h-8 w-8"
                />
                <i className={workflow.icon} />
              </span>
    </div>
  );
}
