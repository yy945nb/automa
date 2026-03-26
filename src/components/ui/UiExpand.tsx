import React, { useState, useEffect, useRef } from 'react';

interface UiExpandProps {
  modelValue?: boolean;
  panelClass?: string;
  headerClass?: string;
  headerActiveClass?: string;
  activeClass?: string;
  hideHeaderIcon?: boolean;
  disabled?: boolean;
  appendIcon?: boolean;
  onChange?: (value: boolean) => void;
  /** Slot: header content — receives show state */
  headerSlot?: (show: boolean) => React.ReactNode;
  children?: React.ReactNode;
}

export default function UiExpand({
  modelValue = true,
  panelClass = '',
  headerClass = 'px-4 py-2 w-full flex items-center h-full',
  headerActiveClass = '',
  activeClass = '',
  hideHeaderIcon = false,
  disabled = false,
  appendIcon = false,
  onChange,
  headerSlot,
  children,
}: UiExpandProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (modelValue !== show) {
      setShow(modelValue);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelValue]);

  useEffect(() => {
    if (disabled) setShow(false);
  }, [disabled]);

  function toggleExpand() {
    if (disabled) return;
    const next = !show;
    setShow(next);
    onChange?.(next);
  }

  const arrowRotate = show ? 90 : -90;

  return (
    <div
      aria-expanded={show}
      className={`ui-expand ${show ? activeClass : ''}`.trim()}
    >
      <button
        className={[headerClass, show ? headerActiveClass : ''].filter(Boolean).join(' ')}
        onClick={toggleExpand}
      >
        {!hideHeaderIcon && !appendIcon && (
          <i
            className="ri-arrow-left-s-line mr-2 -ml-1 transition-transform"
            style={{ transform: `rotate(${arrowRotate}deg)` }}
          />
        )}
        {headerSlot?.(show)}
        {appendIcon && (
          <i
            className="ri-arrow-left-s-line -mr-1 ml-2 transition-transform"
            style={{ transform: `rotate(${arrowRotate}deg)` }}
          />
        )}
      </button>
      {show && (
        <div className={`ui-expand__panel ${panelClass}`.trim()}>
          {children}
        </div>
      )}
    </div>
  );
}
