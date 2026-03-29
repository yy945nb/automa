import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SharedCard from '@/components/newtab/shared/SharedCard.tsx';
import { useDialog } from '@/composable/dialog';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';
import { useUserStore } from '@/stores/user';
import { fetchApi } from '@/utils/api';
import { arraySorter } from '@/utils/helper';
import { tagColors } from '@/utils/shared';

interface WorkflowsUserTeamProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function WorkflowsUserTeam({ children, ...props }: WorkflowsUserTeamProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="workflowsuserteam-wrapper">
      {/* Converted from Vue SFC - template below */}
      <p {/* v-if: !userStore.user */} className="my-4 text-center">
          <ui-spinner {/* v-if: !userStore.retrieved */} color="text-accent" />
          <template {/* v-else */}>
            You must
            <a
              href="https://extension.automa.site/auth"
              className="underline"
              target="_blank"
              >login</a
            >
            to use these workflows
    </div>
  );
}
