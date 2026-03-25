import React, { useContext } from 'react';
import { TabsContext } from './UiTabs';

interface UiTabProps {
  value?: string | number;
  disabled?: boolean;
  children?: React.ReactNode;
}

export default function UiTab({ value = '', disabled = false, children }: UiTabProps) {
  const { modelValue, type, small, fill, updateActive, hoverHandler } = useContext(TabsContext);
  const isActive = modelValue === value;

  const classes = [
    'ui-tab z-[1] transition-colors focus:ring-0',
    type,
    disabled ? 'pointer-events-none opacity-75' : '',
    small ? 'small' : '',
    fill ? 'flex-1' : '',
    isActive ? 'is-active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      aria-selected={isActive}
      role="tab"
      tabIndex={isActive ? 0 : -1}
      onMouseEnter={hoverHandler}
      onClick={() => updateActive(value)}
    >
      {children}
      <style>{`
        .ui-tab {
          z-index: 1;
          padding: 0.75rem 0.5rem;
          border-bottom: 2px solid transparent;
        }
        .ui-tab.small {
          padding: 0.5rem;
        }
        .ui-tab.fill {
          border-radius: 0.5rem;
          border-bottom: none;
          padding: 0.5rem 1rem;
        }
        .ui-tab.fill.small {
          padding: 0.5rem;
        }
        .ui-tab.is-active {
          border-color: var(--accent-color, #6366f1);
          color: #1f2937;
        }
        .ui-tab.is-active.fill {
          background-color: rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </button>
  );
}
