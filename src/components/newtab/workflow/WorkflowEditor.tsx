import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import cloneDeep from 'lodash.clonedeep';
import { useStore } from '@/stores/main';
import { getBlocks } from '@/utils/getSharedData';
import { categories } from '@/utils/shared';
import EditBlockSettings from './edit/EditBlockSettings.tsx';
import EditorCustomEdge from './editor/EditorCustomEdge.tsx';
import EditorSearchBlocks from './editor/EditorSearchBlocks.tsx';

interface WorkflowEditorProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function WorkflowEditor({ children, ...props }: WorkflowEditorProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="workfloweditor-wrapper">
      {/* Converted from Vue SFC - template below */}
      <vue-flow
          id={props.id}
          className={disabled: isDisabled}
          default-edge-options={{
            type: 'custom',
            updatable: true,
            selectable: true,
            markerEnd: settings.arrow ? MarkerType.ArrowClosed : '',
          }}
        >
          <Background />
          <MiniMap
            {/* v-if: minimap */}
            node-class-name={minimapNodeClassName}
            className="hidden md:block"
          />
          <div
            {/* v-if: editorControls */}
            className="absolute left-0 bottom-0 z-10 flex w-full items-center p-4 md:pr-60"
          >
            {children}
            <editor-search-blocks editor={editor} />
            <div className="pointer-events-none grow" />
            {children}
            <button
              v-tooltip.group="t('workflow.editor.resetZoom')"
              className="control-button mr-2"
              onClick={editor.fitView()}
            >
              <i className={"ri-icon"} />
            </button>
            <div className="inline-block rounded-lg bg-white dark:bg-gray-800">
              <button
                v-tooltip.group="t('workflow.editor.zoomOut')"
                className="relative z-10 rounded-lg p-2"
                onClick={editor.zoomOut()}
              >
                <i className={"ri-icon"} />
              </button>
              <hr className="inline-block h-6 border-r" />
              <button
                v-tooltip.group="t('workflow.editor.zoomIn')"
                className="rounded-lg p-2"
                onClick={editor.zoomIn()}
              >
                <i className={"ri-icon"} />
              </button>
            </div>
          </div>
          <template /* v-for: (node, name) in nodeTypes */ key={name} #[name]="nodeProps">
            <component
              data-is={node}
              v-bind="{
                ...nodeProps,
                editor: name === 'node-BlockPackage' ? editor : null,
              }"
              onDelete={deleteBlock}
              onSettings={initEditBlockSettings}
              onEdit={editBlock(nodeProps, $event)}
              onUpdate={updateBlockData(nodeProps.id, $event)}
            />
    </div>
  );
}
