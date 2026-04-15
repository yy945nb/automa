import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface SharedWorkflow {
  id: string;
  name: string;
  description?: string;
  createdAt?: number;
}

interface WorkflowsSharedProps {
  search?: string;
  sort?: { by: string; order: 'asc' | 'desc' };
}

export default function WorkflowsShared({ search = '', sort }: WorkflowsSharedProps) {
  const { t } = useTranslation();

  // TODO: Load from sharedWorkflowStore, apply search/sort
  const workflows: SharedWorkflow[] = [];

  const filtered = useMemo(() => {
    if (!search) return workflows;
    const q = search.toLowerCase();
    return workflows.filter(w => w.name.toLowerCase().includes(q));
  }, [workflows, search]);

  if (filtered.length === 0) {
    return (
      <div className="flex items-center py-12 text-center md:text-left">
        <div className="ml-4">
          <h1 className="mb-6 max-w-md text-2xl font-semibold">{t('message.empty')}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="workflows-container grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {filtered.map((workflow) => (
        <Link
          key={workflow.id}
          to={`/workflows/${workflow.id}/shared`}
          className="block rounded-lg border bg-white p-4 transition hover:shadow dark:bg-gray-800"
        >
          <p className="font-semibold">{workflow.name}</p>
          {workflow.description && <p className="mt-1 text-sm text-gray-500">{workflow.description}</p>}
        </Link>
      ))}
    </div>
  );
}
