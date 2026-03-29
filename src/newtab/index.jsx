import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import '../assets/css/tailwind.css';
import '../assets/css/fonts.css';
import '../assets/css/style.css';
import '../assets/css/flow.css';

const container = document.getElementById('app');
const root = createRoot(container);
root.render(
  <HashRouter>
    <App />
  </HashRouter>
);

if (module.hot) module.hot.accept();
