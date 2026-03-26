import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';
import cloneDeep from 'lodash.clonedeep';
import { dataTypes } from '@/utils/constants/table';

interface StorageEditTableProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function StorageEditTable({ children, ...props }: StorageEditTableProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="storageedittable-wrapper">
      {/* Converted from Vue SFC - template below */}
      <ui-modal model-value={modelValue} persist custom-content>
          <ui-card
            padding="p-0"
            className="flex w-full max-w-xl flex-col"
            style="height: 600px"
          >
            <p className="p-4 font-semibold">
              {title || t('storage.table.add')}
            </p>
            <div className="scroll flex-1 overflow-auto px-4 pb-4">
              <ui-input
                value={state.name} onChange={(e: any) => { /* TODO update state.name */ }}
                className="-mt-1 w-full"
                label="Table name"
                placeholder="My table"
              />
              <div className="mt-4 flex items-center">
                <p className="flex-1">Columns</p>
                <ui-button icon title={t('common.add')} onClick={addColumn}>
                  <i className={"ri-icon"} />
                </ui-button>
              </div>
              <p
                {/* v-if: state.columns && state.columns.length === 0 */}
                className="my-4 text-center text-gray-600 dark:text-gray-300"
              >
                {t('message.noData')}
              </p>
              <draggable
                value={state.columns} onChange={(e: any) => { /* TODO update state.columns */ }}
                tag="ul"
                handle=".handle"
                item-key="id"
                className="mt-4 space-y-2"
              >
                <template #item="{ element: column, index }">
                  <li className="flex items-center space-x-2">
                    <span className="handle cursor-move">
                      <i className={"ri-icon"} />
                    </span>
                    <ui-input
                      model-value={column.name}
                      placeholder={t('workflow.table.column.name')}
                      className="flex-1"
                      onBlur={updateColumnName(index, $event.target)}
                    />
                    <ui-select
                      value={column.type} onChange={(e: any) => { /* TODO update column.type */ }}
                      className="flex-1"
                      placeholder={t('workflow.table.column.type')}
                    >
                      <option
                        /* v-for: type in dataTypes */ key={type.id}
                        value={type.id}
                      >
                        {type.name}
                      </option>
                    </ui-select>
                    <button onClick={deleteColumn(index)}>
                      <i className={"ri-icon"} />
                    </button>
                  </li>
    </div>
  );
}
