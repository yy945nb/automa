import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import browser from 'webextension-polyfill';
import UiButton from '@/components/ui/UiButton';
import UiInput from '@/components/ui/UiInput';
import UiTabs from '@/components/ui/UiTabs';
import UiTab from '@/components/ui/UiTab';
import UiCard from '@/components/ui/UiCard';
import UiSelect from '@/components/ui/UiSelect';
import UiPopover from '@/components/ui/UiPopover';
import HomeWorkflowCard from '@/components/popup/home/HomeWorkflowCard';
import HomeTeamWorkflows from '@/components/popup/home/HomeTeamWorkflows';
import BackgroundUtils from '@/background/BackgroundUtils';
import { initElementSelector as initElementSelectorFunc } from '@/newtab/utils/elementSelector';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';
import { useWorkflowStore } from '@/stores/workflow';
import { useHostedWorkflowStore } from '@/stores/hostedWorkflow';
import { useFolderStore } from '@/stores/folder';
import { useUserStore } from '@/stores/user';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';
import { arraySorter, parseJSON } from '@/utils/helper';
import { dialogEmitter } from '@/components/ui/UiDialog';
import automa from '@business';

const isMV2 = browser.runtime.getManifest().manifest_version === 2;
const sorts = ['name', 'createdAt', 'updatedAt', 'mostUsed'] as const;

function getInitialSortState() {
  const saved = parseJSON(localStorage.getItem('popup-workflow-sort'), {}) || {};
  return {
    sortBy: (saved as any).sortBy || 'createdAt',
    sortOrder: (saved as any).sortOrder || 'desc',
    activeFolder: (saved as any).activeFolder || '',
  };
}

export default function Home() {
  const { t } = useTranslation();

  const initSort = getInitialSortState();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('local');
  const [pinnedWorkflowIds, setPinnedWorkflowIds] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>(initSort.activeFolder);
  const [retrieved, setRetrieved] = useState(false);
  const [haveAccess, setHaveAccess] = useState(true);
  const [showSettingsPopup, setShowSettingsPopup] = useState(
    isMV2 ? false : (parseJSON(localStorage.getItem('settingsPopup'), true) ?? true)
  );
  const [sortBy, setSortBy] = useState(initSort.sortBy);
  const [sortOrder, setSortOrder] = useState<string>(initSort.sortOrder);

  // Pinia store instances — called outside render cycle to read current state
  const workflowStore = useWorkflowStore();
  const hostedWorkflowStore = useHostedWorkflowStore();
  const folderStore = useFolderStore();
  const userStore = useUserStore();
  const teamWorkflowStore = useTeamWorkflowStore();

  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // Persist sort/folder prefs
    localStorage.setItem(
      'popup-workflow-sort',
      JSON.stringify({ sortOrder, sortBy, activeFolder })
    );
  }, [sortBy, sortOrder, activeFolder]);

  useEffect(() => {
    const loadData = async () => {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      setHaveAccess(/^(https?)/.test((tab as any).url));

      const storage = await browser.storage.local.get('pinnedWorkflows');
      setPinnedWorkflowIds((storage as any).pinnedWorkflows || []);

      await folderStore.load();
      await userStore.loadUser({ storage: localStorage, ttl: 1000 * 60 * 5 });
      await teamWorkflowStore.loadData();

      let tab2 = localStorage.getItem('popup-tab') || 'local';

      await automa('app');

      if (tab2 === 'team' && !userStore.user?.teams) tab2 = 'local';
      else if (tab2 === 'host' && hostedWorkflowStore.toArray.length < 1) tab2 = 'local';

      setActiveTab(tab2);

      if (activeFolder) {
        const folderExists = folderStore.items.some(
          (folder: any) => folder.id === activeFolder
        );
        if (!folderExists) setActiveFolder('');
      }

      setRetrieved(true);
      forceUpdate((n) => n + 1);
    };

    loadData().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showTab = useMemo(
    () =>
      hostedWorkflowStore.toArray.length > 0 || (userStore.user?.teams?.length ?? 0) > 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [retrieved]
  );

  const pinnedWorkflows = useMemo(() => {
    if (activeTab !== 'local') return [];
    return pinnedWorkflowIds
      .map((id: string) => workflowStore.getById(id))
      .filter(
        (wf: any) =>
          wf &&
          wf.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pinnedWorkflowIds, query, retrieved]);

  const localWorkflows = useMemo(() => {
    if (activeTab !== 'local') return [];
    const filtered = workflowStore.getWorkflows.filter(({ name, folderId }: any) => {
      const isInFolder = !activeFolder || activeFolder === folderId;
      return isInFolder && name.toLocaleLowerCase().includes(query.toLocaleLowerCase());
    });
    return arraySorter({ key: sortBy, order: sortOrder, data: filtered });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, query, activeFolder, sortBy, sortOrder, retrieved]);

  const hostedWorkflows = useMemo(() => {
    if (activeTab !== 'host') return [];
    return hostedWorkflowStore.toArray.filter((wf: any) =>
      wf.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, query, retrieved]);

  const workflows = activeTab === 'local' ? localWorkflows : hostedWorkflows;

  function openDocs() {
    window.open(
      'https://docs.extension.automa.site/guide/quick-start.html#recording-actions',
      '_blank'
    );
  }

  function closeSettingsPopup() {
    setShowSettingsPopup(false);
    localStorage.setItem('settingsPopup', 'false');
  }

  function togglePinWorkflow(workflow: any) {
    setPinnedWorkflowIds((prev) => {
      const idx = prev.indexOf(workflow.id);
      const next = idx === -1 ? [...prev, workflow.id] : prev.filter((_, i) => i !== idx);
      browser.storage.local.set({ pinnedWorkflows: next });
      return next;
    });
  }

  async function executeWorkflow(workflow: any) {
    try {
      await RendererWorkflowService.executeWorkflow(workflow, workflow.options);
      window.close();
    } catch (error) {
      console.error(error);
    }
  }

  function updateWorkflow(id: string, data: Record<string, any>) {
    return workflowStore.update({ id, data });
  }

  function renameWorkflow({ id, name }: { id: string; name: string }) {
    dialogEmitter.emit({
      type: 'prompt',
      options: {
        title: t('home.workflow.rename'),
        placeholder: t('common.name'),
        okText: t('common.rename'),
        inputValue: name,
        onConfirm: (newName: string | boolean) => {
          updateWorkflow(id, { name: newName as string });
        },
      },
    });
  }

  function deleteWorkflow({ id, hostId, name }: { id: string; hostId?: string; name: string }) {
    dialogEmitter.emit({
      type: 'confirm',
      options: {
        title: t('home.workflow.delete'),
        okVariant: 'danger',
        body: t('message.delete', { name }),
        onConfirm: () => {
          if (activeTab === 'local') {
            workflowStore.delete(id);
          } else {
            hostedWorkflowStore.delete(hostId!);
          }
        },
      },
    });
  }

  function openDashboard(url: string) {
    BackgroundUtils.openDashboard(url);
  }

  async function initElementSelector() {
    const [tab] = await browser.tabs.query({
      url: '*://*/*',
      active: true,
      currentWindow: true,
    });
    if (!tab) return;
    initElementSelectorFunc(tab as any).then(() => {
      window.close();
    });
  }

  function openWorkflowPage({ id, hostId }: { id: string; hostId?: string }) {
    let url = `/workflows/${id}`;
    if (activeTab === 'host') url = `/workflows/${hostId}/host`;
    openDashboard(url);
  }

  function onTabChange(value: string | number) {
    const tab = String(value);
    setActiveTab(tab);
    localStorage.setItem('popup-tab', tab);
  }

  const headerHeight = !showTab ? 'h-48' : 'h-56';
  const headerMargin = !showTab ? 'mb-6' : 'mb-2';

  return (
    <>
      {/* Background accent bar */}
      <div
        className={`absolute top-0 left-0 w-full rounded-b-2xl bg-accent ${headerHeight}`}
      />

      {/* Header */}
      <div className={`dark relative z-10 px-5 pt-8 text-white ${headerMargin}`}>
        <div className="mb-4 flex items-center">
          <h1 className="text-xl font-semibold text-white">Automa</h1>
          <div className="grow" />
          <UiButton
            icon
            className="mr-2"
            title="Start recording by opening the dashboard. Click to learn more"
            onClick={openDocs}
          >
            <i className="ri-record-circle-line" />
          </UiButton>
          <UiButton
            icon
            className="mr-2"
            title={t(`home.elementSelector.${haveAccess ? 'name' : 'noAccess'}`)}
            onClick={initElementSelector}
          >
            <i className="ri-focus-3-line" />
          </UiButton>
          <UiButton
            icon
            title={t('common.dashboard')}
            onClick={() => openDashboard('')}
          >
            <i className="ri-home-5-line" />
          </UiButton>
        </div>

        <div className="flex">
          <UiInput
            modelValue={query}
            placeholder={`${t('common.search')}...`}
            autocomplete="off"
            prependIcon="riSearch2Line"
            className="search-input w-full"
            onChange={(v) => setQuery(String(v))}
          />
        </div>

        {showTab && (
          <UiTabs
            modelValue={activeTab}
            fill
            className="mt-1"
            onChange={onTabChange}
          >
            <UiTab value="local">{t('home.workflow.type.local')}</UiTab>
            {hostedWorkflowStore.toArray.length > 0 && (
              <UiTab value="host">{t('home.workflow.type.host')}</UiTab>
            )}
            {(userStore.user?.teams?.length ?? 0) > 0 && (
              <UiTab value="team">Teams</UiTab>
            )}
          </UiTabs>
        )}
      </div>

      {/* Team workflows */}
      {retrieved && (
        <div style={{ display: activeTab === 'team' ? undefined : 'none' }}>
          <HomeTeamWorkflows search={query} />
        </div>
      )}

      {/* Main workflow list */}
      {activeTab !== 'team' && (
        <div className="relative z-20 space-y-2 px-5 pb-5">
          {workflowStore.getWorkflows.length === 0 && (
            <UiCard className="text-center">
              <img src="/src/assets/svg/alien.svg" alt="" />
              <p className="font-semibold">{t('message.empty')}</p>
              <UiButton
                variant="accent"
                className="mt-6"
                onClick={() => openDashboard('/workflows')}
              >
                {t('home.workflow.new')}
              </UiButton>
            </UiCard>
          )}

          {/* Pinned workflows */}
          {pinnedWorkflows.length > 0 && (
            <div className="mt-1 mb-4 border-b pb-4">
              <div className="mb-1 flex items-center text-gray-300">
                <i className="ri-pushpin-2-line mr-2 text-xl" />
                <span>Pinned workflows</span>
              </div>
              {pinnedWorkflows.map((workflow: any) => (
                <HomeWorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  tab={activeTab}
                  pinned
                  className="mb-2"
                  onDetails={openWorkflowPage}
                  onUpdate={(data) => updateWorkflow(workflow.id, data)}
                  onExecute={executeWorkflow}
                  onRename={renameWorkflow}
                  onDelete={deleteWorkflow}
                  onTogglePin={() => togglePinWorkflow(workflow)}
                />
              ))}
            </div>
          )}

          {/* Folder + sort controls */}
          <div
            className={`flex items-center${pinnedWorkflows.length === 0 ? ' rounded-lg bg-white p-2' : ''}`}
          >
            <UiSelect
              modelValue={activeFolder}
              className="flex-1"
              onChange={(v) => setActiveFolder(String(v))}
            >
              <option value="">Folder (all)</option>
              {folderStore.items.map((folder: any) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </UiSelect>
            <UiPopover
              className="ml-2"
              triggerSlot={() => (
                <UiButton>
                  <i className="ri-sort-desc mr-2 -ml-1" />
                  <span>Sort</span>
                </UiButton>
              )}
            >
              <div className="w-48">
                <UiSelect
                  modelValue={sortOrder}
                  block
                  placeholder="Sort order"
                  onChange={(v) => setSortOrder(String(v))}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </UiSelect>
                <UiSelect
                  modelValue={sortBy}
                  placeholder={t('sort.sortBy')}
                  block
                  className="mt-2 flex-1"
                  onChange={(v) => setSortBy(String(v))}
                >
                  {sorts.map((sort) => (
                    <option key={sort} value={sort}>
                      {t(`sort.${sort}`)}
                    </option>
                  ))}
                </UiSelect>
              </div>
            </UiPopover>
          </div>

          {/* Workflow cards */}
          {workflows.map((workflow: any) => (
            <HomeWorkflowCard
              key={workflow.id}
              workflow={workflow}
              tab={activeTab}
              pinned={pinnedWorkflowIds.includes(workflow.id)}
              onDetails={openWorkflowPage}
              onUpdate={(data) => updateWorkflow(workflow.id, data)}
              onExecute={executeWorkflow}
              onRename={renameWorkflow}
              onDelete={deleteWorkflow}
              onTogglePin={() => togglePinWorkflow(workflow)}
            />
          ))}

          {/* Settings popup notification */}
          {showSettingsPopup && (
            <div className="fixed bottom-5 left-0 z-10 m-4 rounded-lg bg-accent p-4 text-white shadow-md dark:text-black">
              <p className="text-sm leading-tight">
                If the workflow runs for less than 5 minutes, set it to run in the background in the{' '}
                <a
                  href="https://docs.extension.automa.site/workflow/settings.html#workflow-execution"
                  className="font-semibold underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  workflow settings.
                </a>
              </p>
              <i
                className="ri-close-line absolute top-2 right-2 cursor-pointer text-gray-300 dark:text-gray-600"
                style={{ fontSize: 20 }}
                onClick={closeSettingsPopup}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
