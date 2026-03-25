import React from 'react';
import { useTranslation } from 'react-i18next';

interface FiltersProps {
  query: string;
  byDate: number;
  byStatus: string;
  workflowQuery: string;
  workflowId: string;
}

interface SortsProps {
  order: string;
  by: string;
}

interface LogsFiltersProps {
  filters: FiltersProps;
  sorts: SortsProps;
  workflows?: any[];
  onUpdateFilters: (payload: { key: string; value: any }) => void;
  onUpdateSorts: (payload: { key: string; value: any }) => void;
  onClear: () => void;
  children?: React.ReactNode;
}

const LogsFilters: React.FC<LogsFiltersProps> = ({
  filters,
  sorts,
  onUpdateFilters,
  onUpdateSorts,
  onClear,
  children,
}) => {
  const { t } = useTranslation();

  const filterByStatus = [
    { id: 'all', name: t('common.all') },
    { id: 'success', name: t('logStatus.success') },
    { id: 'stopped', name: t('logStatus.stopped') },
    { id: 'error', name: t('logStatus.error') },
  ];
  const filterByDate = [
    { id: 0, name: t('common.all') },
    { id: 1, name: t('log.filter.byDate.items.lastDay') },
    { id: 7, name: t('log.filter.byDate.items.last7Days') },
    { id: 30, name: t('log.filter.byDate.items.last30Days') },
  ];
  const sortsList = [
    { id: 'name', name: t('sort.name') },
    { id: 'startedAt', name: t('sort.createdAt') },
  ];

  return (
    <div className="mb-6 flex flex-wrap items-center md:space-x-4">
      <input
        id="search-input"
        value={filters.query}
        placeholder={`${t('common.search')}...`}
        className="w-6/12 md:w-auto md:flex-1"
        onChange={(e) => onUpdateFilters({ key: 'query', value: e.target.value })}
      />
      {children}
      <div className="workflow-sort ml-4 flex w-5/12 items-center md:ml-0 md:w-auto">
        <button
          className="rounded-r-none border-r border-gray-300"
          onClick={() => onUpdateSorts({ key: 'order', value: sorts.order === 'asc' ? 'desc' : 'asc' })}
        >
          <i className={sorts.order === 'asc' ? 'riSortAsc' : 'riSortDesc'}></i>
        </button>
        <select
          value={sorts.by}
          onChange={(e) => onUpdateSorts({ key: 'by', value: e.target.value })}
        >
          {sortsList.map((sort) => (
            <option key={sort.id} value={sort.id}>{sort.name}</option>
          ))}
        </select>
      </div>
      {/* TODO: Popover for filter */}
      <div className="mt-4 md:mt-0">
        <p className="mb-2 flex-1 font-semibold">{t('log.filter.title')}</p>
        <p className="mb-2 text-sm text-gray-600 dark:text-gray-200">{t('log.filter.byStatus')}</p>
        <div className="grid grid-cols-2 gap-2">
          {filterByStatus.map((status) => (
            <label key={status.id} className="text-sm capitalize">
              <input
                type="radio"
                value={status.id}
                checked={filters.byStatus === status.id}
                onChange={() => onUpdateFilters({ key: 'byStatus', value: status.id })}
              />
              {' '}{status.name}
            </label>
          ))}
        </div>
        <p className="mb-1 mt-3 text-sm text-gray-600 dark:text-gray-200">{t('log.filter.byDate.title')}</p>
        <select
          value={filters.byDate}
          className="w-full"
          onChange={(e) => onUpdateFilters({ key: 'byDate', value: Number(e.target.value) })}
        >
          {filterByDate.map((date) => (
            <option key={date.id} value={date.id}>{date.name}</option>
          ))}
        </select>
      </div>
      <button className="ml-4 mt-4 md:ml-0 md:mt-0" onClick={onClear}>
        <i className="riDeleteBin7Line"></i>
        <span>{t('log.clearLogs.title')}</span>
      </button>
    </div>
  );
};

export default LogsFilters;
