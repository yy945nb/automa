import React, { useState, useRef, useEffect } from 'react';

interface UiPopoverProps {
  placement?: string;
  trigger?: string;
  padding?: string;
  disabled?: boolean;
  triggerWidth?: boolean;
  modelValue?: boolean;
  triggerClass?: string;
  className?: string;
  onShow?: () => void;
  onClose?: () => void;
  onTrigger?: () => void;
  onChange?: (value: boolean) => void;
  /** Trigger slot — receives isShow */
  triggerSlot?: (isShow: boolean) => React.ReactNode;
  children?: React.ReactNode;
}

/**
 * UiPopover — React implementation using a simple click-outside dropdown.
 * The Vue original uses Tippy.js; this version provides the same API surface
 * with a lightweight built-in solution. Swap `createTippy` usage if needed.
 */
export default function UiPopover({
  placement = 'bottom',
  trigger = 'click',
  padding = 'p-4',
  disabled = false,
  triggerWidth = false,
  modelValue,
  triggerClass,
  className = '',
  onShow,
  onClose,
  onTrigger,
  onChange,
  triggerSlot,
  children,
}: UiPopoverProps) {
  const [isShow, setIsShow] = useState(modelValue ?? false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Sync external modelValue
  useEffect(() => {
    if (modelValue !== undefined && modelValue !== isShow) {
      setIsShow(modelValue);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelValue]);

  // Close on click-outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        hide();
      }
    }
    if (trigger === 'click' && isShow) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShow, trigger]);

  // Keep content width in sync with trigger when triggerWidth is set
  useEffect(() => {
    if (isShow && triggerWidth && triggerRef.current && contentRef.current) {
      contentRef.current.style.width = `${triggerRef.current.getBoundingClientRect().width}px`;
    }
  }, [isShow, triggerWidth]);

  function show() {
    if (disabled) return;
    setIsShow(true);
    onShow?.();
    onTrigger?.();
    onChange?.(true);
  }

  function hide() {
    setIsShow(false);
    onClose?.();
    onChange?.(false);
  }

  function handleTriggerClick() {
    if (trigger === 'click') {
      isShow ? hide() : show();
    }
  }

  function handleTriggerMouseEnter() {
    if (trigger === 'mouseenter') show();
  }

  function handleTriggerMouseLeave() {
    if (trigger === 'mouseenter') hide();
  }

  // Simple placement mapping to CSS positioning
  const placementStyles: React.CSSProperties = (() => {
    switch (placement) {
      case 'top':
        return { bottom: '100%', left: 0, marginBottom: '4px' };
      case 'bottom-end':
        return { top: '100%', right: 0, marginTop: '4px' };
      case 'top-end':
        return { bottom: '100%', right: 0, marginBottom: '4px' };
      case 'left':
        return { right: '100%', top: 0, marginRight: '4px' };
      case 'right':
        return { left: '100%', top: 0, marginLeft: '4px' };
      default: // bottom
        return { top: '100%', left: 0, marginTop: '4px' };
    }
  })();

  return (
    <div
      ref={containerRef}
      className={`ui-popover inline-block relative ${className}`.trim()}
    >
      <div
        ref={triggerRef}
        className={`ui-popover__trigger inline-block h-full ${triggerClass ?? ''}`.trim()}
        onClick={handleTriggerClick}
        onMouseEnter={handleTriggerMouseEnter}
        onMouseLeave={handleTriggerMouseLeave}
      >
        {triggerSlot?.(isShow)}
      </div>
      {isShow && !disabled && (
        <div
          ref={contentRef}
          className={`ui-popover__content absolute z-50 rounded-lg border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 ${padding}`}
          style={placementStyles}
        >
          {children}
        </div>
      )}
    </div>
  );
}
