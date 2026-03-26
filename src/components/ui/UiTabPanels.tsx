import React, { createContext, useContext } from 'react';

interface TabPanelsContextValue {
  modelValue: string | number;
  cache: boolean;
}

export const TabPanelsContext = createContext<TabPanelsContextValue>({
  modelValue: '',
  cache: false,
});

interface UiTabPanelsProps {
  modelValue?: string | number;
  cache?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export default function UiTabPanels({
  modelValue = '',
  cache = false,
  children,
  className = '',
}: UiTabPanelsProps) {
  return (
    <TabPanelsContext.Provider value={{ modelValue, cache }}>
      <div className={`ui-tab-panels ${className}`.trim()}>{children}</div>
    </TabPanelsContext.Provider>
  );
}
