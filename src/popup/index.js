import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '../assets/css/tailwind.css';
import '../assets/css/fonts.css';
import '../assets/css/flow.css';

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(App));
}

if (module.hot) module.hot.accept();
