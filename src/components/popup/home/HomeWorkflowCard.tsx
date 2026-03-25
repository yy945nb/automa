import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
// TODO: import dayjs from '@/lib/dayjs'

interface Workflow {
  id: string;
  name: string;
  createdAt: string | number;
  isDisabled?: boolean;
  isProtected?: boolean;
  [key: string]: any;
}

interface HomeWorkflowCardProps {
  workflow?: Workflow;
  tab?: string;
  pinned?: boolean;
  onExecute?: (workflow: Workflow) => void;
  onTogglePin?: () => void;
  onRename?: (workflow: Workflow) => void;
  onDetails?: (workflow: Workflow) => void;
  onDelete?: (workflow: Workflow) => void;
  onUpdate?: (payload: Record<string, any>) => void;
}

const menu = [
  { name: 'rename', icon: 'ri-pencil-line' },
  { name: 'delete', icon: 'ri-delete-bin-7-line' },
];

// TODO: replace with real dayjs
function formatDate(date: string | number) {
  return new Date(date).toLocaleDateString();
}

const HomeWorkflowCard: React.FC<HomeWorkflowCardProps> = ({
  workflow = {} as Workflow,
  tab = 'local',
  pinned = false,
  onExecute,
  onTogglePin,
  onRename,
  onDetails,
  onDelete,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const filteredMenu = useMemo(
    () =>
      menu.filter(({ name }) => {
        if (name === 'rename' && tab !== 'local') return false;
        return true;
      }),
    [tab]
  );

  function handleMenuAction(name: string) {
    setMenuOpen(false);
    switch (name) {
      case 'rename':
        onRename?.(workflow);
        break;
      case 'delete':
        onDelete?.(workflow);
        break;
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 flex w-full items-center space-x-2 rounded-lg p-3 shadow hover:ring-2 hover:ring-gray-900">
      <div
        className="text-overflow flex-1 cursor-pointer"
        onClick={() => onDetails?.(workflow)}
      >
        <p className="text-overflow leading-tight">{workflow.name}</p>
        <p className="leading-tight text-gray-500">{formatDate(workflow.createdAt)}</p>
      </div>
      {workflow.isDisabled ? (
        <p>Disabled</p>
      ) : (
        <button title="Execute" onClick={() => onExecute?.(workflow)}>
          <i className="ri-play-line" />
        </button>
      )}
      {workflow.isProtected ? (
        <i className="ri-shield-keyhole-line text-green-600" />
      ) : (
        <div className="relative h-6">
          <button onClick={() => setMenuOpen((v) => !v)}>
            <i className="ri-more-line" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 z-20 min-w-[160px] rounded-lg bg-white shadow-lg dark:bg-gray-800"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <ul className="space-y-1 p-1">
                {tab === 'local' && (
                  <>
                    <li
                      className="flex cursor-pointer items-center rounded px-3 py-2 capitalize hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        setMenuOpen(false);
                        onUpdate?.({ isDisabled: !workflow.isDisabled });
                      }}
                    >
                      <i className="ri-toggle-line mr-2 -ml-1" />
                      <span>{t(`common.${workflow.isDisabled ? 'enable' : 'disable'}`)}</span>
                    </li>
                    <li
                      className="flex cursor-pointer items-center rounded px-3 py-2 capitalize hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => { setMenuOpen(false); onTogglePin?.(); }}
                    >
                      <i className="ri-pushpin-2-line mr-2 -ml-1" />
                      <span>{pinned ? 'Unpin workflow' : 'Pin workflow'}</span>
                    </li>
                  </>
                )}
                {filteredMenu.map((item) => (
                  <li
                    key={item.name}
                    className="flex cursor-pointer items-center rounded px-3 py-2 capitalize hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleMenuAction(item.name)}
                  >
                    <i className={`${item.icon} mr-2 -ml-1`} />
                    <span>{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomeWorkflowCard;
