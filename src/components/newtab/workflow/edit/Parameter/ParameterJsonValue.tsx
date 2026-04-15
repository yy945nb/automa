import React from 'react';

interface ParameterJsonValueProps {
  modelValue?: string;
  paramData?: { name?: string; placeholder?: string };
  editor?: boolean;
  onChange?: (value: string) => void;
}

export default function ParameterJsonValue({ modelValue = '', paramData = {}, editor = false, onChange }: ParameterJsonValueProps) {
  return (
    <label>
      {!editor && paramData.name && (
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-200">{paramData.name}</span>
      )}
      <textarea
        value={modelValue}
        className="ui-textarea w-full"
        placeholder={paramData.placeholder || ''}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </label>
  );
}
