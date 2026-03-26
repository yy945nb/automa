import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
// TODO: replace with React state/context (Pinia: useWorkflowStore, useHostedWorkflowStore)
// TODO: replace with React-compatible live query (useLiveQuery / dbLogs)
// TODO: replace with dialog/confirmation utility
// TODO: import LogsFilters from '@/components/newtab/logs/LogsFilters'
// TODO: import LogsDataViewer from '@/components/newtab/logs/LogsDataViewer'
// TODO: import SharedLogsTable from '@/components/newtab/shared/SharedLogsTable'

interface AppLogsItemsProps {
  workflowId?: string;
  onSelect?: (event: { id: string; type: string }) => void;
  onClose?: () => void;
}

interface Log {
  id: string;
  name: string;
  status: string;
  endedAt: number;
  workflowId: string;
}

interface Workflow {
  id: string;
  name: string;
  createdAt: number;
}

interface SortsBuilder {
  order: 'asc' | 'desc';
  by: string;
}

interface FiltersBuilder {
  query: string;
  byDate: number;
  byStatus: string;
  workflowQuery: string;
  workflowId: string;
}

interface Pagination {
  perPage: number;
  currentPage: number;
}

const AppLogsItems: React.FC<AppLogsItemsProps> = ({
  workflowId = '',
  onSelect,
  onClose,
}) => {
  const { t } = useTranslation();

  // TODO: replace with actual live query from dbLogs
  const storedLogs: Log[] = []; // useLiveQuery(() => dbLogs.items.toArray())

  // TODO: replace with Pinia store data
  const allWorkflowsFromStore: Workflow[] = []; // [...hostedWorkflows.toArray, ...workflowStore.getWorkflows]
  const workflowStatesFromStore: unknown[] = []; // workflowStore.getAllStates

  const savedSorts: Partial<SortsBuilder> = JSON.parse(
    localStorage.getItem('logs-sorts') || '{}'
  );

  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    perPage: 10,
    currentPage: 1,
  });
  const [filtersBuilder, setFiltersBuilder] = useState<FiltersBuilder>({
    query: '',
    byDate: 0,
    byStatus: 'all',
    workflowQuery: '',
    workflowId: workflowId,
  });
  const [sortsBuilder, setSortsBuilder] = useState<SortsBuilder>({
    order: (savedSorts.order as 'asc' | 'desc') || 'desc',
    by: savedSorts.by || 'endedAt',
  });
  const [exportDataModal, setExportDataModal] = useState<{ show: boolean; log: Partial<Log> }>({
    show: false,
    log: {},
  });

  // Persist sorts to localStorage
  useEffect(() => {
    localStorage.setItem('logs-sorts', JSON.stringify(sortsBuilder));
  }, [sortsBuilder]);

  const allWorkflows = useMemo(
    () =>
      [...allWorkflowsFromStore].sort((a, b) =>
        a.createdAt > b.createdAt ? -1 : 1
      ),
    [allWorkflowsFromStore]
  );

  const workflows = useMemo(
    () =>
      allWorkflows.filter((workflow) =>
        workflow.name
          .toLocaleLowerCase()
          .includes(filtersBuilder.workflowQuery.toLocaleLowerCase())
      ),
    [allWorkflows, filtersBuilder.workflowQuery]
  );

  const activeWorkflowName = useMemo(() => {
    if (!filtersBuilder.workflowId) return 'All workflows';
    const workflow = allWorkflows.find((item) => item.id === filtersBuilder.workflowId);
    return workflow?.name ?? 'All workflows';
  }, [allWorkflows, filtersBuilder.workflowId]);

  const workflowStates = useMemo(() => {
    if (!filtersBuilder.workflowId) return workflowStatesFromStore;
    return (workflowStatesFromStore as Array<{ workflowId: string }>).filter(
      (state) => state.workflowId === filtersBuilder.workflowId
    );
  }, [workflowStatesFromStore, filtersBuilder.workflowId]);

  const filteredLogs = useMemo(() => {
    if (!storedLogs) return [];
    return [...storedLogs]
      .filter(({ name, status, endedAt, workflowId: wId }) => {
        const workflowIdFilter = filtersBuilder.workflowId
          ? filtersBuilder.workflowId === wId
          : true;
        const searchFilter = name
          .toLocaleLowerCase()
          .includes(filtersBuilder.query.toLocaleLowerCase());
        const statusFilter =
          filtersBuilder.byStatus !== 'all'
            ? status === filtersBuilder.byStatus
            : true;
        const dateFilter =
          filtersBuilder.byDate > 0
            ? Date.now() - filtersBuilder.byDate * 24 * 60 * 60 * 1000 <= endedAt
            : true;
        return searchFilter && workflowIdFilter && statusFilter && dateFilter;
      })
      .sort((a, b) => {
        const valueA = (a as Record<string, unknown>)[sortsBuilder.by] as number;
        const valueB = (b as Record<string, unknown>)[sortsBuilder.by] as number;
        if (sortsBuilder.order === 'asc') return valueA > valueB ? 1 : -1;
        return valueB > valueA ? 1 : -1;
      });
  }, [storedLogs, filtersBuilder, sortsBuilder]);

  const logs = useMemo(
    () =>
      filteredLogs.slice(
        (pagination.currentPage - 1) * pagination.perPage,
        pagination.currentPage * pagination.perPage
      ),
    [filteredLogs, pagination]
  );

  const deleteLog = useCallback((id: string) => {
    // TODO: dbLogs.items.delete(id).then(() => { dbLogs.ctxData/histories/logsData cleanup })
  }, []);

  const toggleSelectedLog = useCallback((selected: boolean, logId: string) => {
    setSelectedLogs((prev) => {
      if (selected) return [...prev, logId];
      return prev.filter((id) => id !== logId);
    });
  }, []);

  const deleteSelectedLogs = useCallback(() => {
    // TODO: dialog.confirm({ title: t('log.delete.title'), ... onConfirm: dbLogs.items.bulkDelete(selectedLogs) })
    setSelectedLogs([]);
  }, [selectedLogs]);

  const clearLogs = useCallback(() => {
    // TODO: dialog.confirm({ title: t('log.clearLogs.title'), ... onConfirm: dbLogs.items.clear() + other tables })
  }, []);

  const selectAllLogs = useCallback(() => {
    if (selectedLogs.length >= logs.length) {
      setSelectedLogs([]);
      return;
    }
    setSelectedLogs(logs.map(({ id }) => id));
  }, [selectedLogs, logs]);

  const updateFilter = <K extends keyof FiltersBuilder>(key: K, value: FiltersBuilder[K]) => {
    setFiltersBuilder((prev) => ({ ...prev, [key]: value }));
  };

  const updateSort = <K extends keyof SortsBuilder>(key: K, value: SortsBuilder[K]) => {
    setSortsBuilder((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="logs-list overflow-auto pb-4 pt-1">
      <div className="mb-8 flex items-center">
        <h1 className="flex-1 text-2xl font-semibold">{t('common.log', { count: 2 })}</h1>
        <i
          className="ri-close-line cursor-pointer text-gray-600 dark:text-gray-300"
          onClick={() => onClose?.()}
        ></i>
      </div>

      {/* TODO: replace with LogsFilters component */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          value={filtersBuilder.query}
          onChange={(e) => updateFilter('query', e.target.value)}
          placeholder="Search..."
          className="bg-input rounded-md p-2"
        />
        {/* Workflow filter popover */}
        <div className="relative">
          {/* TODO: replace with ui-popover */}
          <button onClick={() => updateFilter('workflowQuery', '')}>
            <span
              className="text-overflow text-left"
              style={{ maxWidth: 160 }}
            >
              {activeWorkflowName}
            </span>
            <i className="ri-arrow-drop-down-line -mr-1 ml-2"></i>
          </button>
          {/* TODO: render workflow list popover */}
          <div className="hidden w-64">
            <div className="p-4">
              <input
                type="text"
                value={filtersBuilder.workflowQuery}
                onChange={(e) => updateFilter('workflowQuery', e.target.value)}
                placeholder="Search..."
                className="w-full"
                autoFocus
              />
              <div className="text-right">
                <span
                  className="cursor-pointer text-sm text-gray-600 underline dark:text-gray-300"
                  onClick={() => updateFilter('workflowId', '')}
                >
                  Clear
                </span>
              </div>
            </div>
            <ul className="scroll mb-4 max-h-96 space-y-1 overflow-auto px-4">
              {workflows.map((workflow) => (
                <li
                  key={workflow.id}
                  className={[
                    'cursor-pointer',
                    filtersBuilder.workflowId === workflow.id ? 'font-semibold' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => updateFilter('workflowId', workflow.id)}
                >
                  <p className="text-overflow">{workflow.name}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Logs table */}
      {logs && (
        <div style={{ minHeight: 320 }}>
          {/* TODO: replace with SharedLogsTable component */}
          {/* <SharedLogsTable
            logs={logs}
            modal={true}
            running={workflowStates}
            className="w-full"
            style={{ maxHeight: 'calc(100vh - 18rem)' }}
            onSelect={(e) => onSelect?.(e)}
            renderItemPrepend={(log) => (
              <td className="w-8">
                <input
                  type="checkbox"
                  checked={selectedLogs.includes(log.id)}
                  onChange={(e) => toggleSelectedLog(e.target.checked, log.id)}
                  className="align-text-bottom"
                />
              </td>
            )}
            renderItemAppend={(log) => (
              <td className="ml-4 text-right">
                <i
                  className="ri-delete-bin-7-line inline-block cursor-pointer text-red-500 dark:text-red-400"
                  onClick={() => deleteLog(log.id)}
                />
              </td>
            )}
          /> */}
          <table className="w-full" style={{ maxHeight: 'calc(100vh - 18rem)' }}>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="w-8">
                    <input
                      type="checkbox"
                      checked={selectedLogs.includes(log.id)}
                      onChange={(e) => toggleSelectedLog(e.target.checked, log.id)}
                      className="align-text-bottom"
                    />
                  </td>
                  <td
                    className="cursor-pointer"
                    onClick={() => onSelect?.({ id: log.id, type: 'completed' })}
                  >
                    {log.name}
                  </td>
                  <td>{log.status}</td>
                  <td className="ml-4 text-right">
                    <i
                      className="ri-delete-bin-7-line inline-block cursor-pointer text-red-500 dark:text-red-400"
                      onClick={() => deleteLog(log.id)}
                    ></i>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-4 md:flex md:items-center md:justify-between">
        <div>
          {t('components.pagination.text1')}
          <select
            value={pagination.perPage}
            onChange={(e) =>
              setPagination((prev) => ({ ...prev, perPage: Number(e.target.value) }))
            }
            className="bg-input rounded-md p-1"
          >
            {[10, 15, 25, 50, 100].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
          {t('components.pagination.text2', { count: filteredLogs.length })}
        </div>
        {/* TODO: replace with ui-pagination component */}
        <div className="mt-4 flex gap-2 md:mt-0">
          <button
            disabled={pagination.currentPage <= 1}
            onClick={() =>
              setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))
            }
          >
            &laquo;
          </button>
          <span>{pagination.currentPage}</span>
          <button
            disabled={pagination.currentPage * pagination.perPage >= filteredLogs.length}
            onClick={() =>
              setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))
            }
          >
            &raquo;
          </button>
        </div>
      </div>

      {/* Selected logs action card */}
      {selectedLogs.length > 0 && (
        <div className="fixed bottom-0 right-0 m-5 space-x-2 rounded-lg bg-white p-4 shadow-xl dark:bg-gray-800">
          <button onClick={selectAllLogs}>
            {t(`log.${selectedLogs.length >= logs.length ? 'deselectAll' : 'selectAll'}`)}
          </button>
          <button
            className="text-red-500 dark:text-red-400"
            onClick={deleteSelectedLogs}
          >
            {t('log.deleteSelected')} ({selectedLogs.length})
          </button>
        </div>
      )}

      {/* Export data modal */}
      {exportDataModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-w-2xl rounded-lg bg-white p-6 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <span className="capitalize">{t('common.data')}</span>
              <button onClick={() => setExportDataModal((prev) => ({ ...prev, show: false }))}>
                <i className="ri-close-line"></i>
              </button>
            </div>
            {/* TODO: <LogsDataViewer log={exportDataModal.log} editorClass="logs-list-data" /> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLogsItems;
