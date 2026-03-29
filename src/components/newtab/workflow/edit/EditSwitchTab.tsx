import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import EditAutocomplete from './EditAutocomplete.tsx';

interface EditSwitchTabProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function EditSwitchTab({ children, ...props }: EditSwitchTabProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="editswitchtab-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div>
          <ui-textarea
            model-value={data.description}
            placeholder={t('common.description')}
            className="w-full"
            onChange={updateData({ description: $event })}
          />
          <ui-select
            model-value={data.findTabBy}
            label="Find tab by"
            className="mb-2 mt-3 w-full"
            onChange={updateData({ findTabBy: $event })}
          >
            <option /* v-for: type in types */ key={type.id} value={type.id}>
              {type.name}
            </option>
          </ui-select>
          <template {/* v-if: ['match-patterns', 'tab-title'].includes(data.findTabBy) */}>
            <edit-autocomplete {/* v-if: data.findTabBy === 'match-patterns' */}>
              <ui-input
                model-value={data.matchPattern}
                placeholder="https://example.com/*"
                className="w-full"
                onChange={updateData({ matchPattern: $event })}
              >
                <template #label>
                  {t('workflow.blocks.switch-tab.matchPattern')}
                  <a
                    title={t('common.example', 2)}
                    href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns#examples"
                    target="_blank"
                    rel="noopener"
                    className="ml-1 inline-block"
                  >
                    <i className={"ri-icon"} />
                  </a>
    </div>
  );
}
