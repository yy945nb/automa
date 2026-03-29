import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const menus = [
  { id: 'general', path: '/settings', icon: 'ri-settings-3-line' },
  { id: 'profile', path: '/settings/profile', icon: 'ri-user-3-line' },
  { id: 'backup', path: '/settings/backup', icon: 'ri-database-2-line' },
  { id: 'editor', path: '/settings/editor', icon: 'ri-code-s-slash-line' },
  { id: 'shortcuts', path: '/settings/shortcuts', icon: 'ri-keyboard-line' },
  { id: 'about', path: '/settings/about', icon: 'ri-information-line' },
];

export default function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="container pt-8 pb-4">
      <h1 className="mb-10 text-2xl font-semibold">{t('common.settings')}</h1>
      <div className="flex items-start">
        <nav className="sticky top-8 mr-12 hidden w-64 space-y-2 md:block">
          {menus.map((menu) => (
            <NavLink
              key={menu.id}
              to={menu.path}
              end={menu.path === '/settings'}
              className={({ isActive }) =>
                `flex items-center rounded-lg p-2 ${
                  isActive
                    ? 'bg-box-transparent'
                    : 'text-gray-600 dark:text-gray-200 hoverable'
                }`
              }
            >
              <i className={`${menu.icon} mr-2 -ml-1`} />
              {t(`settings.menu.${menu.id}`)}
            </NavLink>
          ))}
        </nav>
        <div className="settings-content flex-1">
          <select
            className="mb-4 w-full md:hidden"
            onChange={(e) => navigate(e.target.value)}
          >
            {menus.map((menu) => (
              <option key={menu.id} value={menu.path}>
                {t(`settings.menu.${menu.id}`)}
              </option>
            ))}
          </select>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
