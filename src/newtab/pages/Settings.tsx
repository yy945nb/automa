import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const menus = [
  { id: 'general', path: '/settings', icon: 'riSettings3Line' },
  { id: 'profile', path: '/settings/profile', icon: 'riUser3Line' },
  { id: 'backup', path: '/settings/backup', icon: 'riDatabase2Line' },
  { id: 'editor', path: '/settings/editor', icon: 'riMindMap' },
  { id: 'shortcuts', path: '/settings/shortcuts', icon: 'riKeyboardLine' },
  { id: 'about', path: '/settings/about', icon: 'riInformationLine' },
];

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const onSelectChanged = (e: React.ChangeEvent<HTMLSelectElement>) => {
    navigate(e.target.value);
  };

  return (
    <div className="container pt-8 pb-4">
      <h1 className="mb-10 text-2xl font-semibold">{t('common.settings')}</h1>
      <div className="flex items-start">
        <ul className="sticky top-8 mr-12 hidden w-64 space-y-2 md:block">
          {menus.map((menu) => (
            <li key={menu.id}>
              <NavLink
                to={menu.path}
                end
                className={({ isActive }) =>
                  `flex items-center rounded-lg px-4 py-2 transition ${
                    isActive ? 'bg-box-transparent' : 'text-gray-600 dark:text-gray-200'
                  }`
                }
              >
                <span className="remix-icon mr-2 -ml-1" data-icon={menu.icon} />
                {t(`settings.menu.${menu.id}`)}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="settings-content flex-1">
          <select
            value={location.pathname}
            onChange={onSelectChanged}
            className="mb-4 w-full md:hidden"
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
};

export default Settings;