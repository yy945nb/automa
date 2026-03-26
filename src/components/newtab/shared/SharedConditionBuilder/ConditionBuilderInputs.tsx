import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';
import cloneDeep from 'lodash.clonedeep';
import { conditionBuilder } from '@/utils/shared';
import SharedElSelectorActions from '@/components/newtab/shared/SharedElSelectorActions.vue';
import EditAutocomplete from '../../workflow/edit/EditAutocomplete.vue';

interface ConditionBuilderInputsProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function ConditionBuilderInputs({ children, ...props }: ConditionBuilderInputsProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="conditionbuilderinputs-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div
          /* v-for: (item, index) in inputsData */ key={item.id}
          className="condition-input scroll"
        >
          <div
            {/* v-if: item.category === 'value' */}
            className="flex flex-wrap items-end space-x-2"
          >
            <ui-select
              model-value={item.type}
              className="shrink-0"
              onChange={updateValueType($event, index)}
            >
              <optgroup
                /* v-for: (types, label) in filterValueTypes(index) */ key={label}
                label={label}
              >
                <option /* v-for: type in types */ key={type.id} value={type.id}>
                  {type.name}
                </option>
              </optgroup>
            </ui-select>
            <template
              /* v-for: name in getConditionDataList(item) */ key={item.id + name}
            >
              <template {/* v-if: name === 'code' */}>
                <ui-select
                  value={inputsData[index].data.context} onChange={(e: any) => { /* TODO update inputsData[index].data.context */ }}
                  placeholder={t('workflow.blocks.javascript-code.context.name')}
                  className="mr-2"
                >
                  <option
                    disabled={
                      isFirefox ||
                      (workflow?.data?.value.settings?.execContext || 'popup') !==
                        'popup'
                    }
                    value="background"
                  >
                    {t(`workflow.blocks.javascript-code.context.items.background`)}
                  </option>
                  <option value="website">
                    {t(`workflow.blocks.javascript-code.context.items.website`)}
                  </option>
                </ui-select>
                <i className={"ri-icon"} />
    </div>
  );
}
