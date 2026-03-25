import React, { useState, useEffect, useRef } from 'react';
import UiCard from './UiCard';
import { createPortal } from 'react-dom';

interface UiModalProps {
  modelValue?: boolean;
  contentClass?: string;
  title?: string;
  padding?: string;
  contentPosition?: 'center' | 'start';
  customContent?: boolean;
  persist?: boolean;
  blur?: boolean;
  disabledTeleport?: boolean;
  onClose?: () => void;
  /** Slot: activator — receives open callback */
  activator?: (open: () => void) => React.ReactNode;
  /** Slot: header content */
  header?: React.ReactNode;
  /** Slot: header-append content */
  headerAppend?: React.ReactNode;
  /** children receives close callback if needed */
  children?: React.ReactNode | ((close: () => void) => React.ReactNode);
}

const positions: Record<string, string> = {
  center: 'items-center',
  start: 'items-start',
};

export default function UiModal({
  modelValue = false,
  contentClass = 'max-w-lg',
  title = '',
  padding = 'p-4',
  contentPosition = 'center',
  customContent = false,
  persist = false,
  blur = false,
  disabledTeleport = false,
  onClose,
  activator,
  header,
  headerAppend,
  children,
}: UiModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(modelValue);
  }, [modelValue]);

  useEffect(() => {
    function keyupHandler(e: KeyboardEvent) {
      if (e.code === 'Escape') closeModal();
    }
    if (show) {
      window.addEventListener('keyup', keyupHandler);
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      window.removeEventListener('keyup', keyupHandler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  function closeModal() {
    if (persist) return;
    setShow(false);
    onClose?.();
  }

  const modalContent = show ? (
    <div
      className={`modal-ui__content-container z-50 flex justify-center overflow-y-auto ${positions[contentPosition] ?? 'items-center'}`}
      style={{ backdropFilter: blur ? 'blur(2px)' : undefined }}
    >
      <div
        className="absolute h-full w-full bg-black bg-opacity-20 dark:bg-opacity-60"
        style={{ zIndex: -2 }}
        onClick={closeModal}
      />
      {customContent ? (
        children
      ) : (
        <UiCard
          className={`modal-ui__content w-full shadow-lg ${contentClass}`}
          padding={padding}
        >
          <div className="modal-ui__content-header mb-4">
            <div className="flex items-center justify-between">
              <span className="content-header">{header ?? title}</span>
              {headerAppend}
              {!persist && (
                <i
                  className="ri-close-line cursor-pointer text-gray-600 dark:text-gray-300"
                  style={{ fontSize: '20px' }}
                  onClick={closeModal}
                />
              )}
            </div>
          </div>
          {typeof children === 'function' ? children(closeModal) : children}
        </UiCard>
      )}
      <style>{`
        .modal-ui__content-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  ) : null;

  return (
    <div className="modal-ui">
      {activator && (
        <div className="modal-ui__activator">
          {activator(() => setShow(true))}
        </div>
      )}
      {disabledTeleport
        ? modalContent
        : typeof document !== 'undefined'
        ? createPortal(modalContent, document.body)
        : null}
    </div>
  );
}
