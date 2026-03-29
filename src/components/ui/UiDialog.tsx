import React, { useState, useEffect, useCallback } from 'react';
import UiModal from './UiModal';
import UiInput from './UiInput';
import UiButton from './UiButton';

export interface DialogOptions {
  body?: string;
  title?: string;
  label?: string;
  html?: boolean;
  onCancel?: ((param: boolean) => boolean | Promise<boolean> | void) | null;
  onConfirm?: ((param: string | boolean) => boolean | Promise<boolean> | void) | null;
  placeholder?: string;
  inputType?: string;
  showLoading?: boolean;
  okVariant?: string;
  okText?: string;
  cancelText?: string;
  async?: boolean;
  inputValue?: string;
  custom?: boolean;
}

export interface ShowDialogEvent {
  type: 'confirm' | 'prompt' | string;
  options: DialogOptions;
}

// Minimal event emitter for cross-component communication (mirrors Vue's mitt usage)
type DialogListener = (event: ShowDialogEvent) => void;
const listeners = new Set<DialogListener>();

export const dialogEmitter = {
  on(fn: DialogListener) { listeners.add(fn); },
  off(fn: DialogListener) { listeners.delete(fn); },
  emit(event: ShowDialogEvent) { listeners.forEach((fn) => fn(event)); },
};

const defaultOptions: Required<DialogOptions> = {
  body: '',
  title: '',
  label: '',
  html: false,
  onCancel: null,
  onConfirm: null,
  placeholder: '',
  inputType: 'text',
  showLoading: false,
  okVariant: 'accent',
  okText: 'Confirm',
  cancelText: 'Cancel',
  async: false,
  inputValue: '',
  custom: false,
};

function throttle<T extends (...args: unknown[]) => void>(fn: T, wait: number): T {
  let last = 0;
  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn.apply(this, args);
    }
  } as T;
}

interface UiDialogProps {
  /** Optional: render custom slot content for a given dialog type */
  customSlot?: (type: string, options: DialogOptions) => React.ReactNode;
}

export default function UiDialog({ customSlot }: UiDialogProps) {
  const [type, setType] = useState('');
  const [input, setInput] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [options, setOptions] = useState<Required<DialogOptions>>(defaultOptions);

  function destroy() {
    setInput('');
    setShow(false);
    setShowPassword(false);
    setOptions(defaultOptions);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fireCallback = useCallback(
    throttle((cbType: 'onConfirm' | 'onCancel') => {
      const callback = options[cbType] as ((param: string | boolean) => boolean | Promise<boolean> | void) | null;
      const param = type === 'prompt' ? input : true;

      if (callback) {
        const isAsync = options.async;
        if (isAsync) setLoading(true);

        const cbReturn = callback(param);

        // undefined/void return → treat as "close"
        if (cbReturn === undefined) {
          destroy();
          return;
        }

        if (typeof cbReturn === 'boolean') {
          if (cbReturn) destroy();
          setLoading(false);
          return;
        }
        if (isAsync && (cbReturn as Promise<boolean>)?.then) {
          (cbReturn as Promise<boolean>).then((value) => {
            if (value) destroy();
            setLoading(false);
          });
          return;
        }
        destroy();
      } else {
        destroy();
      }
    }, 200),
    [options, type, input]
  );

  useEffect(() => {
    function handleShowDialog(event: ShowDialogEvent) {
      setType(event.type);
      setInput(event.options?.inputValue ?? '');
      setOptions({ ...defaultOptions, ...event.options });
      setShow(true);
    }

    dialogEmitter.on(handleShowDialog);
    return () => dialogEmitter.off(handleShowDialog);
  }, []);

  useEffect(() => {
    function keyupHandler(e: KeyboardEvent) {
      if (e.code === 'Enter') fireCallback('onConfirm');
      else if (e.code === 'Escape') fireCallback('onCancel');
    }
    if (show) window.addEventListener('keyup', keyupHandler);
    return () => window.removeEventListener('keyup', keyupHandler);
  }, [show, fireCallback]);

  const inputType =
    options.inputType === 'password' && showPassword ? 'text' : options.inputType;

  return (
    <UiModal
      modelValue={show}
      contentClass="max-w-sm"
      onClose={() => { setShow(false); }}
      header={<h3 className="font-semibold">{options.title}</h3>}
    >
      {options.custom && customSlot ? (
        customSlot(type, options)
      ) : (
        <>
          <p className="leading-tight text-gray-600 dark:text-gray-200">{options.body}</p>
          {type === 'prompt' && (
            <UiInput
              modelValue={input}
              autofocus
              disabled={loading}
              placeholder={options.placeholder}
              label={options.label}
              type={inputType}
              className="w-full"
              onChange={(v) => setInput(String(v))}
              appendSlot={
                options.inputType === 'password' ? (
                  <i
                    className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} absolute right-2 cursor-pointer`}
                    onClick={() => setShowPassword((v) => !v)}
                  />
                ) : undefined
              }
            />
          )}
          <div className="mt-8 flex space-x-2">
            <UiButton className="w-6/12" onClick={() => fireCallback('onCancel')}>
              {options.cancelText}
            </UiButton>
            <UiButton
              className="w-6/12"
              loading={loading}
              variant={options.okVariant}
              onClick={() => fireCallback('onConfirm')}
            >
              {options.okText}
            </UiButton>
          </div>
        </>
      )}
    </UiModal>
  );
}
