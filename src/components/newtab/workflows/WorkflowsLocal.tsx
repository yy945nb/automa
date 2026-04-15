import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface Workflow {
  id: string;
  name: string;
  icon?: string;
  createdAt?: number;
  updatedAt?: number;
  isDisabled?: boolean;
  description?: string;
}

interface WorkflowsLocalProps {
  search?: string;
  folderId?: string;
  sort?: { by: string; order: 'asc' | 'desc' };
  perPage?: number;
  onPerPageChange?: (n: number) => void;
}

export default function WorkflowsLocal({ search = '', folderId = '', sort, perPage = 18, onPerPageChange }: WorkflowsLocalProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);

  // TODO: Load from workflowStore.getWorkflows, apply search/folder/sort filters
  const workflows: Workflow[] = [];

  const filtered = useMemo(() => {
    let list = [...workflows];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(w => w.name.toLowerCase().includes(q) || w.description?.toLowerCase().includes(q));
    }
    return list;
  }, [workflows, search]);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, currentPage, perPage]);

  if (workflows.length === 0) {
    return (
      <div className="flex items-center py-12 text-center md:text-left">
        <div className="ml-4">
          <h1 className="mb-6 max-w-md text-2xl font-semibold">{t('message.empty')}</h1>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="workflows-container grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {paged.map((workflow) => (
          <Link
            key={workflow.id}
            to={`/workflows/${workflow.id}`}
            className="block rounded-lg border bg-white p-4 transition hover:shadow dark:bg-gray-800"
          >
            <p className="font-semibold">{workflow.name}</p>
            {workflow.description && <p className="mt-1 text-sm text-gray-500">{workflow.description}</p>}
          </Link>
        ))}
      </div>
      {filtered.length > 18 && (
        <div className="mt-8 flex items-center justify-between">
          <div>
            {t('components.pagination.text1')}
            <select
              value={perPage}
              className="bg-input rounded-md p-1"
              onChange={(e) => onPerPageChange?.(Number(e.target.value))}
            >
              {[18, 32, 64, 128].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            {t('components.pagination.text2', { count: filtered.length })}
          </div>
          <div className="flex space-x-2">
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} className="ui-button">←</button>
            <span className="px-2 py-1">{currentPage}</span>
            <button disabled={currentPage * perPage >= filtered.length} onClick={() => setCurrentPage(p => p + 1)} className="ui-button">→</button>
          </div>
        </div>
      )}
    </div>
  );
}
