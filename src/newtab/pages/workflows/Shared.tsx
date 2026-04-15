import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import browser from 'webextension-polyfill';
import { useDialog } from '@/composable/dialog';
import { useSharedWorkflowStore } from '@/stores/sharedWorkflow';
import { useWorkflowStore } from '@/stores/workflow';
import { fetchApi } from '@/utils/api';
import convertWorkflowData from '@/utils/convertWorkflowData';
import WorkflowEditor from '@/components/newtab/workflow/WorkflowEditor';
import WorkflowShare from '@/components/newtab/workflow/WorkflowShare';

const editorOptions = {
  disabled: true, fitViewOnInit: true, nodesDraggable: false,
  edgesUpdatable: false, nodesConnectable: false, elementsSelectable: false,
};

export default function Shared() {
  const { t } = useTranslation();
  const { id: workflowId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dialog = useDialog();
  const workflowStore = useWorkflowStore();
  const sharedWorkflowStore = useSharedWorkflowStore();
  const editorRef = useRef<any>(null);
  const changingKeysRef = useRef(new Set<string>());

  const [editorKey, setEditorKey] = useState(0);
  const [retrieved, setRetrieved] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [hasLocalCopy, setHasLocalCopy] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: '', content: '', category: '', description: '' });

  const workflow = useMemo(() => sharedWorkflowStore.getById(workflowId || ''), [sharedWorkflowStore, workflowId]);

  function updateSharedWorkflow(data: Record<string, any> = {}) {
    Object.keys(data).forEach(key => changingKeysRef.current.add(key));
    sharedWorkflowStore.update({ data, id: workflowId || '' });
    if (data.drawflow && editorRef.current) {
      editorRef.current.setNodes(data.drawflow.nodes);
      editorRef.current.setEdges(data.drawflow.edges);
      editorRef.current.fitView();
    }
    setIsChanged(true);
  }

  function initEditWorkflow() {
    if (!workflow) return;
    setEditData({
      name: workflow.name || '', content: workflow.content || '',
      category: workflow.category || '', description: workflow.description || '',
    });
    setEditModal(true);
  }

  function unpublishSharedWorkflow() {
    if (!workflow) return;
    dialog.confirm({
      title: t('workflow.unpublish.title'),
      body: t('workflow.unpublish.body', { name: workflow.name }),
      okVariant: 'danger',
      okText: t('workflow.unpublish.button'),
      onConfirm: async () => {
        try {
          setIsUnpublishing(true);
          const response = await fetchApi(`/me/workflows/shared/${workflowId}`, { auth: true, method: 'DELETE' });
          if (response.status !== 200) throw new Error(response.statusText);
          sharedWorkflowStore.delete(workflowId || '');
          sessionStorage.setItem('shared-workflows', JSON.stringify(workflowStore.workflows));
          navigate('/');
        } catch (error) {
          console.error(error);
        } finally {
          setIsUnpublishing(false);
        }
      },
    });
  }

  async function saveUpdatedSharedWorkflow() {
    if (!workflow) return;
    try {
      setIsUpdating(true);
      const payload: Record<string, any> = {};
      changingKeysRef.current.forEach(key => {
        if (key === 'drawflow') {
          const flow = workflow.drawflow;
          payload.drawflow = typeof flow === 'string' ? JSON.parse(flow) : flow;
        } else {
          payload[key] = (workflow as any)[key];
        }
      });
      const response = await fetchApi(`/me/workflows/shared/${workflowId}`, {
        auth: true, method: 'PUT', body: JSON.stringify(payload),
      });
      if (response.status !== 200) throw new Error(response.statusText);
      setIsChanged(false);
      changingKeysRef.current.clear();
      sessionStorage.setItem('shared-workflows', JSON.stringify(sharedWorkflowStore.workflows));
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  }

  function fetchLocalWorkflow() {
    const keys = ['drawflow', 'name', 'description', 'icon', 'globalData', 'dataColumns', 'table', 'settings'];
    const localWorkflow = workflowStore.getById(workflowId || '');
    if (!localWorkflow) return;
    const workflowData: Record<string, any> = {};
    keys.forEach(key => { workflowData[key] = (localWorkflow as any)[key]; });
    const convertedData = convertWorkflowData(workflowData);
    convertedData.version = browser.runtime.getManifest().version;
    updateSharedWorkflow(convertedData);
  }

  function insertToLocal() {
    if (!workflow) return;
    const copy = { ...workflow, createdAt: Date.now(), version: browser.runtime.getManifest().version };
    workflowStore.insert(copy, { duplicateId: true }).then(() => setHasLocalCopy(true));
  }

  function onEditorInit(instance: any) {
    instance.setInteractive(false);
    editorRef.current = instance;
  }

  function copyLink() {
    navigator.clipboard.writeText(`https://extension.automa.site/workflow/${workflow?.id || workflowId}`);
  }

  useEffect(() => { setEditorKey(prev => prev + 1); }, [workflow]);

  useEffect(() => {
    if (!workflow) { navigate('/workflows'); return; }
    const convertedData = convertWorkflowData(workflow);
    sharedWorkflowStore.update({ id: workflowId || '', data: { drawflow: convertedData.drawflow ?? workflow.drawflow } });
    setHasLocalCopy(workflowStore.getWorkflows.some(({ id }: any) => id === workflowId));
    setRetrieved(true);
  }, []);

  if (!workflow) return null;

  return (
    <div className="relative h-screen">
      <div className="absolute top-0 left-0 z-10 flex w-full items-center p-4">
        <div className="flex items-center overflow-hidden rounded-lg bg-white px-2 shadow dark:bg-gray-800" style={{ minWidth: 150, height: 48 }}>
          <span className="inline-block">
            {workflow.icon?.startsWith('http') ? <img src={workflow.icon} className="h-8 w-8" alt="" /> : <span className="text-2xl">📋</span>}
          </span>
          <div className="ml-2 max-w-sm">
            <p className={`text-overflow font-semibold leading-tight ${!workflow.description ? 'text-lg' : ''}`}>{workflow.name}</p>
            {workflow.description && <p className="text-overflow text-sm leading-tight text-gray-600 dark:text-gray-200">{workflow.description}</p>}
          </div>
        </div>
        <div className="ml-4 rounded-lg bg-white p-1 shadow dark:bg-gray-800">
          <input readOnly value={`https://extension.automa.site/workflow/${workflow.id}`} onClick={copyLink} className="ui-input cursor-pointer" title={t('workflow.share.url')} />
        </div>
        <div className="pointer-events-none grow" />
        <div className="ml-4 rounded-lg bg-white p-1 shadow dark:bg-gray-800">
          {hasLocalCopy && <Link to={`/workflows/${workflowId}`} className="hoverable block rounded-lg p-2" title="Go to local version">💻</Link>}
          <button className="hoverable rounded-lg p-2" onClick={insertToLocal} title={t('workflow.host.add')}>📥</button>
          <button className="hoverable rounded-lg p-2" onClick={fetchLocalWorkflow} title={t('workflow.share.fetchLocal')}>🔄</button>
          <button className="hoverable rounded-lg p-2" onClick={initEditWorkflow} title={t('common.edit')}>✏️</button>
        </div>
        <div className="ml-4 flex items-center rounded-lg bg-white p-1 shadow dark:bg-gray-800">
          <button className={`hoverable mr-2 rounded-lg p-2 ${isUnpublishing ? 'opacity-50' : ''}`} onClick={unpublishSharedWorkflow} disabled={isUnpublishing}title={t('workflow.unpublish.title')}>
            🗑
          </button>
          {isChanged && (
            <button className={`ui-button variant-accent ${isUpdating ? 'opacity-50' : ''}`} onClick={saveUpdatedSharedWorkflow} disabled={isUpdating}>
              {t('common.save')}
            </button>
          )}
        </div>
      </div>

      {retrieved && (
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

      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <WorkflowShare
              data={editData}
              onChange={(d: any) => setEditData(d)}
              onSave={() => { updateSharedWorkflow(editData); setEditModal(false); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
