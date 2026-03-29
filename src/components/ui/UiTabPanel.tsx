import React, { useContext } from 'react';
import { TabPanelsContext } from './UiTabPanels';

interface UiTabPanelProps {
  value?: string | number;
  activeClass?: string;
  cache?: boolean;
  children?: React.ReactNode;
}

export default function UiTabPanel({
  value = '',
  activeClass = 'ui-tab-panel--active',
  cache: ownCache,
  children,
}: UiTabPanelProps) {
  const { modelValue, cache: contextCache } = useContext(TabPanelsContext);
  const isActive = value === modelValue;
  const shouldCache = ownCache !== undefined ? ownCache : contextCache;

  if (!shouldCache && !isActive) return null;

  return (
    <div
      className={`ui-tab-panel ${activeClass}`}
      style={{ display: shouldCache && !isActive ? 'none' : undefined }}
    >
      {children}
    </div>
  );
}
