import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid/non-secure';
import { parseJSON } from '@/utils/helper';

interface Tab {
  id: string;
  path: string;
  name: string;
}

const Workflows: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const tabChangingRef = useRef(false);
  const tabTitleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── helpers ─────────────────────────────────────────────

  const getTabTitle = useCallback(() => {
    if (location.pathname === '/' || location.pathname === '/workflows') {
      return 'Workflows';
    }
    return `${document.title}`.replace(' - Automa', '');
  }, [location.pathname]);

  const addTab = useCallback(
    (detail: Partial<Tab> = {}) => {
      setTabs((prev) => {
        const workflowsTab = prev.find(
          (tab) => tab.path === '/' || tab.path === '/workflows'
        );
        if (workflowsTab) {
          setActiveTab(workflowsTab.id);
          return prev;
        }

        const tabId = nanoid();
        const newTab: Tab = {
          id: tabId,
          path: '/',
          name: 'Workflows',
          ...detail,
        };
        setActiveTab(tabId);
        return [...prev, newTab];
      });
    },
    []
  );

  const closeTab = useCallback(
    (index: number, tab: Tab) => {
      setTabs((prev) => {
        if (prev.length === 1) {
          const replacement: Tab = {
            path: '/',
            id: nanoid(),
            name: 'Workflows',
          };
          if (tab.id === activeTab) setActiveTab(replacement.id);
          return [replacement];
        }

        const next = [...prev];
        next.splice(index, 1);
        if (tab.id === activeTab) {
          setActiveTab(next[0].id);
        }
        return next;
      });
    },
    [activeTab]
  );

  // ── sync activeTab → route ──────────────────────────────
  useEffect(() => {
    const tab = tabs.find((t) => t.id === activeTab);
    if (!tab) return;

    tabChangingRef.current = true;
    localStorage.setItem('activeTab', activeTab);
    navigate(tab.path, { replace: true });

    const timer = setTimeout(() => {
      tabChangingRef.current = false;
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── sync route → tab ────────────────────────────────────
  useEffect(() => {
    if (tabChangingRef.current) return;

    setTabs((prev) => {
      const index = prev.findIndex((tab) => tab.id === activeTab);
      if (index === -1) return prev;

      const duplicateTab = prev.find(
        (tab) => tab.path === location.pathname && tab.id !== activeTab
      );
      if (duplicateTab) {
        setActiveTab(duplicateTab.id);
        const next = [...prev];
        next.splice(index, 1);
        return next;
      }

      if (tabTitleTimeoutRef.current) {
        clearTimeout(tabTitleTimeoutRef.current);
      }
      tabTitleTimeoutRef.current = setTimeout(() => {
        setTabs((p) => {
          const copy = [...p];
          if (copy[index]) {
            copy[index] = {
              ...copy[index],
              path: location.pathname,
              name: getTabTitle(),
            };
          }
          return copy;
        });
      }, 1000);

      return prev;
    });
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── persist tabs ────────────────────────────────────────
  useEffect(() => {
    if (tabs.length > 0) {
      localStorage.setItem('tabs', JSON.stringify(tabs));
    }
  }, [tabs]);

  // ── initialise on mount ─────────────────────────────────
  useEffect(() => {
    const savedTabs = parseJSON(localStorage.getItem('tabs'), null) as
      | Tab[]
      | null;

    if (savedTabs && savedTabs.length > 0) {
      setTabs(savedTabs);

      const savedActive = localStorage.getItem('activeTab');
      setActiveTab(savedActive || savedTabs[0].id);

      if (/\/workflows\/.+/.test(location.pathname)) {
        const routeTab = savedTabs.find(
          (tab) => tab.path === location.pathname
        );
        if (routeTab) {
          setActiveTab(routeTab.id);
        } else {
          // Update the active tab's path
          const activeIdx = savedTabs.findIndex(
            (tab) => tab.id === (savedActive || savedTabs[0].id)
          );
          if (activeIdx !== -1) {
            const updated = [...savedTabs];
            updated[activeIdx] = {
              ...updated[activeIdx],
              path: location.pathname,
              name: getTabTitle(),
            };
            setTabs(updated);
            setTimeout(() => {
              setTabs((prev) => {
                const copy = [...prev];
                if (copy[activeIdx]) {
                  copy[activeIdx] = {
                    ...copy[activeIdx],
                    name: getTabTitle(),
                  };
                }
                return copy;
              });
            }, 1000);
          }
        }
      }
      return;
    }

    addTab({
      path: location.pathname,
      name: getTabTitle(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col" style={{ height: '100%' }}>
      {/* Tab bar */}
      <div className="flex h-10 items-center border-b dark:border-gray-700">
        <div className="scroll scroll-xs flex h-full items-center overflow-auto text-sm text-gray-600 dark:text-gray-300">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              className={`hoverable flex h-full cursor-default items-center border-b-2 px-4 focus:ring-0 ${
                activeTab === tab.id
                  ? 'border-accent bg-box-transparent text-black dark:border-accent dark:text-gray-100'
                  : 'border-transparent dark:border-transparent'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <p
                title={tab.name}
                className="text-overflow mr-2 max-w-[170px] flex-1"
              >
                {tab.name}
              </p>
              <span
                className="hoverable rounded-full p-0.5 text-gray-600 dark:text-gray-300"
                title="Close tab"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(index, tab);
                }}
              >
                <span
                  className="remix-icon"
                  data-icon="riCloseLine"
                  style={{ fontSize: 20 }}
                />
              </span>
            </button>
          ))}
        </div>
        <button className="h-full px-2" onClick={() => addTab()}>
          <span className="remix-icon" data-icon="riAddLine" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default Workflows;
