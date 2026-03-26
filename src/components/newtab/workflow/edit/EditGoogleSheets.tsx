import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchApi } from '@/utils/api';
import googleSheetsApi from '@/utils/googleSheetsApi';
import { convert2DArrayToArrayObj, debounce } from '@/utils/helper';
import EditAutocomplete from './EditAutocomplete.vue';
import InsertWorkflowData from './InsertWorkflowData.vue';

interface EditGoogleSheetsProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function EditGoogleSheets({ children, ...props }: EditGoogleSheetsProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="editgooglesheets-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div className="mb-10">
          <ui-textarea
            model-value={data.description}
            className="mb-2 w-full"
            placeholder={t('common.description')}
            onChange={updateData({ description: $event })}
          />
          <ui-select
            model-value={data.type}
            className="mb-2 w-full"
            onChange={onActionChange}
          >
            <option /* v-for: action in actions */ key={action} value={action}>
              {t(`workflow.blocks.google-sheets.select.${action}`)}
            </option>
          </ui-select>
          {children}
          <edit-autocomplete
            {/* v-if: 
              !googleDrive ||
              (data.inputSpreadsheetId === 'manually' && data.type !== 'create')
             */}
          >
            <ui-input
              model-value={data.spreadsheetId}
              className="w-full"
              placeholder="abcd123"
              onChange={updateData({ spreadsheetId: $event }), checkPermission($event)}
            >
              <template #label>
                {t('workflow.blocks.google-sheets.spreadsheetId.label')}*
                <a
                  href="https://docs.extension.automa.site/blocks/google-sheets.html#spreadsheet-id"
                  target="_blank"
                  rel="noopener"
                  title={t('workflow.blocks.google-sheets.spreadsheetId.link')}
                >
                  <i className={"ri-icon"} />
                </a>
    </div>
  );
}
