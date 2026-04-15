import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import WorkflowShare from '@/components/newtab/workflow/WorkflowShare';
import { useGroupTooltip } from '@/composable/groupTooltip';

interface WorkflowSharedActionsProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function WorkflowSharedActions({ children, ...props }: WorkflowSharedActionsProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="workflowsharedactions-wrapper">
      {/* Converted from Vue SFC - template below */}
      <ui-card padding="p-1">
          <ui-input
            v-tooltip="t('workflow.share.url')"
            prepend-icon="riLinkM"
            model-value={`https://extension.automa.site/workflow/${workflow.id}`}
            readonly
            onClick={$event.target.select()}
          />
        </ui-card>
        <ui-card padding="p-1 ml-4">
          <button
            {/* v-if: data.hasLocal */}
            v-tooltip.group="t('workflow.share.fetchLocal')"
            className="hoverable rounded-lg p-2"
            onClick={emit('fetchLocal')}
          >
            <i className={"ri-icon"} />
          </button>
          <button
            {/* v-if: !data.hasLocal */}
            v-tooltip.group="t('workflow.share.download')"
            className="hoverable rounded-lg p-2"
            onClick={emit('insertLocal')}
          >
            <i className={"ri-icon"} />
          </button>
          <button
            v-tooltip.group="t('workflow.share.edit')"
            className="hoverable rounded-lg p-2"
            onClick={state.showModal = true}
          >
            <i className={"ri-icon"} />
          </button>
        </ui-card>
        <ui-card padding="p-1 flex ml-4">
          <button
            v-tooltip.group="t('workflow.share.unpublish')"
            className="hoverable relative mr-2 rounded-lg p-2"
            onClick={emit('unpublish')}
          >
            <ui-spinner
              {/* v-if: data.isUnpublishing */}
              color="text-accent"
              className="absolute top-2 left-2"
            />
            <i className={"ri-icon"} />
          </button>
          <ui-button
            loading={data.isUpdating}
            disabled={data.isUnpublishing}
            variant="accent"
            onClick={emit('save')}
          >
            <span
              {/* v-if: data.isChanged */}
              className="absolute top-0 left-0 -ml-1 -mt-1 flex h-3 w-3"
            >
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"
              ></span>
              <span
                className="relative inline-flex h-3 w-3 rounded-full bg-blue-600"
              ></span>
            </span>
            {t('workflow.share.update')}
          </ui-button>
        </ui-card>
        <ui-modal value={state.showModal} onChange={(e: any) => { /* TODO update state.showModal */ }} custom-content onClose={updateDescription}>
          <workflow-share
            workflow={workflow}
            is-update
            onChange={onDescriptionUpdated}
          >
            <template #prepend>
              <div className="mb-6 flex justify-between">
                <p>{t('workflow.share.edit')}</p>
                <i className={"ri-icon"} />
              </div>
    </div>
  );
}
