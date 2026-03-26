import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { debounce } from '@/utils/helper';

interface WorkflowGlobalDataProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function WorkflowGlobalData({ children, ...props }: WorkflowGlobalDataProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="workflowglobaldata-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div className="global-data">
          <p className="text-right" title="Characters limit">
            {globalData.length}/{maxLength.toLocaleString()}
          </p>
          <shared-codemirror
            value={globalData} onChange={(e: any) => { /* TODO update globalData */ }}
            style="height: calc(100vh - 10rem)"
            lang="json"
          />
        </div>
    </div>
  );
}
