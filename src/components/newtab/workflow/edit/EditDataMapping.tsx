import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';
import { debounce } from '@/utils/helper';
import InsertWorkflowData from './InsertWorkflowData.tsx';

interface EditDataMappingProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function EditDataMapping({ children, ...props }: EditDataMappingProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="editdatamapping-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div>
          <ui-textarea
            model-value={data.description}
            placeholder={t('common.description')}
            className="w-full"
            onChange={updateData({ description: $event })}
          />
          <ui-select
            label={t('workflow.blocks.data-mapping.dataSource')}
            model-value={data.dataSource}
            className="mt-4 w-full"
            onChange={updateData({ dataSource: $event })}
          >
            <option /* v-for: source in dataSources */ key={source.id} value={source.id}>
              {source.name}
            </option>
          </ui-select>
          <ui-input
            {/* v-if: data.dataSource === 'variable' */}
            model-value={data.varSourceName}
            placeholder={t('workflow.variables.name')}
            title={t('workflow.variables.name')}
            className="mt-2 w-full"
            onChange={updateData({ varSourceName: $event })}
          />
          <ui-button
            variant="accent"
            className="mt-4 w-full"
            onClick={state.showModal = true}
          >
            {t('workflow.blocks.data-mapping.edit')}
          </ui-button>
          <insert-workflow-data data={data} variables onUpdate={updateData} />
          <ui-modal
            value={state.showModal} onChange={(e: any) => { /* TODO update state.showModal */ }}
            title={t('workflow.blocks.data-mapping.edit')}
            content-className="max-w-2xl data-map"
          >
            <div
              className="scroll my-4 overflow-auto px-4"
              style="min-height: 400px; max-height: calc(100vh - 12rem)"
            >
              <table className="w-full">
                <thead>
                  <tr className="bg-box-transparent">
                    <th className="w-6/12 rounded-l-lg">
                      {t('workflow.blocks.data-mapping.source')}
                    </th>
                    <th className="w-6/12 rounded-r-lg">
                      {t('workflow.blocks.data-mapping.destination')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr /* v-for: (source, index) in state.sources */ key={source.id}>
                    <td className="group relative pr-4 align-baseline">
                      <div className="flex items-center space-x-2">
                        <ui-autocomplete
                          items={state.autocompleteItems}
                          disabled={data.dataSource !== 'table'}
                        >
                          <ui-input
                            model-value={source.name}
                            className="flex-1"
                            placeholder="Source property"
                            onBlur={updateSource({ index, source, event: $event })}
                          />
                        </ui-autocomplete>
                        <i className={"ri-icon"} />
                        <i className={"ri-icon"} />
                      </div>
                    </td>
                    <td className="pl-4 align-baseline">
                      <ul className="space-y-1">
                        <li
                          /* v-for: (destination, destIndex) in source.destinations */ key={destination.id}
                          className="group flex items-center space-x-2"
                        >
                          <ui-input
                            model-value={destination.name}
                            className="flex-1"
                            placeholder="Destination property"
                            onBlur={
                              updateDestination({
                                index,
                                destIndex,
                                destination,
                                event: $event,
                              })
                            }
                          />
                          <i className={"ri-icon"} />
                        </li>
                      </ul>
                      <ui-button
                        icon
                        className="mt-2 text-sm"
                        onClick={addDestination(index)}
                      >
                        {t('workflow.blocks.data-mapping.addDestination')}
                      </ui-button>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <ui-button className="text-sm" onClick={addSource}>
                        {t('workflow.blocks.data-mapping.addSource')}
                      </ui-button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ui-modal>
        </div>
    </div>
  );
}
