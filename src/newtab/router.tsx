import { createHashRouter, Navigate } from 'react-router-dom';
import React from 'react';

import App from './App';
import Welcome from './pages/Welcome';
import Packages from './pages/Packages';
import WorkflowList from './pages/workflows/WorkflowList';
import WorkflowContainer from './pages/Workflows';
import WorkflowHost from './pages/workflows/Host';
// import WorkflowDetails from './pages/workflows/WorkflowDetail';
import WorkflowShared from './pages/workflows/Shared';
import ScheduledWorkflow from './pages/ScheduledWorkflow';
import Storage from './pages/Storage';
import StorageTables from './pages/storage/Tables';
import LogsDetails from './pages/logs/LogDetail';
import Recording from './pages/Recording';
import Settings from './pages/Settings';
import SettingsIndex from './pages/settings/SettingsIndex';
import SettingsAbout from './pages/settings/SettingsAbout';
import SettingsProfile from './pages/settings/SettingsProfile';
import SettingsShortcuts from './pages/settings/SettingsShortcuts';
import SettingsBackup from './pages/settings/SettingsBackup';
import SettingsEditor from './pages/settings/SettingsEditor';

// Placeholder for WorkflowDetails (too large for this batch)
const WorkflowDetails: React.FC = () => <div>Workflow Details (TODO)</div>;

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/workflows" replace />,
      },
      {
        path: 'welcome',
        element: <Welcome />,
      },
      {
        path: 'packages',
        element: <Packages />,
      },
      {
        path: 'recording',
        element: <Recording />,
      },
      {
        path: 'packages/:id',
        element: <WorkflowDetails />,
      },
      {
        path: 'workflows',
        element: <WorkflowContainer />,
        children: [
          {
            index: true,
            element: <WorkflowList />,
          },
          {
            path: ':id',
            element: <WorkflowDetails />,
          },
          {
            path: ':id/host',
            element: <WorkflowHost />,
          },
          {
            path: ':id/shared',
            element: <WorkflowShared />,
          },
        ],
      },
      {
        path: 'teams/:teamId/workflows/:id',
        element: <WorkflowDetails />,
      },
      {
        path: 'schedule',
        element: <ScheduledWorkflow />,
      },
      {
        path: 'storage',
        element: <Storage />,
      },
      {
        path: 'storage/tables/:id',
        element: <StorageTables />,
      },
      {
        path: 'logs/:id?',
        element: <LogsDetails />,
      },
      {
        path: 'settings',
        element: <Settings />,
        children: [
          { index: true, element: <SettingsIndex /> },
          { path: 'profile', element: <SettingsProfile /> },
          { path: 'about', element: <SettingsAbout /> },
          { path: 'backup', element: <SettingsBackup /> },
          { path: 'editor', element: <SettingsEditor /> },
          { path: 'shortcuts', element: <SettingsShortcuts /> },
        ],
      },
    ],
  },
]);

export default router;
