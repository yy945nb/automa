import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
// TODO: replace with React state/context (Pinia: useUserStore, useWorkflowStore)
// TODO: replace with React Router (Link, useNavigate, useLocation)
// TODO: replace emitter with React context or event bus (emitter from '@/lib/mitt')
// TODO: replace with browser extension API (webextension-polyfill)
// TODO: replace shortcut handling with useHotkeys or similar
// TODO: import { communities } from '@/utils/shared'
// TODO: import { initElementSelector } from '@/newtab/utils/elementSelector'

interface Tab {
  id: string;
  icon: string;
  path: string;
  shortcut?: string;
}

interface Community {
  name: string;
  url: string;
  icon: string;
}

// TODO: replace with actual communities from '@/utils/shared'
const communities: Community[] = [
  { name: 'Discord', url: 'https://discord.gg/C6khwwTE84', icon: 'ri-discord-line' },
  { name: 'Reddit', url: 'https://www.reddit.com/r/AutomaApp', icon: 'ri-reddit-line' },
  { name: 'Twitter', url: 'https://twitter.com/AutomaApp', icon: 'ri-twitter-line' },
];

const tabs: Tab[] = [
  { id: 'workflow', icon: 'ri-flow-chart', path: '/workflows' },
  { id: 'packages', icon: 'mdi-package-variant-closed', path: '/packages' },
  { id: 'schedule', icon: 'ri-time-line', path: '/schedule' },
  { id: 'storage', icon: 'ri-hard-drive-2-line', path: '/storage' },
  { id: 'log', icon: 'ri-history-line', path: '/logs' },
  { id: 'settings', icon: 'ri-settings-3-line', path: '/settings' },
];

const AppSidebar: React.FC = () => {
  const { t } = useTranslation();

  // TODO: replace with actual browser.runtime.getManifest().version
  const extensionVersion = '0.0.0';

  // TODO: replace with useUserStore()
  const userStore = { user: null as null | { avatar_url: string } };

  // TODO: replace with useWorkflowStore()
  const runningWorkflowsLen = 0; // workflowStore.getAllStates.length

  const [showHoverIndicator, setShowHoverIndicator] = useState(false);
  const [communitiesOpen, setCommunitiesOpen] = useState(false);
  const hoverIndicatorRef = useRef<HTMLDivElement>(null);

  // TODO: replace with useLocation() from React Router
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/workflows';

  const hoverHandler = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      setShowHoverIndicator(true);
      if (hoverIndicatorRef.current) {
        hoverIndicatorRef.current.style.transform = `translate(-50%, ${
          (e.currentTarget as HTMLElement).offsetTop
        }px)`;
      }
    },
    []
  );

  const handleTabClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, tab: Tab) => {
      e.preventDefault();
      if (tab.id === 'log') {
        // TODO: emitter.emit('ui:logs', { show: true })
      } else {
        // TODO: navigate(tab.path)
        window.location.pathname = tab.path;
      }
    },
    []
  );

  const injectElementSelector = useCallback(async () => {
    try {
      // TODO: replace with actual browser.tabs.query and initElementSelector()
      // const [tab] = await browser.tabs.query({ active: true, url: '*://*/*' });
      // if (!tab) { toast.error(t('home.elementSelector.noAccess')); return; }
      // await initElementSelector();
    } catch (error) {
      console.error(error);
    }
  }, [t]);

  // TODO: replace with useShortcut hook
  // useEffect(() => {
  //   tabs shortcut setup here
  // }, []);

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-16 flex-col items-center bg-white py-6 dark:bg-gray-800">
      {/* Logo */}
      {/* TODO: replace src with require/import of '@/assets/svg/logo.svg' */}
      <img
        title={`v${extensionVersion}`}
        src="/assets/svg/logo.svg"
        className="mx-auto mb-4 w-10"
        alt="Automa logo"
      />

      {/* Navigation tabs */}
      <div
        className="relative w-full space-y-2 text-center"
        onMouseLeave={() => setShowHoverIndicator(false)}
      >
        {/* Hover indicator */}
        <div
          ref={hoverIndicatorRef}
          className="bg-box-transparent absolute left-1/2 h-10 w-10 rounded-lg transition-transform duration-200"
          style={{
            display: showHoverIndicator ? '' : 'none',
            transform: 'translate(-50%, 0)',
          }}
        ></div>

        {tabs.map((tab) => {
          const isActive = currentPath.startsWith(tab.path);
          return (
            <a
              key={tab.id}
              title={`${t(`common.${tab.id}`, { count: 2 })}${tab.shortcut ? ` (${tab.shortcut})` : ''}`}
              href={tab.id === 'log' ? '#' : tab.path}
              className={[
                'tab relative z-10 flex w-full items-center justify-center',
                isActive ? 'is-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={(e) => handleTabClick(e, tab)}
              onMouseEnter={hoverHandler}
            >
              <div className="inline-block rounded-lg p-2 transition-colors">
                <i className={tab.icon}></i>
              </div>
              {tab.id === 'log' && runningWorkflowsLen > 0 && (
                <span className="absolute -top-1 right-2 h-4 w-4 rounded-full bg-accent text-xs text-white dark:text-black">
                  {runningWorkflowsLen}
                </span>
              )}
            </a>
          );
        })}
      </div>

      <hr className="my-4 w-8/12" />

      {/* Element selector */}
      <button
        title={t('home.elementSelector.name')}
        className="focus:ring-0"
        onClick={injectElementSelector}
      >
        <i className="ri-focus-3-line"></i>
      </button>

      <div className="grow"></div>

      {/* User avatar */}
      {userStore.user && (
        // TODO: replace with <Link to="/profile">
        <a
          href="/profile"
          title={t('settings.menu.profile')}
          className="bg-box-transparent my-2 inline-block rounded-full p-1 transition-transform hover:scale-110"
        >
          <img
            src={userStore.user.avatar_url}
            height={32}
            width={32}
            className="rounded-full"
            alt="User avatar"
          />
        </a>
      )}

      {/* Communities popover */}
      <div className="relative my-4">
        <button
          title={t('home.communities')}
          onMouseEnter={() => setCommunitiesOpen(true)}
          onMouseLeave={() => setCommunitiesOpen(false)}
        >
          <i className="ri-group-line"></i>
        </button>
        {communitiesOpen && (
          <div
            className="absolute left-full ml-2 top-0 z-50 w-40 rounded-lg bg-white p-2 shadow-lg dark:bg-gray-800"
            onMouseEnter={() => setCommunitiesOpen(true)}
            onMouseLeave={() => setCommunitiesOpen(false)}
          >
            <p className="mb-2">{t('home.communities')}</p>
            <ul className="space-y-1">
              {communities.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <i className={`${item.icon} mr-2`}></i>
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* About link */}
      {/* TODO: replace with <Link to="/about"> */}
      <a href="/about" title={t('settings.menu.about')}>
        <i className="ri-information-line cursor-pointer"></i>
      </a>
    </aside>
  );
};

export default AppSidebar;
