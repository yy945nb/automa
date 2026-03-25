import React, { createContext, useContext, useState, useRef } from 'react';

interface TabsContextValue {
  modelValue: string | number;
  type: string;
  color: string;
  small: boolean;
  fill: boolean;
  updateActive: (id: string | number) => void;
  hoverHandler: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const TabsContext = createContext<TabsContextValue>({
  modelValue: '',
  type: 'default',
  color: 'bg-box-transparent',
  small: false,
  fill: false,
  updateActive: () => {},
  hoverHandler: () => {},
});

const tabTypes: Record<string, string> = {
  default: 'border-b',
  fill: 'p-2 rounded-lg',
};

interface UiTabsProps {
  modelValue?: string | number;
  type?: 'default' | 'fill';
  color?: string;
  small?: boolean;
  fill?: boolean;
  onChange?: (id: string | number) => void;
  children?: React.ReactNode;
  className?: string;
}

export default function UiTabs({
  modelValue = '',
  type = 'default',
  color = 'bg-box-transparent',
  small = false,
  fill = false,
  onChange,
  children,
  className = '',
}: UiTabsProps) {
  const hoverIndicatorRef = useRef<HTMLDivElement>(null);
  const [showHoverIndicator, setShowHoverIndicator] = useState(false);

  function updateActive(id: string | number) {
    onChange?.(id);
  }

  function hoverHandler(event: React.MouseEvent<HTMLButtonElement>) {
    const target = event.currentTarget;
    const isFill = type === 'fill';

    if (target.classList.contains('is-active') && isFill) {
      if (hoverIndicatorRef.current) hoverIndicatorRef.current.style.display = 'none';
      return;
    }

    const { height, width } = target.getBoundingClientRect();
    const elHeight = isFill ? height + 3 : height - 11;

    setShowHoverIndicator(true);
    if (hoverIndicatorRef.current) {
      hoverIndicatorRef.current.style.width = `${width}px`;
      hoverIndicatorRef.current.style.height = `${elHeight}px`;
      hoverIndicatorRef.current.style.display = 'inline-block';
      hoverIndicatorRef.current.style.transform = `translate(${target.offsetLeft}px, -50%)`;
    }
  }

  const tabTypeClass = tabTypes[type] ?? tabTypes['default'];

  return (
    <TabsContext.Provider value={{ modelValue, type, color, small, fill, updateActive, hoverHandler }}>
      <div
        className={`ui-tabs relative flex items-center space-x-1 text-gray-600 dark:text-gray-200 ${tabTypeClass} ${type === 'fill' ? color : ''} ${className}`.trim()}
        role="tablist"
        onMouseLeave={() => setShowHoverIndicator(false)}
      >
        <div
          ref={hoverIndicatorRef}
          className="ui-tabs__indicator bg-box-transparent absolute left-0 z-0 rounded-lg"
          style={{
            top: '50%',
            transform: 'translate(0, -50%)',
            display: showHoverIndicator ? undefined : 'none',
          }}
        />
        {children}
      </div>
      <style>{`
        .ui-tabs__indicator {
          min-height: 24px;
          min-width: 50px;
          transition-duration: 200ms;
          transition-property: transform, width;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </TabsContext.Provider>
  );
}
