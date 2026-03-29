import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import cloneDeep from 'lodash.clonedeep';
import { arraySorter } from '@/utils/helper';
import { useUserStore } from '@/stores/user';
import { useDialog } from '@/composable/dialog';
import { useWorkflowStore } from '@/stores/workflow';
import { exportWorkflow } from '@/utils/workflowData';
import { useSharedWorkflowStore } from '@/stores/sharedWorkflow';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';
import WorkflowsLocalCard from './WorkflowsLocalCard.vue';

interface WorkflowsLocalProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function WorkflowsLocal({ children, ...props }: WorkflowsLocalProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="workflowslocal-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div
          {/* v-if: workflowStore.getWorkflows.length === 0 */}
          className="md:flex items-center md:text-left text-center py-12"
        >
          <img src="@/assets/svg/alien.svg" className="w-96" />
          <div className="ml-4">
            <h1 className="mb-6 max-w-md text-2xl font-semibold">
              {t('message.empty')}
            </h1>
          </div>
        </div>
        <template {/* v-else */}>
          <div {/* v-if: pinnedWorkflows.length > 0 */} className="mb-8 border-b pb-8">
            <div className="flex items-center">
              <i className={"ri-icon"} />
              <span>{t('workflow.pinWorkflow.pinned')}</span>
            </div>
            <div className="workflows-container mt-4">
              <workflows-local-card
                /* v-for: workflow in pinnedWorkflows */ key={workflow.id}
                workflow={workflow}
                is-hosted={userStore.hostedWorkflows[workflow.id]}
                is-shared={sharedWorkflowStore.getById(workflow.id)}
                is-pinned={true}
                menu={menu}
                onDragstart={onDragStart}
                onExecute={RendererWorkflowService.executeWorkflow(workflow)}
                onToggle={togglePinWorkflow(workflow)}
                onToggle={toggleDisableWorkflow(workflow)}
              />
            </div>
          </div>
          <div className="workflows-container">
            <workflows-local-card
              /* v-for: workflow in workflows */ key={workflow.id}
              workflow={workflow}
              is-hosted={userStore.hostedWorkflows[workflow.id]}
              is-shared={sharedWorkflowStore.getById(workflow.id)}
              is-pinned={state.pinnedWorkflows.includes(workflow.id)}
              menu={menu}
              onDragstart={onDragStart}
              onExecute={RendererWorkflowService.executeWorkflow(workflow)}
              onToggle={togglePinWorkflow(workflow)}
              onToggle={toggleDisableWorkflow(workflow)}
            />
          </div>
          <div
            {/* v-if: filteredWorkflows.length > 18 */}
            className="mt-8 flex items-center justify-between"
          >
            <div>
              {t('components.pagination.text1')}
              <select
                value={pagination.perPage}
                className="bg-input rounded-md p-1"
                onChange={onPerPageChange}
              >
                <option /* v-for: num in [18, 32, 64, 128] */ key={num} value={num}>
                  {num}
                </option>
              </select>
              {{
                t('components.pagination.text2', {
                  count: filteredWorkflows.length,
                })
              }}
            </div>
            <ui-pagination
              value={pagination.currentPage} onChange={(e: any) => { /* TODO update pagination.currentPage */ }}
              per-page={pagination.perPage}
              records={filteredWorkflows.length}
            />
          </div>
    </div>
  );
}
