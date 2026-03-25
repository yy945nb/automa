import React, { useId } from 'react';

interface UiTextareaProps {
  modelValue?: string;
  label?: string;
  placeholder?: string;
  autoresize?: boolean;
  max?: number | string;
  block?: boolean;
  onChange?: (value: string) => void;
  onKeyup?: (e: React.KeyboardEvent) => void;
  onKeydown?: (e: React.KeyboardEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
  className?: string;
}

export default function UiTextarea({
  modelValue = '',
  label = '',
  placeholder = '',
  autoresize = false,
  max,
  block = false,
  onChange,
  onKeyup,
  onKeydown,
  onFocus,
  onBlur,
  className = '',
}: UiTextareaProps) {
  const textareaId = useId();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  function emitValue(event: React.FormEvent<HTMLTextAreaElement>) {
    let { value } = event.target as HTMLTextAreaElement;
    const maxLength = Math.abs(Number(max)) || Infinity;

    if (value.length > maxLength) {
      value = value.slice(0, maxLength);
    }

    onChange?.(value);

    if (autoresize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }

  return (
    <textarea
      id={textareaId}
      ref={textareaRef}
      className={`ui-textarea ui-input bg-input w-full rounded-lg px-4 py-2 transition ${className}`}
      placeholder={placeholder}
      maxLength={max !== null && max !== undefined ? Number(max) : undefined}
      value={modelValue}
      onInput={emitValue}
      onChange={() => {/* controlled via onInput */}}
      onKeyUp={onKeyup}
      onKeyDown={onKeydown}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}
