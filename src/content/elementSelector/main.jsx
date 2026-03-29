import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import injectAppStyles from '../injectAppStyles';
import '@/assets/css/tailwind.css';

export default function (rootElement) {
  const appRoot = document.createElement('div');
  appRoot.setAttribute('id', 'app');

  rootElement.shadowRoot.appendChild(appRoot);

  injectAppStyles(rootElement.shadowRoot).then(() => {
    const root = createRoot(appRoot);
    root.render(<App rootElement={rootElement} />);
  });
}
