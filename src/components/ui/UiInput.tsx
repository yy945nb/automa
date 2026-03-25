import React, { useId } from 'react';

const statusColors: Record<string, string> = {
  error: 'ring-red-400 ring-2 focus:ring-red-400 focus:ring-2',
};

interface UiInputProps {
  modelValue?: string | number;
  disabled?: boolean;
  readonly?: boolean;
  autofocus?: boolean;
  inputClass?: string;
  prependIcon?: string;
  label?: string;
  list?: string;
  type?: string;
  placeholder?: string;
  max?: string | number;
  min?: string | number;
  autocomplete?: string;
  step?: string;
  status?: string;
  onChange?: (value: string | number) => void;
  onKeydown?: (e: React.KeyboardEvent) => void;
  onKeyup?: (e: React.KeyboardEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  /** Slot: label content */
  labelSlot?: React.ReactNode;
  /** Slot: prepend content */
  prependSlot?: React.ReactNode;
  /** Slot: append content */
  appendSlot?: React.ReactNode;
  className?: string;
}

export default function UiInput({
  modelValue = '',
  disabled = false,
  readonly = false,
  autofocus = false,
  inputClass = '',
  prependIcon = '',
  label = '',
  list,
  type = 'text',
  placeholder = '',
  max,
  min,
  autocomplete,
  step,
  status = '',
  onChange,
  onKeydown,
  onKeyup,
  onBlur,
  onFocus,
  labelSlot,
  prependSlot,
  appendSlot,
  className = '',
}: UiInputProps) {
  const componentId = useId();

  function emitValue(event: React.FormEvent<HTMLInputElement>) {
    const value = (event.target as HTMLInputElement).value;
    onChange?.(value);
  }

  const hasPrepend = prependIcon || prependSlot;

  const inputClasses = [
    'bg-input w-full rounded-lg bg-transparent py-2 px-4 transition',
    statusColors[status] ?? '',
    inputClass,
    disabled ? 'opacity-75 pointer-events-none' : '',
    hasPrepend ? 'pl-10' : '',
    list ? 'appearance-none' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`input-ui inline-block ${className}`}>
      {(label || labelSlot) && (
        <label
          htmlFor={componentId}
          className="ml-1 inline-block text-sm leading-none text-gray-600 dark:text-gray-200"
        >
          {labelSlot ?? label}
        </label>
      )}
      <div className="relative flex w-full items-center">
        {prependSlot ?? (
          prependIcon ? (
            <i
              className={`${prependIcon} absolute left-0 ml-2 text-gray-600 dark:text-gray-200`}
            />
          ) : null
        )}
        <input
          id={componentId}
          readOnly={disabled || readonly || undefined}
          placeholder={placeholder}
          type={type}
          autoComplete={autocomplete ?? undefined}
          autoFocus={autofocus}
          min={min !== null ? min : undefined}
          max={max !== null ? max : undefined}
          list={list ?? undefined}
          step={step ?? undefined}
          className={inputClasses}
          value={modelValue}
          onKeyDown={onKeydown}
          onKeyUp={onKeyup}
          onBlur={onBlur}
          onFocus={onFocus}
          onInput={emitValue}
          onChange={() => {/* controlled via onInput */}}
        />
        {appendSlot}
      </div>
      <style>{`
        .input-ui input[type='color'] {
          padding-top: 0 !important;
          padding-bottom: 0 !important;
        }
      `}</style>
    </div>
  );
}
