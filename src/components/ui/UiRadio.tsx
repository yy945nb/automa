import React from 'react';

interface UiRadioProps {
  modelValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  children?: React.ReactNode;
}

export default function UiRadio({
  modelValue = '',
  value,
  onChange,
  children,
}: UiRadioProps) {
  const isChecked = value === modelValue;

  function changeHandler(e: React.ChangeEvent<HTMLInputElement>) {
    onChange?.(e.target.value);
  }

  return (
    <label className="radio-ui inline-flex items-center">
      <div className="relative inline-block h-5 w-5 rounded-full focus-within:ring-2 focus-within:ring-accent">
        <input
          type="radio"
          className="radio-ui__input opacity-0"
          value={value}
          checked={isChecked}
          onChange={changeHandler}
        />
        <div className="bg-input radio-ui__mark absolute top-0 left-0 cursor-pointer rounded-full border" />
      </div>
      {children != null && (
        <span className="ml-2 inline-block">{children}</span>
      )}
      <style>{`
        .radio-ui__input:checked ~ .radio-ui__mark {
          border-width: 6px;
          border-color: var(--accent-color, #6366f1);
        }
        .radio-ui__mark {
          width: 100%;
          height: 100%;
          transition-property: background-color, border-color;
          transition-timing-function: ease;
          transition-duration: 200ms;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </label>
  );
}
