import React from 'react';

interface UiSwitchProps {
  modelValue?: boolean;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
  ballSlot?: React.ReactNode;
}

export default function UiSwitch({
  modelValue = false,
  disabled = false,
  onChange,
  ballSlot,
}: UiSwitchProps) {
  function emitEvent() {
    const newValue = !modelValue;
    onChange?.(newValue);
  }

  return (
    <div
      className={`ui-switch bg-input relative inline-flex h-6 w-12 items-center justify-center rounded-full p-1 ${
        disabled ? 'pointer-events-none opacity-50' : ''
      }`}
    >
      <input
        type="checkbox"
        checked={modelValue}
        disabled={disabled}
        readOnly={disabled || undefined}
        className="absolute left-0 top-0 z-50 h-full w-full cursor-pointer opacity-0"
        onChange={emitEvent}
      />
      <div className="ui-switch__ball absolute z-40 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-xl">
        {ballSlot}
      </div>
      <div className="ui-switch__background absolute left-0 top-0 h-full w-full rounded-md bg-accent" />
      <style>{`
        .ui-switch {
          overflow: hidden;
          transition: all 250ms ease;
        }
        .ui-switch:active {
          transform: scale(0.93);
        }
        .ui-switch__ball {
          transition: all 250ms ease;
          left: 6px;
        }
        .ui-switch__background {
          transition: all 250ms ease;
          margin-left: -100%;
        }
        .ui-switch:hover .ui-switch__ball {
          transform: scale(1.1);
        }
        .ui-switch input:focus ~ .ui-switch__ball {
          transform: scale(1.1);
        }
        .ui-switch input:checked ~ .ui-switch__ball {
          background-color: white;
          left: calc(100% - 21px);
        }
        .ui-switch input:checked ~ .ui-switch__background {
          margin-left: 0;
        }
      `}</style>
    </div>
  );
}
