import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useDialog } from '@/composable/dialog';
import { useShortcut } from '@/composable/shortcut';
import { findTriggerBlock } from '@/utils/helper';
import convertWorkflowData from '@/utils/convertWorkflowData';
import { useWorkflowStore } from '@/stores/workflow';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';
import { useHostedWorkflowStore } from '@/stores/hostedWorkflow';
import getTriggerText from '@/utils/triggerText';
import WorkflowEditor from '@/components/newtab/workflow/WorkflowEditor';
import emitter from '@/lib/mitt';

const editorOptions = {
  disabled: true,
  fitViewOnInit: true,
  nodesDraggable: false,
  edgesUpdatable: false,
  nodesConnectable: false,
  elementsSelectable: false,
};

export default function Host() {
  const { t } = useTranslation();
  const { id: workflowId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dialog = useDialog();
  const workflowStore = useWorkflowStore();
  const hostedWorkflowStore = useHostedWorkflowStore();
  const shortcut = useShortcut('editor:execute-workflow', executeCurrWorkflow);

  const [editorKey, setEditorKey] = useState(0);
  const [retrieved, setRetrieved] = useState(false);
  const [loadingSync, setLoadingSync] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [triggerText, setTriggerText] = useState('Trigger: Manually');

  const workflow = useMemo(() =>
    hostedWorkflowStore.getById(workflowId || ''),
    [hostedWorkflowStore, workflowId]
  );

  const workflowStates = useMemo(() =>
    workflowStore.getWorkflowStates(workflowId || ''),
    [workflowStore, workflowId]
  );

  function openLogs() {
    emitter.emit('ui:logs', { workflowId, show: true });
  }

  function syncWorkflow() {
    if (!workflow) return;
    setLoadingSync(true);
    const hostId = { hostId: workflow.hostId, updatedAt: null };
    hostedWorkflowStore
      .fetchWorkflows([hostId])
      .then(() => {
        if (!hostedWorkflowStore.getById(workflowId || '')) {
          navigate('/workflows', { replace: true });
        }
        retrieveTriggerText();
        setLoadingSync(false);
      })
      .catch((error: any) => {
        console.error(error);
        setLoadingSync(false);
      });
  }

  function deleteWorkflowHost() {
    if (!workflow) return;
    dialog.confirm({
      title: t('workflow.delete'),
      okVariant: 'danger',
      body: t('message.delete', { name: workflow.name }),
      onConfirm: async () => {
        try {
          await hostedWorkflowStore.delete(workflowId || '');
          navigate('/workflows', { replace: true });
        } catch (error) {
          console.error(error);
        }
      },
    });
  }

  function executeCurrWorkflow() {
    if (!workflow) return;
    RendererWorkflowService.executeWorkflow({ ...workflow, id: workflowId });
  }

  async function retrieveTriggerText() {
    if (!workflow) return;
    const triggerBlock = findTriggerBlock(workflow.drawflow);
    if (!triggerBlock) return;
    const text = await getTriggerText(triggerBlock.data, t, workflowId || '', true);
    setTriggerText(text);
  }

  function onEditorInit(editor: any) {
    editor.setInteractive(false);
  }

  useEffect(() => {
    setEditorKey(prev => prev + 1);
  }, [workflow]);

  useEffect(() => {
    if (!workflowId) return;
    const currentWorkflow = hostedWorkflowStore.workflows[workflowId];
    if (!currentWorkflow) {
      navigate('/workflows');
      return;
    }
    const convertedData = convertWorkflowData(currentWorkflow);
    hostedWorkflowStore.update({ id: workflowId, ...convertedData });
    retrieveTriggerText();
    setRetrieved(true);
  }, []);

  if (!workflow) return null;

  return (
    <div className="relative h-screen">
      <div className="absolute top-0 left-0 z-10 flex w-full items-center p-4">
        <div className="flex items-center overflow-hidden rounded-lg bg-white px-2 shadow dark:bg-gray-800" style={{ minWidth: 150, height: 48 }}>
          <span className="inline-block">
            {workflow.icon?.startsWith('http') ? (
              <img src={workflow.icon} className="h-8 w-8" alt="" />
            ) : (
              <span className="text-2xl">⚡</span>
            )}
          </span>
          <div className="ml-2 max-w-sm">
            <p className={`text-overflow font-semibold leading-tight ${!workflow.description ? 'text-lg' : ''}`}>
              {workflow.name}
            </p>
            <p className={`text-overflow leading-tight text-gray-600 dark:text-gray-200 ${workflow.description ? 'text-sm' : ''}`}>
              {workflow.description}
            </p>
          </div>
        </div>
        <div className="ml-4 flex h-full space-x-1 rounded-lg border-none bg-white px-2 dark:bg-gray-800" style={{ height: 48 }}>
          <button className={`px-3 py-1 ${activeTab === 'editor' ? 'border-b-2 border-accent' : ''}`} onClick={() => setActiveTab('editor')}>
            {t('common.editor')}
          </button>
          <button className={`px-3 py-1 ${activeTab === 'logs' ? 'border-b-2 border-accent' : ''}`} onClick={() => { setActiveTab('logs'); openLogs(); }}>
            {t('common.log', { count: 2 })}
            {workflowStates.length > 0 && (
              <span className="ml-2 inline-block rounded-full bg-accent p-1 text-center text-xs text-white dark:text-black" style={{ minWidth: 25 }}>
                {workflowStates.length}
              </span>
            )}
          </button>
        </div>
        <div className="grow" />
        <div className="rounded-lg bg-white p-1 shadow dark:bg-gray-800">
          <button className="hoverable rounded-lg p-2" title={triggerText}>⚡</button>
          <button className="hoverable rounded-lg p-2" title={`${t('common.execute')} (${shortcut['editor:execute-workflow']?.readable || ''})`} onClick={executeCurrWorkflow}>
            ▶
          </button>
        </div>
        <div className="ml-4 flex items-center rounded-lg bg-white p-1 shadow dark:bg-gray-800">
          <button className="hoverable mr-2 rounded-lg p-2" title={t('common.delete')} onClick={deleteWorkflowHost}>🗑</button>
          <button className={`ui-button variant-accent ${loadingSync ? 'opacity-50' : ''}`} onClick={syncWorkflow} disabled={loadingSync}>
            {t('workflow.host.sync.title')}
          </button>
        </div>
      </div>
      <div className={`h-full ${activeTab !== 'editor' ? 'container pb-4 pt-24' : ''}`}>
        {activeTab === 'editor' && retrieved && (
          <WorkflowEditor
            key={editorKey}
            id={workflowId || ''}
            data={workflow.drawflow}
            options={editorOptions}
            disabled
            className="h-full w-full"
            onInit={onEditorInit}
          />
        )}
      </div>
    </div>
  );
}
