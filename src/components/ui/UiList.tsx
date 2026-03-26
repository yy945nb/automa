import React from 'react';

interface UiListProps {
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function UiList({ disabled = false, className = '', children }: UiListProps) {
  return (
    <div
      role="listbox"
      className={`ui-list ${disabled ? 'pointer-events-none' : ''} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
