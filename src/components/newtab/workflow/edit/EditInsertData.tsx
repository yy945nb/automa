import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import getFile, { readFileAsBase64 } from '@/utils/getFile';
import EditAutocomplete from './EditAutocomplete.vue';

interface EditInsertDataProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function EditInsertData({ children, ...props }: EditInsertDataProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="editinsertdata-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div>
          <ui-textarea
            model-value={data.description}
            placeholder={t('common.description')}
            className="w-full"
            onChange={updateData({ description: $event })}
          />
          <ui-button
            className="mt-4 mb-2 w-full"
            variant="accent"
            onClick={showModal = !showModal}
          >
            Insert data ({dataList.length})
          </ui-button>
          <ui-modal
            value={showModal} onChange={(e: any) => { /* TODO update showModal */ }}
            title="Insert data"
            padding="p-0"
            content-className="max-w-3xl insert-data-modal"
          >
            <ul
              className="data-list scroll mt-4 overflow-auto px-4 pb-4"
              style="max-height: calc(100vh - 13rem)"
            >
              <li
                /* v-for: (item, index) in dataList */ key={index}
                className="mb-4 rounded-lg border"
              >
                <div className="flex items-center border-b p-2">
                  <ui-select
                    model-value={item.type}
                    className="mr-2 shrink-0"
                    onChange={changeItemType(index, $event)}
                  >
                    <option value="table">
                      {t('workflow.table.title')}
                    </option>
                    <option value="variable">
                      {t('workflow.variables.title')}
                    </option>
                  </ui-select>
                  <ui-input
                    {/* v-if: item.type === 'variable' */}
                    value={item.name} onChange={(e: any) => { /* TODO update item.name */ }}
                    placeholder={t('workflow.variables.name')}
                    title={t('workflow.variables.name')}
                    className="flex-1"
                  />
                  <ui-select
                    {/* v-else */}
                    value={item.name} onChange={(e: any) => { /* TODO update item.name */ }}
                    placeholder={t('workflow.table.select')}
                  >
                    <option
                      /* v-for: column in workflow.columns.value */ key={column.id}
                      value={column.id}
                    >
                      {column.name}
                    </option>
                  </ui-select>
                  <div className="grow" />
                  <i className={"ri-icon"} />
                </div>
                <div className="p-2">
                  <div {/* v-if: hasFileAccess && item.isFile */} className="flex items-end">
                    <edit-autocomplete className="w-full">
                      <ui-input
                        value={item.filePath} onChange={(e: any) => { /* TODO update item.filePath */ }}
                        className="w-full"
                        placeholder={
                          isFirefox ? 'File URL' : 'File absolute path/File URL'
                        }
                      />
                    </edit-autocomplete>
                    <template
                      {/* v-if: 
                        /.xlsx?$/.test(item.filePath) &&
                        (item.action || item.csvAction)?.includes?.('json')
                       */}
                    >
                      <ui-input
                        value={item.xlsSheet} onChange={(e: any) => { /* TODO update item.xlsSheet */ }}
                        label="Sheet (optional)"
                        className="ml-2"
                        placeholder="Sheet1"
                      />
                      <ui-input
                        value={item.xlsRange} onChange={(e: any) => { /* TODO update item.xlsRange */ }}
                        label="Range (optional)"
                        className="ml-2"
                        placeholder="A1:C10"
                      />
    </div>
  );
}
