import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface BlockSettingOnErrorProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function BlockSettingOnError({ children, ...props }: BlockSettingOnErrorProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="blocksettingonerror-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div
          className="on-block-error scroll overflow-auto"
          style="max-height: calc(100vh - 13rem)"
        >
          <div
            className="flex items-start rounded-lg bg-green-200 p-4 text-black dark:bg-green-300"
          >
            <i className={"ri-icon"} />
            <p className="ml-4 flex-1">
              {t('workflow.blocks.base.onError.info')}
            </p>
          </div>
          <div className="mt-4">
            <label className="inline-flex">
              <ui-switch value={state.enable} onChange={(e: any) => { /* TODO update state.enable */ }} />
              <span className="ml-2">
                {t('common.enable')}
              </span>
            </label>
            <template {/* v-if: state.enable */}>
              <div className="mt-4">
                <label className="inline-flex">
                  <ui-switch value={state.retry} onChange={(e: any) => { /* TODO update state.retry */ }} />
                  <span className="ml-2">
                    {t('workflow.blocks.base.onError.retry')}
                  </span>
                </label>
              </div>
              <transition-expand>
                <div {/* v-if: state.retry */} className="mt-2">
                  <div className="inline-flex items-center">
                    <span>
                      {t('workflow.blocks.base.onError.times.name')}
                    </span>
                    <i className={"ri-icon"} />
                    <ui-input
                      v-model.number="state.retryTimes"
                      type="number"
                      min="0"
                      className="w-20"
                    />
                  </div>
                  <div className="ml-12 inline-flex items-center">
                    <span>
                      {t('workflow.blocks.base.onError.interval.name')}
                    </span>
                    <i className={"ri-icon"} />
                    <ui-input
                      v-model.number="state.retryInterval"
                      type="number"
                      min="0"
                      className="w-20"
                    />
                    <span className="ml-1">
                      {t('workflow.blocks.base.onError.interval.second')}
                    </span>
                  </div>
                </div>
              </transition-expand>
              <ui-select value={state.toDo} onChange={(e: any) => { /* TODO update state.toDo */ }} className="mt-2 w-56">
                <option
                  /* v-for: type in toDoTypes */ key={type}
                  value={type}
                  disabled={type === 'fallback' && data.isInGroup ? true : null}
                  className="to-do-type"
                >
                  {t(`workflow.blocks.base.onError.toDo.${type}`)}
                </option>
              </ui-select>
              <ui-input
                {/* v-if: state.toDo === 'error' */}
                value={state.errorMessage} onChange={(e: any) => { /* TODO update state.errorMessage */ }}
                placeholder={t(`workflow.blocks.workflow-state.error.message`)}
                title={t(`workflow.blocks.workflow-state.error.message`)}
                className="mt-1 ml-2 w-56"
              />
              <div className="mt-4 flex items-center justify-between">
                <label className="inline-flex">
                  <ui-switch value={state.insertData} onChange={(e: any) => { /* TODO update state.insertData */ }} />
                  <span className="ml-2">
                    {t('workflow.blocks.base.onError.insertData.name')}
                  </span>
                </label>
                <ui-button
                  {/* v-if: state.insertData */}
                  className="text-sm"
                  onClick={addDataToInsert}
                >
                  Add item
                </ui-button>
              </div>
              <transition-expand>
                <table {/* v-if: state.insertData */} className="mt-2 w-full">
                  <thead>
                    <tr className="text-left text-sm">
                      <th>Type</th>
                      <th>Name</th>
                      <th>Value</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr /* v-for: (item, index) in state.dataToInsert */ key={index}>
                      <td>
                        <ui-select value={item.type} onChange={(e: any) => { /* TODO update item.type */ }}>
                          <option value="table">
                            {t('workflow.table.title')}
                          </option>
                          <option value="variable">
                            {t('workflow.variables.title')}
                          </option>
                        </ui-select>
                      </td>
                      <td>
                        <ui-select
                          {/* v-if: item.type === 'table' */}
                          value={item.name} onChange={(e: any) => { /* TODO update item.name */ }}
                          placeholder="Select column"
                          className="mt-1 w-full"
                        >
                          <option
                            /* v-for: column in workflow.columns.value */ key={column.id}
                            value={column.id}
                          >
                            {column.name}
                          </option>
                        </ui-select>
                        <ui-input
                          {/* v-else */}
                          value={item.name} onChange={(e: any) => { /* TODO update item.name */ }}
                          placeholder="Variable name"
                        />
                      </td>
                      <td>
                        <ui-input value={item.value} onChange={(e: any) => { /* TODO update item.value */ }} placeholder="EMPTY" />
                      </td>
                      <td>
                        <i className={"ri-icon"} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </transition-expand>
    </div>
  );
}
