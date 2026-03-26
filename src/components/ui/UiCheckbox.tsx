import React, { useState, useEffect, useRef } from 'react';

interface UiCheckboxProps {
  modelValue?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  block?: boolean;
  onChange?: (checked: boolean) => void;
  children?: React.ReactNode;
}

export default function UiCheckbox({
  modelValue = false,
  indeterminate = false,
  disabled,
  block,
  onChange,
  children,
}: UiCheckboxProps) {
  function changeHandler(e: React.ChangeEvent<HTMLInputElement>) {
    onChange?.(e.target.checked);
  }

  const iconName = indeterminate ? 'ri-subtract-line' : 'ri-check-line';

  return (
    <label className={`checkbox-ui items-center ${block ? 'flex' : 'inline-flex'}`}>
      <div
        className={`relative inline-block h-5 w-5 rounded focus-within:ring-2 focus-within:ring-accent ${
          disabled ? 'pointer-events-none opacity-75' : ''
        }`}
      >
        <input
          type="checkbox"
          className={`checkbox-ui__input opacity-0 ${indeterminate ? 'indeterminate' : ''}`}
          checked={modelValue}
          disabled={disabled ?? false}
          onChange={changeHandler}
        />
        <div className="bg-input checkbox-ui__mark absolute top-0 left-0 cursor-pointer rounded border dark:border-gray-700">
          <span className={`${iconName} text-white dark:text-black`} />
        </div>
      </div>
      {children != null && (
        <span className="ml-2 inline-block">{children}</span>
      )}
      <style>{`
        .checkbox-ui__input:checked ~ .checkbox-ui__mark span,
        .checkbox-ui__input.indeterminate ~ .checkbox-ui__mark span {
          transform: scale(1) !important;
        }
        .checkbox-ui span {
          transform: scale(0);
        }
        .checkbox-ui__input:checked ~ .checkbox-ui__mark,
        .checkbox-ui__input.indeterminate ~ .checkbox-ui__mark {
          background-color: var(--accent-color, #6366f1);
          border-color: var(--accent-color, #6366f1);
        }
        .checkbox-ui__mark {
          width: 100%;
          height: 100%;
          transition-property: background-color, border-color;
          transition-timing-function: ease;
          transition-duration: 200ms;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .checkbox-ui__mark span {
          transform: scale(0) !important;
          transition: transform 200ms ease;
        }
      `}</style>
    </label>
  );
}
