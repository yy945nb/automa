import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
// TODO: import convertWorkflowData from '@/utils/convertWorkflowData'
// TODO: import WorkflowEditor from '@/components/newtab/workflow/WorkflowEditor'

interface HomeSelectBlockProps {
  workflow?: Record<string, any>;
  onGoBack?: () => void;
  onRecord?: (payload: Record<string, any>) => void;
  onUpdate?: (payload: Record<string, any>) => void;
}

const editorOptions = {
  disabled: true,
  fitViewOnInit: true,
  nodesDraggable: false,
  edgesUpdatable: false,
  nodesConnectable: false,
};

const HomeSelectBlock: React.FC<HomeSelectBlockProps> = ({
  workflow = {},
  onGoBack,
  onRecord,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [blockOutput, setBlockOutput] = useState<string | null>(null);

  function clearSelectedHandle() {
    document.querySelectorAll('.selected-handle').forEach((el) => {
      el.classList.remove('selected-handle');
    });
  }

  function onClick({ target }: MouseEvent) {
    const targetEl = target as HTMLElement;
    let selectedHandle: HTMLElement | null = null;

    const handleEl = targetEl.closest<HTMLElement>('.vue-flow__handle.source');
    if (handleEl) {
      clearSelectedHandle();
      handleEl.classList.add('selected-handle');
      selectedHandle = handleEl;
    }

    if (!handleEl) {
      const nodeEl = targetEl.closest<HTMLElement>('.vue-flow__node');
      if (nodeEl) {
        clearSelectedHandle();
        const handle = nodeEl.querySelector<HTMLElement>('.vue-flow__handle.source');
        if (handle) {
          handle.classList.add('selected-handle');
          selectedHandle = handle;
        }
      }
    }

    if (!selectedHandle) return;

    const { handleid, nodeid } = (selectedHandle as any).dataset;
    setActiveBlock(nodeid ?? null);
    setBlockOutput(handleid ?? null);
  }

  function onEditorInit(editor: any) {
    // TODO: const convertedData = convertWorkflowData(workflow);
    // onUpdate?.({ drawflow: convertedData.drawflow });
    // editor.setNodes(convertedData.drawflow.nodes);
    // editor.setEdges(convertedData.drawflow.edges);
    console.warn('TODO: onEditorInit – convertWorkflowData not implemented yet');
  }

  function startRecording() {
    const options = {
      name: workflow.name,
      workflowId: workflow.id,
      connectFrom: {
        id: activeBlock,
        output: blockOutput,
      },
    };
    onRecord?.(options);
  }

  useEffect(() => {
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  return (
    <div className="px-4 pb-4">
      <div className="mt-4 flex items-center">
        <button onClick={() => onGoBack?.()}>
          <i className="ri-arrow-left-line -ml-1 mr-1 inline-block align-bottom" />
        </button>
        <p className="text-overflow flex-1 font-semibold">{workflow.name}</p>
      </div>
      <p className="mt-2">{t('home.record.selectBlock')}</p>
      {/* TODO: replace with real WorkflowEditor component */}
      <div
        className="bg-box-transparent h-56 w-full rounded-lg flex items-center justify-center text-gray-500"
        style={{ minHeight: '14rem' }}
      >
        {/* <WorkflowEditor minimap={false} editorControls={false} options={editorOptions} onInit={onEditorInit} /> */}
        <span>TODO: WorkflowEditor</span>
      </div>
      <button
        disabled={!activeBlock}
        className="mt-6 w-full rounded-lg bg-accent py-2 text-white disabled:opacity-50"
        onClick={startRecording}
      >
        {t('home.record.button')}
      </button>
    </div>
  );
};

export default HomeSelectBlock;
