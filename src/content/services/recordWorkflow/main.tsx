import React from 'react';
import { createRoot } from 'react-dom/client';
import RecordWorkflowApp from './App';
import injectAppStyles from '../../injectAppStyles';

const additionalStyle = `
  .hoverable:hover { background-color: rgba(0, 0, 0, 0.1) }
`;

export default function mountRecordWorkflow(rootElement: HTMLElement) {
  injectAppStyles(rootElement);

  const style = document.createElement('style');
  style.textContent = additionalStyle;
  rootElement.shadowRoot!.appendChild(style);

  const appRoot = document.createElement('div');
  appRoot.setAttribute('id', 'app');
  rootElement.shadowRoot!.appendChild(appRoot);

  const root = createRoot(appRoot);
  root.render(<RecordWorkflowApp />);

  return root;
}
