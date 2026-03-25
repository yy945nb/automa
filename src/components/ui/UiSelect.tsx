import React, { useId } from 'react';

interface UiSelectProps {
  modelValue?: string | number;
  label?: string;
  prependIcon?: string;
  placeholder?: string;
  block?: boolean;
  disabled?: boolean;
  onChange?: (value: string | number) => void;
  numberModifier?: boolean;
  labelSlot?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export default function UiSelect({
  modelValue = '',
  label = '',
  prependIcon = '',
  placeholder = '',
  block = false,
  disabled = false,
  onChange,
  numberModifier = false,
  labelSlot,
  children,
  className = '',
}: UiSelectProps) {
  const selectId = useId();

  function emitValue(event: React.ChangeEvent<HTMLSelectElement>) {
    let { value } = event.target;
    const parsed: string | number = numberModifier ? Number(value) : value;
    onChange?.(parsed);
  }

  return (
    <div className={`ui-select cursor-pointer ${block ? '' : 'inline-block'} ${className}`.trim()}>
      {(label || labelSlot) && (
        <label htmlFor={selectId} className="ml-1 text-sm text-gray-600 dark:text-gray-200">
          {labelSlot ?? label}
        </label>
      )}
      <div className="ui-select__content relative flex w-full items-center">
        {prependIcon && (
          <i
            className={`${prependIcon} absolute left-0 ml-2 text-gray-600 dark:text-gray-200`}
            style={{ fontSize: '20px' }}
          />
        )}
        <select
          id={selectId}
          disabled={disabled}
          className={[
            'bg-input z-10 h-full w-full appearance-none rounded-lg bg-transparent px-4 py-2 pr-10 transition',
            prependIcon ? 'pl-8' : '',
            disabled ? 'opacity-75 pointer-events-none' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          value={modelValue}
          onChange={emitValue}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <i className="ri-arrow-drop-down-line absolute right-0 mr-2 text-gray-600 dark:text-gray-200" style={{ fontSize: '28px' }} />
      </div>
      <style>{`
        .ui-select option,
        .ui-select optgroup {
          background-color: #f3f4f6;
        }
        @media (prefers-color-scheme: dark) {
          .ui-select option,
          .ui-select optgroup {
            background-color: #374151;
          }
        }
      `}</style>
    </div>
  );
}
