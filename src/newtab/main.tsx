import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { initI18n } from '../lib/i18n';
import '../assets/css/tailwind.css';
import '../assets/css/fonts.css';
import '../assets/css/style.css';
import '../assets/css/flow.css';

// Initialize i18n before rendering
initI18n().then(() => {
  const container = document.getElementById('app');
  if (!container) throw new Error('Root element #app not found');
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
});
