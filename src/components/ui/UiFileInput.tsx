import React, { useState, useRef, useEffect, useMemo } from 'react';
import UiButton from './UiButton';

interface UiFileInputProps {
  modelValue?: string | Record<string, unknown>;
  label?: string;
  accept?: string;
  maxSize?: number;
  onUpload?: ((file: File) => Promise<unknown>) | null;
  onChange?: (value: unknown) => void;
}

export default function UiFileInput({
  modelValue = '',
  label = '',
  accept = '*',
  maxSize = 30,
  onUpload = null,
  onChange,
}: UiFileInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (typeof modelValue === 'object' && modelValue !== null && (modelValue as Record<string, unknown>).filename) {
      setFileName(String((modelValue as Record<string, unknown>).filename));
    }
  }, [modelValue]);

  const tooltipContent = useMemo(
    () => `Max size: ${maxSize}MB\nAccepted types: ${accept.replace(/,/g, ', ')}`,
    [maxSize, accept]
  );

  const statusText = uploading
    ? 'Uploading...'
    : hasError
    ? 'Upload failed. Please try again.'
    : fileName || 'No file selected.';

  function isFileTypeValid(file: File): boolean {
    if (accept === '*') return true;
    const acceptedTypes = accept.split(',').map((t) => t.trim());
    const { name: fName, type: fileType } = file;
    return acceptedTypes.some((acceptedType) => {
      if (acceptedType.startsWith('.')) return fName.endsWith(acceptedType);
      if (acceptedType.endsWith('/*')) return fileType.startsWith(acceptedType.slice(0, -1));
      return fileType === acceptedType;
    });
  }

  function resetState() {
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFileName('');
  }

  function handleError(message: string) {
    console.error(message);
    setHasError(true);
    resetState();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setHasError(false);
    const file = event.target.files?.[0];
    if (!file) { resetState(); return; }

    setFileName(file.name);

    if (!isFileTypeValid(file)) { handleError('Invalid file type.'); return; }
    if (file.size > maxSize * 1024 * 1024) { handleError(`File size should not exceed ${maxSize}MB`); return; }
    if (!onUpload) { handleError('onUpload function is not provided'); return; }

    setUploading(true);
    try {
      const value = await onUpload(file);
      onChange?.(value);
      setFileName(file.name);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'An error occurred during file upload.';
      handleError(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="input-ui inline-block w-full">
      {label && (
        <label className="ml-1 inline-flex items-center text-sm leading-none text-gray-600 dark:text-gray-200">
          <span>{label}</span>
          <i className="ri-information-line ml-1" title={tooltipContent} />
        </label>
      )}
      <div className="mt-1 w-full">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
        />
        <UiButton
          loading={uploading}
          disabled={uploading}
          variant="default"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <i className="ri-upload-line mr-2 -ml-1" />
          Choose File
        </UiButton>
        <p className={`mt-1 text-sm text-center ${hasError ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {statusText}
        </p>
      </div>
    </div>
  );
}
