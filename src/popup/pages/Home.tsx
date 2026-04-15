import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import browser from 'webextension-polyfill';
import BackgroundUtils from '@/background/BackgroundUtils';
import HomeTeamWorkflows from '@/components/popup/home/HomeTeamWorkflows';
import HomeWorkflowCard from '@/components/popup/home/HomeWorkflowCard';
import { useDialog } from '@/composable/dialog';
import { useGroupTooltip } from '@/composable/groupTooltip';
import { initElementSelector as initElementSelectorFunc } from '@/newtab/utils/elementSelector';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';
import { useFolderStore } from '@/stores/folder';
import { useHostedWorkflowStore } from '@/stores/hostedWorkflow';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';
import { useUserStore } from '@/stores/user';
import { useWorkflowStore } from '@/stores/workflow';
import { arraySorter, parseJSON } from '@/utils/helper';
import automa from '@business';
import UiButton from '@/components/ui/UiButton';
import UiInput from '@/components/ui/UiInput';
import UiTabs from '@/components/ui/UiTabs';
import UiTab from '@/components/ui/UiTab';
import UiCard from '@/components/ui/UiCard';
import UiSelect from '@/components/ui/UiSelect';
import UiPopover from '@/components/ui/UiPopover';
import VRemixicon from '@/components/VRemixicon';
import alienSvg from '@/assets/svg/alien.svg';

const isMV2 = browser.runtime.getManifest().manifest_version === 2;
const sorts = ['name', 'createdAt', 'updatedAt', 'mostUsed'] as const;

const Home: React.FC = () => {
  const { t } = useTranslation();
  const dialog = useDialog();
  const userStore = useUserStore();
  const folderStore = useFolderStore();
  const workflowStore = useWorkflowStore();
  const teamWorkflowStore = useTeamWorkflowStore();
  const hostedWorkflowStore = useHostedWorkflowStore();

  useGroupTooltip();

  const savedSorts = parseJSON(localStorage.getItem('popup-workflow-sort'), {}) || {};

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('local');
  const [retrieved, setRetrieved] = useState(false);
  const [haveAccess, setHaveAccess] = useState(true);
  const [pinnedWorkflowIds, setPinnedWorkflowIds] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState(savedSorts.activeFolder || '');
  const [sortBy, setSortBy] = useState(savedSorts.sortBy || 'createdAt');
  const [sortOrder, setSortOrder] = useState(savedSorts.sortOrder || 'desc');
  const [showSettingsPopup, setShowSettingsPopup] = useState(
    isMV2 ? false : (parseJSON(localStorage.getItem('settingsPopup'), true) ?? true)
  );

  const showTab = useMemo(
    () => hostedWorkflowStore.toArray.length > 0 || (userStore.user?.teams?.length ?? 0) > 0,
    [hostedWorkflowStore.toArray, userStore.user]
  );

  const pinnedWorkflows = useMemo(() => {
    if (activeTab !== 'local') return [];

    const list: any[] = [];
    pinnedWorkflowIds.forEach((workflowId) => {
      const workflow = workflowStore.getById(workflowId);
      if (
        !workflow ||
        !workflow.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
      )
        return;
      list.push(workflow);
    });

    return list;
  }, [activeTab, pinnedWorkflowIds, workflowStore, query]);

  const hostedWorkflows = useMemo(() => {
    if (activeTab !== 'host') return [];
    return hostedWorkflowStore.toArray.filter((workflow: any) =>
      workflow.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
    );
  }, [activeTab, hostedWorkflowStore.toArray, query]);

  const localWorkflows = useMemo(() => {
    if (activeTab !== 'local') return [];

    const filtered = workflowStore.getWorkflows.filter(
      ({ name, folderId }: any) => {
        const isInFolder = !activeFolder || activeFolder === folderId;
        const nameMatch = name.toLocaleLowerCase().includes(query.toLocaleLowerCase());
        return isInFolder && nameMatch;
      }
    );

    return arraySorter({
      key: sortBy,
      order: sortOrder,
      data: filtered,
    });
  }, [activeTab, workflowStore.getWorkflows, activeFolder, query, sortBy, sortOrder]);

  const workflows = useMemo(
    () => (activeTab === 'local' ? localWorkflows : hostedWorkflows),
    [activeTab, localWorkflows, hostedWorkflows]
  );

  // Persist sort settings
  useEffect(() => {
    localStorage.setItem(
      'popup-workflow-sort',
      JSON.stringify({ sortOrder, sortBy, activeFolder })
    );
  }, [sortBy, sortOrder, activeFolder]);

  // Load data on mount
  useEffect(() => {
    (async () => {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      setHaveAccess(/^(https?)/.test(tab?.url || ''));

      const storage = await browser.storage.local.get('pinnedWorkflows');
      setPinnedWorkflowIds(storage.pinnedWorkflows || []);

      await folderStore.load();
      await userStore.loadUser({ storage: localStorage, ttl: 1000 * 60 * 5 });
      await teamWorkflowStore.loadData();

      let tab2 = localStorage.getItem('popup-tab') || 'local';

      await automa('app');

      if (tab2 === 'team' && !userStore.user?.teams) tab2 = 'local';
      else if (tab2 === 'host' && hostedWorkflowStore.toArray.length < 1) tab2 = 'local';

      setRetrieved(true);
      setActiveTab(tab2);

      if (activeFolder) {
        const folderExist = folderStore.items.some(
          (folder: any) => folder.id === activeFolder
        );
        if (!folderExist) setActiveFolder('');
      }
    })();
  }, []);

  const openDocs = useCallback(() => {
    window.open(
      'https://docs.extension.automa.site/guide/quick-start.html#recording-actions',
      '_blank'
    );
  }, []);

  const closeSettingsPopup = useCallback(() => {
    setShowSettingsPopup(false);
    localStorage.setItem('settingsPopup', 'false');
  }, []);

  const togglePinWorkflow = useCallback(
    (workflow: any) => {
      const index = pinnedWorkflowIds.indexOf(workflow.id);
      const copyData = [...pinnedWorkflowIds];

      if (index === -1) {
        copyData.push(workflow.id);
      } else {
        copyData.splice(index, 1);
      }

      setPinnedWorkflowIds(copyData);
      browser.storage.local.set({ pinnedWorkflows: copyData });
    },
    [pinnedWorkflowIds]
  );

  const executeWorkflow = useCallback(async (workflow: any) => {
    try {
      await RendererWorkflowService.executeWorkflow(workflow, workflow.options);
      window.close();
    } catch (error) {
      console.error(error);
    }
  }, []);

  const updateWorkflow = useCallback(
    (id: string, data: any) => {
      return workflowStore.update({ id, data });
    },
    [workflowStore]
  );

  const renameWorkflow = useCallback(
    ({ id, name }: { id: string; name: string }) => {
      dialog.prompt({
        title: t('home.workflow.rename'),
        placeholder: t('common.name'),
        okText: t('common.rename'),
        inputValue: name,
        onConfirm: (newName: string) => {
          updateWorkflow(id, { name: newName });
        },
      });
    },
    [dialog, t, updateWorkflow]
  );

  const deleteWorkflow = useCallback(
    ({ id, hostId, name }: { id: string; hostId?: string; name: string }) => {
      dialog.confirm({
        title: t('home.workflow.delete'),
        okVariant: 'danger',
        body: t('message.delete', { name }),
        onConfirm: () => {
          if (activeTab === 'local') {
            workflowStore.delete(id);
          } else {
            hostedWorkflowStore.delete(hostId);
          }
        },
      });
    },
    [dialog, t, activeTab, workflowStore, hostedWorkflowStore]
  );

  const openDashboard = useCallback((url: string) => {
    BackgroundUtils.openDashboard(url);
  }, []);

  const initElementSelector = useCallback(async () => {
    const [tab] = await browser.tabs.query({
      url: '*://*/*',
      active: true,
      currentWindow: true,
    });
    if (!tab) return;
    initElementSelectorFunc(tab).then(() => {
      window.close();
    });
  }, []);

  const openWorkflowPage = useCallback(
    ({ id, hostId }: { id: string; hostId?: string }) => {
      let url = `/workflows/${id}`;
      if (activeTab === 'host') {
        url = `/workflows/${hostId}/host`;
      }
      openDashboard(url);
    },
    [activeTab, openDashboard]
  );

  const onTabChange = useCallback((value: string) => {
    setActiveTab(value);
    localStorage.setItem('popup-tab', value);
  }, []);

  return (
    <>
      {/* Header background */}
      <div
        className={`absolute top-0 left-0 w-full rounded-b-2xl bg-accent ${
          !showTab ? 'h-48' : 'h-56'
        }`}
      />

      {/* Header content */}
      <div
        className={`dark relative z-10 px-5 pt-8 text-white placeholder:text-black ${
          !showTab ? 'mb-6' : 'mb-2'
        }`}
      >
        <div className="mb-4 flex items-center">
          <h1 className="text-xl font-semibold text-white">Automa</h1>
          <div className="grow" />
          <UiButton
            icon
            className="mr-2"
            title="Start recording by opening the dashboard. Click to learn more"
            onClick={openDocs}
          >
            <VRemixicon name="riRecordCircleLine" />
          </UiButton>
          <UiButton
            icon
            className="mr-2"
            title={t(`home.elementSelector.${haveAccess ? 'name' : 'noAccess'}`)}
            onClick={initElementSelector}
          >
            <VRemixicon name="riFocus3Line" />
          </UiButton>
          <UiButton
            icon
            title={t('common.dashboard')}
            onClick={() => openDashboard('')}
          >
            <VRemixicon name="riHome5Line" />
          </UiButton>
        </div>

        <div className="flex">
          <UiInput
            value={query}
            onChange={(e: any) => setQuery(e.target?.value ?? e)}
            placeholder={`${t('common.search')}...`}
            autoComplete="off"
            prependIcon="riSearch2Line"
            className="search-input w-full"
          />
        </div>

        {showTab && (
          <UiTabs value={activeTab} fill className="mt-1" onChange={onTabChange}>
            <UiTab value="local">{t('home.workflow.type.local')}</UiTab>
            {hostedWorkflowStore.toArray.length > 0 && (
              <UiTab value="host">{t('home.workflow.type.host')}</UiTab>
            )}
            {userStore.user?.teams?.length && <UiTab value="team">Teams</UiTab>}
          </UiTabs>
        )}
      </div>

      {/* Team workflows */}
      {retrieved && activeTab === 'team' && (
        <HomeTeamWorkflows search={query} />
      )}

      {/* Local / hosted workflow list */}
      {activeTab !== 'team' && (
        <div className="relative z-20 space-y-2 px-5 pb-5">
          {workflowStore.getWorkflows.length === 0 && (
            <UiCard className="text-center">
              <img src={alienSvg} alt="" />
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

          {pinnedWorkflows.length > 0 && (
            <div className="mt-1 mb-4 border-b pb-4">
              <div className="mb-1 flex items-center text-gray-300">
                <VRemixicon name="riPushpin2Line" size={20} className="mr-2" />
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
                  onUpdate={(data: any) => updateWorkflow(workflow.id, data)}
                  onExecute={executeWorkflow}
                  onRename={renameWorkflow}
                  onDelete={deleteWorkflow}
                  onTogglePin={() => togglePinWorkflow(workflow)}
                />
              ))}
            </div>
          )}

          <div
            className={`flex items-center ${
              pinnedWorkflows.length === 0 ? 'p-2 rounded-lg bg-white' : ''
            }`}
          >
            <UiSelect
              value={activeFolder}
              onChange={(e: any) => setActiveFolder(e.target?.value ?? e)}
              className="flex-1"
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
              trigger={
                <UiButton>
                  <VRemixicon name="riSortDesc" className="mr-2 -ml-1" />
                  <span>Sort</span>
                </UiButton>
              }
            >
              <div className="w-48">
                <UiSelect
                  value={sortOrder}
                  onChange={(e: any) => setSortOrder(e.target?.value ?? e)}
                  block
                  placeholder="Sort order"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </UiSelect>
                <UiSelect
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target?.value ?? e)}
                  placeholder={t('sort.sortBy')}
                  block
                  className="mt-2 flex-1"
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

          {workflows.map((workflow: any) => (
            <HomeWorkflowCard
              key={workflow.id}
              workflow={workflow}
              tab={activeTab}
              pinned={pinnedWorkflowIds.includes(workflow.id)}
              onDetails={openWorkflowPage}
              onUpdate={(data: any) => updateWorkflow(workflow.id, data)}
              onExecute={executeWorkflow}
              onRename={renameWorkflow}
              onDelete={deleteWorkflow}
              onTogglePin={() => togglePinWorkflow(workflow)}
            />
          ))}

          {showSettingsPopup && (
            <div className="fixed bottom-5 left-0 m-4 rounded-lg bg-accent p-4 text-white shadow-md dark:text-black z-10">
              <p className="text-sm leading-tight">
                If the workflow runs for less than 5 minutes, set it to run in the
                background in the{' '}
                <a
                  href="https://docs.extension.automa.site/workflow/settings.html#workflow-execution"
                  className="font-semibold underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  workflow settings.
                </a>
              </p>
              <VRemixicon
                name="riCloseLine"
                className="absolute top-2 right-2 cursor-pointer text-gray-300 dark:text-gray-600"
                size={20}
                onClick={closeSettingsPopup}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Home;
