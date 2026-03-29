import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { contentTypes } from '@/utils/shared';
import EditAutocomplete from './EditAutocomplete.tsx';
import InsertWorkflowData from './InsertWorkflowData.tsx';

interface EditWebhookProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function EditWebhook({ children, ...props }: EditWebhookProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="editwebhook-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div className="mb-2 mt-4">
          <ui-textarea
            model-value={data.description}
            placeholder={t('common.description')}
            className="mb-2 w-full"
            onChange={updateData({ description: $event })}
          />
          <ui-select
            model-value={data.method || 'POST'}
            label={t('workflow.blocks.webhook.method')}
            className="mb-2 w-full"
            onChange={updateMethod}
          >
            <option /* v-for: method in methods */ key={method} value={method}>
              {method}
            </option>
          </ui-select>
          <edit-autocomplete className="mb-2">
            <ui-textarea
              model-value={data.url}
              label={`${t('workflow.blocks.webhook.url')}*`}
              placeholder="http://api.example.com"
              className="w-full"
              rows="1"
              autocomplete="off"
              required
              type="url"
              onChange={updateData({ url: $event })}
            />
          </edit-autocomplete>
          <ui-select
            model-value={data.contentType}
            label={t('workflow.blocks.webhook.contentType')}
            className="mb-2 w-full"
            onChange={updateData({ contentType: $event })}
          >
            <option
              /* v-for: type in contentTypes */ key={type.value}
              value={type.value}
            >
              {type.name}
            </option>
          </ui-select>
          <ui-input
            model-value={data.timeout}
            label={
              t('workflow.blocks.webhook.timeout.placeholder') +
              ` (${t('common.0disable')})`
            }
            title={t('workflow.blocks.webhook.timeout.title')}
            className="mb-2 w-full"
            type="number"
            onChange={updateData({ timeout: +$event })}
          />
          <ui-tabs value={activeTab} onChange={(e: any) => { /* TODO update activeTab */ }} fill>
            <ui-tab value="headers">
              {t('workflow.blocks.webhook.tabs.headers')}
            </ui-tab>
            <ui-tab {/* v-if: !notHaveBody.includes(data.method) */} value="body">
              {t('workflow.blocks.webhook.tabs.body')}
            </ui-tab>
            <ui-tab value="response">
              {t('workflow.blocks.webhook.tabs.response')}
            </ui-tab>
          </ui-tabs>
          <ui-tab-panels value={activeTab} onChange={(e: any) => { /* TODO update activeTab */ }}>
            <ui-tab-panel
              value="headers"
              className="mt-4 grid grid-cols-7 justify-items-center gap-2"
            >
              <template /* v-for: (items, index) in headers */ key={index}>
                <ui-input
                  value={items.name} onChange={(e: any) => { /* TODO update items.name */ }}
                  title={items.name}
                  placeholder={`Header ${index + 1}`}
                  type="text"
                  className="col-span-3"
                />
                <ui-input
                  value={items.value} onChange={(e: any) => { /* TODO update items.value */ }}
                  title={items.value}
                  placeholder="Value"
                  type="text"
                  className="col-span-3"
                />
                <button onClick={removeHeader(index)}>
                  <i className={"ri-icon"} />
                </button>
    </div>
  );
}
