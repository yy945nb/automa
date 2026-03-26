import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { store } from '../settings/jsBlockWrap';

interface SharedCodemirrorProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function SharedCodemirror({ children, ...props }: SharedCodemirrorProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="sharedcodemirror-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div
          ref="containerEl"
          className={'hide-gutters': !lineNumbers}
          className="codemirror relative rounded-lg"
        >
          <div
            {/* v-if: !hideLang */}
            className="absolute bottom-0 left-0 z-10 flex h-6 w-full items-center px-2 text-xs text-gray-300"
          >
            <div className="grow" />
            <span>
              {lang}
            </span>
          </div>
        </div>
    </div>
  );
}
