import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useDialog } from '@/composable/dialog';
import { useShortcut } from '@/composable/shortcut';
import recordWorkflow from '@/newtab/utils/startRecordWorkflow';
import { useHostedWorkflowStore } from '@/stores/hostedWorkflow';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';
import { useUserStore } from '@/stores/user';
import { useWorkflowStore } from '@/stores/workflow';
import { fetchApi } from '@/utils/api';
import { findTriggerBlock, isWhitespace } from '@/utils/helper';
import { getWorkflowPermissions, importWorkflow } from '@/utils/workflowData';
import { registerWorkflowTrigger } from '@/utils/workflowTrigger';
import WorkflowsFolder from '@/components/newtab/workflows/WorkflowsFolder';
import WorkflowsHosted from '@/components/newtab/workflows/WorkflowsHosted';
import WorkflowsLocal from '@/components/newtab/workflows/WorkflowsLocal';
import WorkflowsShared from '@/components/newtab/workflows/WorkflowsShared';
import WorkflowsUserTeam from '@/components/newtab/workflows/WorkflowsUserTeam';
import SharedPermissionsModal from '@/components/newtab/shared/SharedPermissionsModal';

const sorts = ['name', 'createdAt', 'updatedAt', 'mostUsed'];

export default function WorkflowList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dialog = useDialog();
  const userStore = useUserStore();
  const workflowStore = useWorkflowStore();
  const teamWorkflowStore = useTeamWorkflowStore();
  const hostedWorkflowStore = useHostedWorkflowStore();

  const savedSorts = useMemo(() => JSON.parse(localStorage.getItem('workflow-sorts') || '{}'), []);
  const routeActive = searchParams.get('active') || 'local';
  const routeTeamId = searchParams.get('teamId') || '';

  const [teams, setTeams] = useState<Array<{ id: string | number; name: string }>>([]);
  const [query, setQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState('');
  const [activeTab, setActiveTab] = useState(routeActive);
  const [teamId, setTeamId] = useState(routeTeamId);
  const [perPage, setPerPage] = useState(savedSorts.perPage || 18);
  const [sortBy, setSortBy] = useState(savedSorts.sortBy || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(savedSorts.sortOrder || 'desc');

  const [addModal, setAddModal] = useState({ show: false, name: '', description: '', type: 'manual' });
  const [permModal, setPermModal] = useState({ show: false, items: [] as string[] });

  const hostedWorkflows = useMemo(() => hostedWorkflowStore.toArray, [hostedWorkflowStore]);

  const shortcut = useShortcut(['action:search', 'action:new'], ({ id }: any) => {
    if (id === 'action:search') {
      document.querySelector<HTMLInputElement>('#search-input input')?.focus();
    } else {
      setAddModal(prev => ({ ...prev, show: true }));
    }
  });

  function clearAddWorkflowModal() {
    setAddModal({ show: false, name: '', description: '', type: 'manual' });
  }

  function initRecordWorkflow() {
    setAddModal(prev => ({ ...prev, show: true, type: 'recording' }));
  }

  function startRecordWorkflow() {
    recordWorkflow({ name: addModal.name, description: addModal.description }).then(() => navigate('/recording'));
  }

  function updateActiveTab(data: { activeTab: string; teamId?: string | number }) {
    const newTeamId = data.activeTab !== 'team' ? '' : (data.teamId || '');
    const params = new URLSearchParams(searchParams);
    params.set('active', data.activeTab);
    if (newTeamId) params.set('teamId', String(newTeamId));
    else params.delete('teamId');
    setSearchParams(params, { replace: true });
    setActiveTab(data.activeTab);
    setTeamId(String(newTeamId));
  }

  function addWorkflow() {
    workflowStore
      .insert({ name: addModal.name, folderId: activeFolder, description: addModal.description })
      .then((workflows: any) => {
        const workflowId = Object.keys(workflows)[0];
        navigate(`/workflows/${workflowId}`);
      })
      .finally(clearAddWorkflowModal);
  }

  async function checkWorkflowPermissions(workflows: any[]) {
    let requiredPermissions: string[] = [];
    for (const wf of workflows) {
      if (wf.drawflow) {
        const perms = await getWorkflowPermissions(wf.drawflow);
        requiredPermissions.push(...perms);
      }
    }
    requiredPermissions = Array.from(new Set(requiredPermissions));
    if (requiredPermissions.length === 0) return;
    setPermModal({ items: requiredPermissions, show: true });
  }

  function addHostedWorkflow() {
    dialog.prompt({
      async: true, inputType: 'url', okText: t('common.add'),
      title: t('workflow.host.add'), label: t('workflow.host.id'), placeholder: 'abcd123',
      onConfirm: async (value: string) => {
        if (isWhitespace(value)) return false;
        const hostId = value.replace(/\s/g, '');
        try {
          if (!userStore.user && hostedWorkflowStore.toArray.length >= 3) throw new Error('rate-exceeded');
          const isTheUserHost = userStore.getHostedWorkflows.some((h: any) => hostId === h.hostId);
          if (isTheUserHost) throw new Error('exist');
          const response = await fetchApi('/workflows/hosted', { auth: true, method: 'POST', body: JSON.stringify({ hostId }) });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message);
          if (result === null) throw new Error('not-found');
          result.hostId = `${hostId}`;
          result.createdAt = Date.now();
          await checkWorkflowPermissions([result]);
          await hostedWorkflowStore.insert(result, hostId);
          const triggerBlock = findTriggerBlock(result.drawflow);
          await registerWorkflowTrigger(hostId, triggerBlock);
          return true;
        } catch (error: any) {
          console.error(error);
          return false;
        }
      },
    });
  }

  async function openImportDialog() {
    try {
      const workflows = await importWorkflow({ multiple: true });
      await checkWorkflowPermissions(Object.values(workflows));
    } catch (error) {
      console.error(error);
    }
  }

  // Persist sort preferences
  useEffect(() => {
    localStorage.setItem('workflow-sorts', JSON.stringify({ sortOrder, sortBy, perPage }));
  }, [sortOrder, sortBy, perPage]);

  // Sync from URL query params
  useEffect(() => {
    const qActive = searchParams.get('active');
    const qTeam = searchParams.get('teamId');
    if (qActive && qActive !== activeTab) setActiveTab(qActive);
    if (qTeam !== undefined) setTeamId(qTeam || '');
  }, [searchParams]);

  // Load teams on mount
  useEffect(() => {
    const loadedTeams: Array<{ id: string | number; name: string }> = [];
    let unknownInputted = false;
    Object.keys(teamWorkflowStore.workflows || {}).forEach(id => {
      const userTeam = userStore.user?.teams?.find((tm: any) => tm.id === id || tm.id === +id);
      if (userTeam) {
        loadedTeams.push({ name: userTeam.name, id: userTeam.id });
      } else if (!unknownInputted && teamWorkflowStore.getByTeam(id).length > 0) {
        unknownInputted = true;
        loadedTeams.unshift({ name: '(unknown)', id: '(unknown)' });
      }
    });
    setTeams(loadedTeams);
  }, []);

  const sortState = useMemo(() => ({ by: sortBy, order: sortOrder }), [sortBy, sortOrder]);

  return (
    <div className="container pt-8 pb-4">
      <h1 className="text-2xl font-semibold capitalize">{t('common.workflow', { count: 2 })}</h1>
      <div className="mt-8 flex items-start">
        {/* Sidebar */}
        <div className="sticky top-8 hidden w-60 lg:block">
          <div className="flex w-full">
            <button className="ui-button variant-accent flex-1 rounded-r-none border-r font-semibold" title={shortcut['action:new']?.readable} onClick={() => setAddModal(prev => ({ ...prev, show: true }))}>
              {t('workflow.new')}
            </button>
            <div className="relative group">
              <button className="ui-button variant-accent rounded-l-none">▼</button>
              <div className="absolute right-0 z-20 hidden w-48 rounded-lg bg-white shadow-lg group-hover:block dark:bg-gray-800">
                <button className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700" onClick={openImportDialog}>{t('workflow.import')}</button>
                <button className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700" onClick={initRecordWorkflow}>{t('home.record.title')}</button>
                <button className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700" onClick={addHostedWorkflow}>{t('workflow.host.add')}</button>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <a href="https://extension.automa.site/workflows" target="_blank" rel="noreferrer" className="flex items-center px-4 py-2 rounded-lg hoverable">
              🧭 <span className="ml-4 capitalize">{t('workflow.browse')}</span>
            </a>
            {teams.length > 0 && (
              <details className="rounded-lg">
                <summary className="flex cursor-pointer items-center px-4 py-2 rounded-lg hoverable">
                  👥 <span className="ml-4 flex-1 text-left capitalize">Team Workflows</span>
                </summary>
                <div className="space-y-1 pl-14">
                  {teams.map(team => (
                    <button key={String(team.id)} className={`block w-full px-4 py-2 text-left rounded-lg hoverable ${teamId === String(team.id) ? 'bg-box-transparent font-semibold' : ''}`} title={team.name} onClick={() => updateActiveTab({ activeTab: 'team', teamId: team.id })}>
                      <span className="text-overflow">{team.name}</span>
                    </button>
                  ))}
                </div>
              </details>
            )}
            <details open className="rounded-lg">
              <summary className="flex cursor-pointer items-center px-4 py-2 rounded-lg hoverable">
                📊 <span className="ml-4 flex-1 text-left capitalize">{t('workflow.my')}</span>
              </summary>
              <div className="mt-1 space-y-1 pl-14">
                <button className={`block w-full px-4 py-2 text-left rounded-lg ${activeTab === 'local' ? 'bg-box-transparent font-semibold' : 'hoverable'}`} onClick={() => updateActiveTab({ activeTab: 'local' })}>
                  <span className="capitalize">{t('workflow.type.local')}</span>
                </button>
                {userStore.user && (
                  <button className={`block w-full px-4 py-2 text-left rounded-lg ${activeTab === 'shared' ? 'bg-box-transparent font-semibold' : 'hoverable'}`} onClick={() => updateActiveTab({ activeTab: 'shared' })}>
                    <span className="capitalize">{t('workflow.type.shared')}</span>
                  </button>
                )}
                {hostedWorkflows.length > 0 && (
                  <button className={`block w-full px-4 py-2 text-left rounded-lg ${activeTab === 'host' ? 'bg-box-transparent font-semibold' : 'hoverable'}`} onClick={() => updateActiveTab({ activeTab: 'host' })}>
                    <span className="capitalize">{t('workflow.type.host')}</span>
                  </button>
                )}
              </div>
            </details>
          </div>
          {activeTab === 'local' && <WorkflowsFolder value={activeFolder} onChange={setActiveFolder} />}
        </div>

        {/* Main content */}
        <div className="workflows-list flex-1 lg:ml-8" style={{ minHeight: 'calc(100vh - 8rem)' }}>
          <div className="flex flex-wrap items-center">
            <div className="flex w-full items-center md:w-auto">
              <input
                id="search-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="ui-input flex-1 md:w-auto"
                placeholder={`${t('common.search')}... (${shortcut['action:search']?.readable || ''})`}
              />
              <div className="relative group ml-4 lg:hidden">
                <button className="ui-button variant-accent">+ {t('common.workflow')}</button>
                <div className="absolute right-0 z-20 hidden w-48 rounded-lg bg-white shadow-lg group-hover:block dark:bg-gray-800">
                  <button className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setAddModal(prev => ({ ...prev, show: true }))}>{t('workflow.new')}</button>
                  <button className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700" onClick={openImportDialog}>{t('workflow.import')}</button>
                  <button className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700" onClick={initRecordWorkflow}>{t('home.record.title')}</button>
                  <button className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700" onClick={addHostedWorkflow}>{t('workflow.host.add')}</button>
                </div>
              </div>
            </div>
            <div className="grow" />
            <div className="mt-4 flex w-full items-center md:mt-0 md:w-auto">
              <Link to="/backup" className="ui-button mr-4" title={t('workflow.backupCloud')}>☁️</Link>
              <div className="workflow-sort flex flex-1 items-center">
                <button className="ui-button rounded-r-none border-r border-gray-300 dark:border-gray-700" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="ui-select flex-1 rounded-l-none">
                  {sorts.map(s => <option key={s} value={s}>{t(`sort.${s}`)}</option>)}
                </select>
              </div>
              <select value={activeTab} onChange={e => updateActiveTab({ activeTab: e.target.value })} className="ui-select ml-4 lg:hidden">
                <option value="local">{t('workflow.type.local')}</option>
                {userStore.user && <option value="shared">{t('workflow.type.shared')}</option>}
                {hostedWorkflows.length > 0 && <option value="host">{t('workflow.type.host')}</option>}
              </select>
            </div>
          </div>

          <div className="mt-6 flex-1">
            {activeTab === 'team' && <WorkflowsUserTeam active={activeTab === 'team'} teamId={teamId} search={query} sort={sortState} />}
            {activeTab === 'shared' && <WorkflowsShared search={query} sort={sortState} />}
            {activeTab === 'host' && (
              <div className="workflows-container grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                <WorkflowsHosted search={query} sort={sortState} />
              </div>
            )}
            {activeTab === 'local' && <WorkflowsLocal perPage={perPage} onPerPageChange={setPerPage} search={query} folderId={activeFolder} sort={sortState} />}
          </div>

          {workflowStore.isFirstTime && (
            <div className="first-card relative mt-8 rounded-lg bg-white p-4 shadow dark:bg-gray-800 dark:text-gray-200">
              <button className="absolute top-4 right-4 cursor-pointer" onClick={() => { workflowStore.isFirstTime = false; }}>✕</button>
              <p>Create your first workflow by recording your actions:</p>
              <ol className="list-inside list-decimal">
                <li>Open your browser and go to your destination URL</li>
                <li>Click the "Record workflow" button, and do your simple repetitive task</li>
                <li>Need more help? Join <a href="https://discord.gg/C6khwwTE84" target="_blank" rel="noreferrer" className="text-blue-400 underline">the community</a></li>
              </ol>
              <p className="mt-4">Learn more about recording in <a href="https://docs.extension.automa.site/guide/quick-start.html#recording-actions" target="_blank" rel="noreferrer" className="text-blue-400 underline">the documentation</a></p>
            </div>
          )}
        </div>
      </div>

      {/* Add workflow modal */}
      {addModal.show && (
        <div className="modal-overlay" onClick={clearAddWorkflowModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold">Workflow</h3>
            <input
              value={addModal.name}
              onChange={e => setAddModal(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('common.name')}
              autoFocus
              className="ui-input mb-4 w-full"
              onKeyUp={e => e.key === 'Enter' && (addModal.type === 'manual' ? addWorkflow() : startRecordWorkflow())}
            />
            <textarea
              value={addModal.description}
              onChange={e => setAddModal(prev => ({ ...prev, description: e.target.value.slice(0, 300) }))}
              placeholder={t('common.description')}
              className="ui-textarea w-full dark:text-gray-200"
              style={{ height: 165 }}
              maxLength={300}
            />
            <p className="mb-6 text-right text-gray-600 dark:text-gray-200">{addModal.description.length}/300</p>
            <div className="flex space-x-2">
              <button className="ui-button w-full" onClick={clearAddWorkflowModal}>{t('common.cancel')}</button>
              <button className="ui-button variant-accent w-full" onClick={addModal.type === 'manual' ? addWorkflow : startRecordWorkflow}>
                {addModal.type === 'manual' ? t('common.add') : t('home.record.button')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions modal */}
      {permModal.show && (
        <SharedPermissionsModal
          show={permModal.show}
          permissions={permModal.items}
          onClose={() => setPermModal({ show: false, items: [] })}
        />
      )}
    </div>
  );
}
