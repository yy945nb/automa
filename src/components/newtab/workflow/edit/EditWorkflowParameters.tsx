import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import cloneDeep from 'lodash.clonedeep';
import { nanoid } from 'nanoid/non-secure';
import ParameterCheckboxValue from './Parameter/ParameterCheckboxValue.tsx';
import ParameterInputOptions from './Parameter/ParameterInputOptions.tsx';
import ParameterInputValue from './Parameter/ParameterInputValue.tsx';
import ParameterJsonValue from './Parameter/ParameterJsonValue.tsx';

interface EditWorkflowParametersProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function EditWorkflowParameters({ children, ...props }: EditWorkflowParametersProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="editworkflowparameters-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div
          className="scroll overflow-auto"
          style="max-height: calc(100vh - 15rem); min-height: 200px"
        >
          <p
            {/* v-if: state.parameters.length === 0 */}
            className="my-4 text-center text-gray-600 dark:text-gray-200"
          >
            No parameters
          </p>
          <section {/* v-else */} className="w-full">
            <div className="grid grid-cols-12 space-x-2 text-sm">
              <div className="col-span-3" style="padding-left: 28px">Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-3">Placeholder</div>
              <div className="col-span-4">Default Value</div>
            </div>
            <draggable
              value={state.parameters} onChange={(e: any) => { /* TODO update state.parameters */ }}
              tag="div"
              item-key="id"
              handle=".handle"
            >
              <template #item="{ element: param, index }">
                <div className="mb-4">
                  <div className="grid grid-cols-12 space-x-2">
                    <div className="col-span-3 flex">
                      <i className={"ri-icon"} />
                      <ui-input
                        model-value={param.name}
                        placeholder="Parameter name"
                        onChange={updateParam(index, $event)}
                      />
                    </div>
                    <div className="col-span-2">
                      <ui-select
                        model-value={param.type}
                        onChange={updateParamType(index, $event)}
                      >
                        <option
                          /* v-for: type in paramTypesArr */ key={type.id}
                          value={type.id}
                        >
                          {type.name}
                        </option>
                      </ui-select>
                    </div>
                    <div className="col-span-3">
                      <ui-input
                        value={param.placeholder} onChange={(e: any) => { /* TODO update param.placeholder */ }}
                        placeholder="A parameter"
                      />
                    </div>
                    <div className="col-span-4 flex items-center">
                      <component
                        data-is={paramTypes[param.type]?.valueComp}
                        {/* v-if: paramTypes[param.type]?.valueComp */}
                        value={param.defaultValue} onChange={(e: any) => { /* TODO update param.defaultValue */ }}
                        param-data={param}
                        editor={true}
                        className="flex-1"
                        style="max-width: 232px"
                      />
                      <ui-input
                        {/* v-else */}
                        value={param.defaultValue} onChange={(e: any) => { /* TODO update param.defaultValue */ }}
                        type={param.type === 'number' ? 'number' : 'text'}
                        placeholder="NULL"
                      />
                      <ui-button
                        icon
                        className="ml-2"
                        onClick={state.parameters.splice(index, 1)}
                      >
                        <i className={"ri-icon"} />
                      </ui-button>
                    </div>
                  </div>
                  <div className="w-full">
                    <ui-expand
                      hide-header-icon
                      header-className="flex items-center focus:ring-0 w-full"
                    >
                      <template #header="{ show }">
                        <i className={"ri-icon"} />
                        <span>Options</span>
    </div>
  );
}
