import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDialog } from '@/composable/dialog';
import { usePackageStore } from '@/stores/package';

interface EditorLocalSavedBlocksProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function EditorLocalSavedBlocks({ children, ...props }: EditorLocalSavedBlocksProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="editorlocalsavedblocks-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div className="absolute bottom-0 z-50 w-full p-4">
          <ui-card className="h-full w-full" padding="p-0">
            <div className="flex items-center p-4">
              <ui-input
                value={state.query} onChange={(e: any) => { /* TODO update state.query */ }}
                placeholder={t('common.search')}
                autofocus
                autocomplete="off"
                prepend-icon="riSearch2Line"
              />
              <div className="grow" />
              <ui-button icon onClick={emit('close')}>
                <i className={"ri-icon"} />
              </ui-button>
            </div>
            <div
              className="scroll mx-4 flex space-x-4 overflow-x-auto pb-4"
              style="min-height: 95px"
            >
              <p
                {/* v-if: packageStore.packages.length === 0 */}
                className="w-full py-8 text-center"
              >
                {t('message.noData')}
              </p>
              <div
                /* v-for: item in items */ key={item.id}
                draggable="true"
                className="hoverable relative flex shrink-0 cursor-move flex-col rounded-lg border-2 transition"
                style="width: 288px; height: 125px"
                onDragstart={
                  $event.dataTransfer.setData('savedBlocks', JSON.stringify(item))
                }
              >
                <div className="flex flex-1 items-start p-4">
                  <div
                    {/* v-if: item.icon */}
                    className={'mr-2': item.icon.startsWith('http')}
                    className="w-8 shrink-0"
                  >
                    <img
                      {/* v-if: item.icon.startsWith('http') */}
                      src={item.icon}
                      width="38"
                      height="38"
                      className="rounded-lg"
                    />
                    <i className={item.icon || 'mdiPackageVariantClosed'} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-overflow font-semibold leading-tight">
                      {item.name}
                    </p>
                    <p
                      className="line-clamp leading-tight text-gray-600 dark:text-gray-200"
                    >
                      {item.description}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center space-x-3 px-4 pb-4 text-gray-600 dark:text-gray-200"
                >
                  <span {/* v-if: item.author */} className="text-overflow">
                    By {item.author}
                  </span>
                  <div className="grow" />
                  <a
                    {/* v-if: item.isExternal */}
                    href={`https://extension.automa.site/packages/${item.id}`}
                    target="_blank"
                    title="Open package page"
                  >
                    <i className={"ri-icon"} />
                  </a>
                  <ui-popover style="height: 18px">
                    <template #trigger>
                      <i className={"ri-icon"} />
    </div>
  );
}
