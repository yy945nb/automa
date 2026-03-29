import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from '@/lib/dayjs';

interface SharedCardProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function SharedCard({ children, ...props }: SharedCardProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="sharedcard-wrapper">
      {/* Converted from Vue SFC - template below */}
      <ui-card
          data-workflow-id={data.hostId}
          className="group flex flex-col hover:ring-2 hover:ring-accent dark:hover:ring-gray-200"
        >
          <slot name="header">
            <div className="mb-4 flex items-center">
              <ui-img
                {/* v-if: data.icon?.startsWith('http') */}
                src={data.icon}
                className="overflow-hidden rounded-lg"
                style="height: 40px; width: 40px"
                alt="Can not display"
              />
              <span {/* v-else */} className="bg-box-transparent rounded-lg p-2">
                <i className={data.icon || icon} />
              </span>
              <div className="grow"></div>
              <span
                {/* v-if: data.isDisabled */}
                className="text-sm text-gray-600 dark:text-gray-200"
              >
                Disabled
              </span>
              <button
                {/* v-else-if: !disabled */}
                className="invisible group-hover:visible"
                onClick={emit('execute', data)}
              >
                <i className={"ri-icon"} />
              </button>
              <ui-popover {/* v-if: showDetails */} className="ml-2 h-6">
                <template #trigger>
                  <button>
                    <i className={"ri-icon"} />
                  </button>
    </div>
  );
}
