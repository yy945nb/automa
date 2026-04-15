import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface TeamWorkflow {
  id: string;
  name: string;
  description?: string;
  tag?: string;
  tagColor?: string;
}

interface WorkflowsUserTeamProps {
  active?: boolean;
  teamId?: string;
  search?: string;
  sort?: { by: string; order: 'asc' | 'desc' };
}

export default function WorkflowsUserTeam({ active = false, teamId = '', search = '', sort }: WorkflowsUserTeamProps) {
  const { t } = useTranslation();

  // TODO: Load from teamWorkflowStore.getByTeam(teamId), apply search/sort
  const workflows: TeamWorkflow[] = [];

  const filtered = useMemo(() => {
    if (!search) return workflows;
    const q = search.toLowerCase();
    return workflows.filter(w => w.name.toLowerCase().includes(q));
  }, [workflows, search]);

  if (!active) return null;

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">{t('message.empty')}</p>
        <p className="mt-2 text-sm text-gray-400">
          <a href="https://extension.automa.site/auth" className="underline" target="_blank" rel="noreferrer">
            Login
          </a>{' '}
          to access team workflows
        </p>
      </div>
    );
  }

  return (
    <div className="workflows-container grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {filtered.map((workflow) => (
        <Link
          key={workflow.id}
          to={`/workflows/${workflow.id}`}
          className="block rounded-lg border bg-white p-4 transition hover:shadow dark:bg-gray-800"
        >
          <div className="flex items-center">
            <p className="flex-1 font-semibold">{workflow.name}</p>
            {workflow.tag && (
              <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: workflow.tagColor || '#e5e7eb' }}>
                {workflow.tag}
              </span>
            )}
          </div>
          {workflow.description && <p className="mt-1 text-sm text-gray-500">{workflow.description}</p>}
        </Link>
      ))}
    </div>
  );
}
