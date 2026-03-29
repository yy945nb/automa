import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import cloneDeep from 'lodash.clonedeep';
import InsertWorkflowData from './InsertWorkflowData.tsx';

interface EditSortDataProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function EditSortData({ children, ...props }: EditSortDataProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="editsortdata-wrapper">
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
          <label className="mt-4 flex items-center">
            <ui-switch
              model-value={data.sortByProperty}
              onChange={updateData({ sortByProperty: $event })}
            />
            <span className="ml-2">
              {t('workflow.blocks.sort-data.property')}
            </span>
          </label>
          <template {/* v-if: data.sortByProperty */}>
            <ul
              /* v-for: (property, index) in properties */ key={index}
              className="mt-4 space-y-1 divide-y"
            >
              <li className="sort-property">
                <ui-autocomplete
                  model-value={property.name}
                  items={columns}
                  disabled={data.dataSource !== 'table'}
                  className="w-full"
                >
                  <ui-input
                    value={property.name} onChange={(e: any) => { /* TODO update property.name */ }}
                    autocomplete="off"
                    placeholder={`Property ${index + 1}`}
                    className="w-full"
                  />
                </ui-autocomplete>
                <div className="mt-2 flex items-center">
                  <ui-select value={property.order} onChange={(e: any) => { /* TODO update property.order */ }} className="flex-1">
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </ui-select>
                  <ui-button className="ml-2" icon onClick={properties.splice(index, 1)}>
                    <i className={"ri-icon"} />
                  </ui-button>
                </div>
              </li>
            </ul>
            <ui-button
              {/* v-if: properties.length < 3 */}
              variant="accent"
              className="mt-4 text-sm"
              onClick={addProperty}
            >
              {t('workflow.blocks.sort-data.addProperty')}
            </ui-button>
    </div>
  );
}
