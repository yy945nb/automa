import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
// TODO: import useWorkflowStore from '@/stores/workflow'
import HomeSelectBlock from './HomeSelectBlock';

interface HomeStartRecordingProps {
  onUpdate?: (tab: string) => void;
  onClose?: () => void;
  onRecord?: (payload: Record<string, any>) => void;
}

const tabs = ['new', 'existing'];

const HomeStartRecording: React.FC<HomeStartRecordingProps> = ({
  onUpdate,
  onClose,
  onRecord,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('new');
  const [workflowName, setWorkflowName] = useState('');
  const [query, setQuery] = useState('');
  const [activeWorkflow, setActiveWorkflow] = useState('');

  // TODO: replace with real workflowStore
  // const workflowStore = useWorkflowStore();
  const workflowStore = {
    getById: (_id: string) => null as any,
    getWorkflows: [] as any[],
    update: (_payload: any) => {},
  };

  const activeWorkflowData = useMemo(
    () => workflowStore.getById(activeWorkflow),
    [activeWorkflow]
  );

  const workflows = useMemo(
    () =>
      workflowStore.getWorkflows
        .filter(({ name }: any) =>
          name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
        )
        .sort((a: any, b: any) => (a.createdAt > b.createdAt ? 1 : -1)),
    [workflowStore.getWorkflows, query]
  );

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    onUpdate?.(tab);
  }

  function updateWorkflow(data: any) {
    workflowStore.update({ data, id: activeWorkflow });
  }

  // Emit initial tab value (matches Vue's emit('update', 'new') on setup)
  // Using a ref-guard so it only fires once
  const didMount = React.useRef(false);
  if (!didMount.current) {
    didMount.current = true;
    onUpdate?.('new');
  }

  return (
    <>
      {/* Tab headers */}
      <div className="mx-4 flex">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-2 text-center capitalize ${activeTab === tab ? 'border-b-2 border-primary font-semibold' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {t(`home.record.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === 'new' && (
        <div className="mt-3 px-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onRecord?.({ name: workflowName });
            }}
          >
            <label className="block">
              <span className="text-sm">{t('home.record.name')}</span>
              <input
                value={workflowName}
                placeholder={t('common.name')}
                autoFocus
                className="mt-1 w-full rounded-lg border px-3 py-2"
                onChange={(e) => setWorkflowName(e.target.value)}
              />
            </label>
            <button
              className="mt-6 w-full rounded-lg bg-accent py-2 text-white"
              type="submit"
            >
              {t('home.record.button')}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'existing' && (
        <div>
          {activeWorkflowData ? (
            <HomeSelectBlock
              workflow={activeWorkflowData}
              onUpdate={updateWorkflow}
              onRecord={onRecord}
              onGoBack={() => setActiveWorkflow('')}
            />
          ) : (
            <>
              <div className="mt-4 px-4">
                <div className="relative">
                  <i className="ri-search-2-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={query}
                    className="w-full rounded-lg border py-2 pl-9 pr-3"
                    placeholder={t('common.search')}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
              <ul className="scroll mt-2 mb-4 h-72 overflow-y-auto space-y-1 px-4">
                {workflows.map((workflow: any) => (
                  <li
                    key={workflow.id}
                    className="flex cursor-pointer items-center rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setActiveWorkflow(workflow.id)}
                  >
                    {workflow.icon?.startsWith('http') ? (
                      <img
                        src={workflow.icon}
                        className="overflow-hidden rounded-lg"
                        style={{ height: '32px', width: '32px' }}
                        alt="Can not display"
                      />
                    ) : (
                      <span className="bg-box-transparent rounded-lg p-2">
                        <i className={workflow.icon} style={{ fontSize: 20 }} />
                      </span>
                    )}
                    <div className="ml-2 flex-1 overflow-hidden">
                      <p title={workflow.name} className="text-overflow leading-tight">
                        {workflow.name}
                      </p>
                      <p
                        title={workflow.description}
                        className="text-overflow text-sm leading-tight text-gray-600"
                      >
                        {workflow.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default HomeStartRecording;
