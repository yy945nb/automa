import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/stores/main';
import { openGDrivePickerPopup } from '@/utils/openGDriveFilePicker';
import EditGoogleSheets from './EditGoogleSheets.vue';

interface EditGoogleSheetsDriveProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function EditGoogleSheetsDrive({ children, ...props }: EditGoogleSheetsDriveProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="editgooglesheetsdrive-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div {/* v-if: !store.integrations.googleDrive */}>
          <p>
            You haven't
            <a
              href="https://docs.automa.site/integrations/google-drive.html"
              target="_blank"
              className="underline"
              >connected Automa to Google Drive</a
            >.
          </p>
        </div>
        <edit-google-sheets
          {/* v-else */}
          google-drive
          data={data}
          additional-actions={['create', 'add-sheet']}
          @updatedata={updateData}
        >
          <ui-tabs
            {/* v-if: data.type !== 'create' */}
            small
            model-value={data.inputSpreadsheetId}
            fill
            className="w-full my-2"
            type="fill"
            onChange={updateData({ inputSpreadsheetId: $event })}
          >
            <ui-tab value="connected"> Connected </ui-tab>
            <ui-tab value="manually"> Manually </ui-tab>
          </ui-tabs>
          <div
            {/* v-if: data.type !== 'create' && data.inputSpreadsheetId === 'connected' */}
            className="flex items-end"
          >
            <ui-select
              model-value={data.spreadsheetId}
              label={t('workflow.blocks.google-sheets-drive.connected')}
              placeholder={t('workflow.blocks.google-sheets-drive.select')}
              className="w-full"
              onChange={updateData({ spreadsheetId: $event })}
            >
              <option
                /* v-for: sheet in store.connectedSheets */ key={sheet.id}
                value={sheet.id}
              >
                {sheet.name}
              </option>
            </ui-select>
            <ui-button
              v-tooltip="t('workflow.blocks.google-sheets-drive.connect')"
              icon
              className="ml-2"
              onClick={connectSheet}
            >
              <i className={"ri-icon"} />
            </ui-button>
          </div>
          <ui-input
            {/* v-if: ['create', 'add-sheet'].includes(data.type) */}
            model-value={data.sheetName}
            label="Sheet name"
            placeholder="A Spreadsheet"
            className="w-full"
            onChange={updateData({ sheetName: $event })}
          />
        </edit-google-sheets>
    </div>
  );
}
