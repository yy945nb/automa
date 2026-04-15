import React from 'react';
import { createRoot } from 'react-dom/client';
import ElementSelectorApp from './App';
import '@/assets/css/tailwind.css';

export default function mountElementSelector(rootElement: HTMLElement) {
  const appRoot = document.createElement('div');
  appRoot.setAttribute('id', 'app');

  rootElement.shadowRoot!.appendChild(appRoot);

  const root = createRoot(appRoot);
  root.render(<ElementSelectorApp rootElement={rootElement} />);

  return root;
}
