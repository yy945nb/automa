import React, { useState, useEffect, useMemo } from 'react';
// TODO: import useUserStore from '@/stores/user'
// TODO: import useTeamWorkflowStore from '@/stores/teamWorkflow'
// TODO: import sendMessage from '@/utils/message'
// TODO: import tagColors from '@/utils/shared'
// TODO: import dayjs from '@/lib/dayjs'

interface TeamWorkflow {
  id: string;
  name: string;
  teamId: string;
  teamName?: string;
  createdAt: string | number;
  tag?: string;
  isDisabled?: boolean;
}

interface HomeTeamWorkflowsProps {
  search?: string;
}

const HomeTeamWorkflows: React.FC<HomeTeamWorkflowsProps> = ({ search = '' }) => {
  const [teamWorkflows, setTeamWorkflows] = useState<TeamWorkflow[]>([]);

  // TODO: replace with real store hooks
  // const userStore = useUserStore();
  // const teamWorkflowStore = useTeamWorkflowStore();
  const userStore = { user: null as any };
  const teamWorkflowStore = { getByTeam: (_teamId: string): any[] => [] };

  // TODO: replace with real tagColors from '@/utils/shared'
  const tagColors: Record<string, string> = {};

  // TODO: replace with real dayjs
  function formatDate(date: string | number) {
    return new Date(date).toLocaleDateString();
  }

  useEffect(() => {
    if (!userStore.user?.teams) return;

    const result: TeamWorkflow[] = userStore.user.teams
      .reduce((acc: TeamWorkflow[], team: any) => {
        const currentWorkflows = teamWorkflowStore
          .getByTeam(team.id)
          .map((workflow: any) => ({
            ...workflow,
            teamId: team.id,
            teamName: team.name,
          }));
        acc.push(...currentWorkflows);
        return acc;
      }, [])
      .sort((a: TeamWorkflow, b: TeamWorkflow) =>
        a.createdAt > b.createdAt ? 1 : -1
      );

    setTeamWorkflows(result);
  }, []);

  const workflows = useMemo(
    () =>
      teamWorkflows.filter((workflow) =>
        workflow.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())
      ),
    [teamWorkflows, search]
  );

  function openWorkflowPage({ teamId, id }: { teamId: string; id: string }) {
    const url = `/teams/${teamId}/workflows/${id}`;
    // TODO: sendMessage('open:dashboard', url, 'background');
    console.warn('TODO: sendMessage open:dashboard', url);
  }

  function executeWorkflow(workflow: TeamWorkflow) {
    // TODO: sendMessage('workflow:execute', workflow, 'background');
    console.warn('TODO: sendMessage workflow:execute', workflow);
  }

  return (
    <div className="space-y-2 px-5 pb-5">
      {workflows.map((workflow) => (
        <div
          key={workflow.id}
          className="bg-white dark:bg-gray-800 relative flex w-full items-center space-x-2 rounded-lg p-3 shadow hover:ring-2 hover:ring-gray-900"
        >
          <div
            className="text-overflow mr-4 flex-1 cursor-pointer"
            onClick={() => openWorkflowPage(workflow)}
          >
            <p className="text-overflow leading-tight">{workflow.name}</p>
            <div className="flex items-center text-gray-500">
              <span>{formatDate(workflow.createdAt)}</span>
              <div className="grow" />
              {workflow.tag && (
                <span
                  className={`text-overflow ml-2 rounded-md px-2 py-1 text-sm text-gray-600 ${tagColors[workflow.tag] ?? ''}`}
                  style={{ maxWidth: '120px' }}
                >
                  {workflow.tag}
                </span>
              )}
            </div>
          </div>
          {workflow.isDisabled ? (
            <p className="text-sm text-gray-600">Disabled</p>
          ) : (
            <button title="Execute" onClick={() => executeWorkflow(workflow)}>
              <i className="ri-play-line" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default HomeTeamWorkflows;
