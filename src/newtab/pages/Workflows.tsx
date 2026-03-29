import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { nanoid } from 'nanoid/non-secure';
import { parseJSON } from '@/utils/helper';

interface Tab {
  id: string;
  name: string;
  path: string;
}

function getTabTitle(pathname: string): string {
  if (pathname === '/workflows' || pathname === '/') return 'Workflows';
  return document.title.replace(' - Automa', '') || 'Workflows';
}

export default function WorkflowContainer() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const tabChangingRef = useRef(false);
  const tabTitleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function addTab(detail: Partial<Tab> = {}) {
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
        path: '/workflows',
        name: 'Workflows',
        ...detail,
      };
      const next = [...prev, newTab];
      setActiveTab(tabId);
      localStorage.setItem('tabs', JSON.stringify(next));
      return next;
    });
  }

  function closeTab(index: number, tab: Tab) {
    setTabs((prev) => {
      let next: Tab[];
      if (prev.length === 1) {
        const replacement: Tab = { path: '/workflows', id: nanoid(), name: 'Workflows' };
        next = [replacement];
        setActiveTab(replacement.id);
      } else {
        next = prev.filter((_, i) => i !== index);
        if (tab.id === activeTab) {
          setActiveTab(next[0].id);
        }
      }
      localStorage.setItem('tabs', JSON.stringify(next));
      return next;
    });
  }

  // Navigate when activeTab changes
  useEffect(() => {
    if (!activeTab || tabs.length === 0) return;
    const tab = tabs.find((t) => t.id === activeTab);
    if (!tab) return;

    tabChangingRef.current = true;
    localStorage.setItem('activeTab', activeTab);
    navigate(tab.path, { replace: true });

    setTimeout(() => {
      tabChangingRef.current = false;
    }, 1000);
  }, [activeTab]);

  // Update tab path/name when route changes externally
  useEffect(() => {
    if (tabChangingRef.current || !activeTab || tabs.length === 0) return;

    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    if (currentIndex === -1) return;

    const duplicateTab = tabs.find(
      (t) => t.path === location.pathname && t.id !== activeTab
    );
    if (duplicateTab) {
      setTabs((prev) => {
        const next = prev.filter((_, i) => i !== currentIndex);
        localStorage.setItem('tabs', JSON.stringify(next));
        return next;
      });
      setActiveTab(duplicateTab.id);
      return;
    }

    if (tabTitleTimeout.current) clearTimeout(tabTitleTimeout.current);
    tabTitleTimeout.current = setTimeout(() => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === activeTab);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], path: location.pathname, name: getTabTitle(location.pathname) };
        localStorage.setItem('tabs', JSON.stringify(next));
        return next;
      });
    }, 1000);
  }, [location.pathname]);

  // Initialize tabs from localStorage on mount
  useEffect(() => {
    const savedTabs = parseJSON(localStorage.getItem('tabs'), null) as Tab[] | null;
    if (savedTabs && savedTabs.length > 0) {
      setTabs(savedTabs);
      const savedActiveTab = localStorage.getItem('activeTab');
      const initialActive = savedActiveTab || savedTabs[0].id;
      setActiveTab(initialActive);

      if (/\/workflows\/.+/.test(location.pathname)) {
        const routeTab = savedTabs.find((t) => t.path === location.pathname);
        if (routeTab) {
          setActiveTab(routeTab.id);
        } else {
          const activeIdx = savedTabs.findIndex((t) => t.id === initialActive);
          if (activeIdx !== -1) {
            setTimeout(() => {
              setTabs((prev) => {
                const next = [...prev];
                next[activeIdx] = {
                  ...next[activeIdx],
                  path: location.pathname,
                  name: getTabTitle(location.pathname),
                };
                localStorage.setItem('tabs', JSON.stringify(next));
                return next;
              });
            }, 1000);
          }
        }
      }
    } else {
      addTab({ path: location.pathname, name: getTabTitle(location.pathname) });
    }
  }, []);

  return (
    <div className="flex flex-col">
      <div className="flex h-10 items-center border-b">
        <div className="scroll scroll-xs flex h-full items-center overflow-auto text-sm text-gray-600 dark:text-gray-300">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`hoverable flex h-full cursor-default items-center border-b-2 px-4 focus:ring-0 ${
                activeTab === tab.id
                  ? 'border-accent bg-box-transparent text-black dark:text-gray-100'
                  : 'border-transparent'
              }`}
            >
              <p className="text-overflow mr-2 max-w-[170px] flex-1" title={tab.name}>
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
                <i className="ri-close-line" style={{ fontSize: '20px' }} />
              </span>
            </button>
          ))}
        </div>
        <button className="h-full px-2 hoverable" onClick={() => addTab()}>
          <i className="ri-add-line" />
        </button>
      </div>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
