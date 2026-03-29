import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { debounce } from '@/utils/helper';
import SharedWysiwyg from '@/components/newtab/shared/SharedWysiwyg.tsx';

interface PackageDetailsProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function PackageDetails({ children, ...props }: PackageDetailsProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="packagedetails-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div className="w-full max-w-2xl pb-8">
          <ui-input
            model-value={data.name}
            label="Package name"
            className="w-full"
            placeholder="My package"
            onChange={updatePackage({ name: $event })}
          />
          <label className="mt-4 block w-full">
            <span className="ml-1 text-sm text-gray-600 dark:text-gray-200">
              Short description
            </span>
            <ui-textarea
              model-value={data.description}
              placeholder="Short description"
              onChange={updatePackage({ description: $event })}
            />
          </label>
          <shared-wysiwyg
            model-value={data.content}
            placeholder={t('common.description')}
            limit={5000}
            className="content-editor bg-box-transparent prose prose-zinc relative mt-4 max-w-none rounded-lg p-4 dark:prose-invert"
            onChange={updatePackage({ content: $event })}
            onCount={state.contentLength = $event}
          >
            <template #append>
              <p
                className="absolute bottom-2 right-2 text-sm text-gray-600 dark:text-gray-200"
              >
                {state.contentLength}/5000
              </p>
    </div>
  );
}
