import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useHasPermissions } from '@/composable/hasPermissions';
import InsertWorkflowData from './InsertWorkflowData.tsx';

interface EditCookieProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function EditCookie({ children, ...props }: EditCookieProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="editcookie-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div>
          <ui-textarea
            model-value={data.description}
            className="w-full"
            placeholder={t('common.description')}
            onChange={updateData({ description: $event })}
          />
          <template {/* v-if: permission.has.cookies */}>
            <ui-select
              model-value={data.type}
              className="mt-4 w-full"
              onChange={updateData({ type: $event })}
            >
              <option /* v-for: type in types */ key={type} value={type}>
                {t(`workflow.blocks.cookie.types.${type}`)}
              </option>
            </ui-select>
            <ui-checkbox
              {/* v-if: data.type === 'get' */}
              model-value={data.getAll}
              className="mt-1"
              onChange={updateData({ getAll: $event })}
            >
              {t('workflow.blocks.cookie.types.getAll')}
            </ui-checkbox>
            <ui-checkbox
              model-value={data.useJson}
              block
              className="mt-1"
              onChange={updateData({ useJson: $event })}
            >
              {t('workflow.blocks.cookie.useJson')}
            </ui-checkbox>
            <template {/* v-if: data.useJson */}>
              <shared-codemirror
                model-value={data.jsonCode}
                extensions={codemirrorExts}
                lang="json"
                className="cookie-editor mt-4"
                onChange={updateData({ jsonCode: $event })}
              />
              <a
                href={`https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/cookies/${
                  data.type === 'get' && data.getAll ? 'getAll' : data.type
                }`}
                rel="noopener"
                className="mt-2 inline-block underline"
                target="_blank"
              >
                See all available properties
              </a>
    </div>
  );
}
