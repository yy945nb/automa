import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useHasPermissions } from '@/composable/hasPermissions';
import { useStore } from '@/stores/main';
import cloneDeep from 'lodash.clonedeep';
import { nanoid } from 'nanoid/non-secure';
import EditAutocomplete from './EditAutocomplete.tsx';

interface EditGoogleDriveProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function EditGoogleDrive({ children, ...props }: EditGoogleDriveProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="editgoogledrive-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div>
          <div {/* v-if: !store.integrations.googleDrive */}>
            <p>
              You haven't
              <a
                href="https://docs.extension.automa.site/integrations/google-drive.html"
                target="_blank"
                className="underline"
                >connected Automa to Google Drive</a
              >.
            </p>
          </div>
          <template {/* v-else */}>
            <ui-textarea
              model-value={data.description}
              className="w-full"
              placeholder={t('common.description')}
              onChange={updateData({ description: $event })}
            />
            <ui-select
              model-value={data.action}
              className="w-full mt-4"
              onChange={updateData({ action: $event })}
            >
              <option /* v-for: action in actions */ key={action} value={action}>
                {t(`workflow.blocks.google-drive.actions.${action}`)}
              </option>
            </ui-select>
            <div className="mt-4">
              <ul className="space-y-2">
                <li
                  /* v-for: (item, index) in filePaths */ key={item.id}
                  className="p-2 border rounded-lg"
                >
                  <div className="flex items-center">
                    <ui-select
                      value={item.type} onChange={(e: any) => { /* TODO update item.type */ }}
                      className="grow mr-2"
                      placeholder="File location"
                    >
                      <option value="url">URL</option>
                      <option value="local" disabled={!hasFileAccess}>
                        Local computer
                      </option>
                      <option
                        value="downloadId"
                        disabled={!permissions.has.downloads}
                      >
                        Download id
                      </option>
                    </ui-select>
                    <ui-button icon onClick={filePaths.splice(index, 1)}>
                      <i className={"ri-icon"} />
                    </ui-button>
                  </div>
                  <edit-autocomplete>
                    <ui-input
                      value={item.name} onChange={(e: any) => { /* TODO update item.name */ }}
                      placeholder="Filename (optional)"
                      className="w-full mt-2"
                    />
                  </edit-autocomplete>
                  <edit-autocomplete>
                    <ui-input
                      value={item.path} onChange={(e: any) => { /* TODO update item.path */ }}
                      placeholder={placeholders[item.type]}
                      title="File location"
                      className="w-full mt-2"
                    />
                  </edit-autocomplete>
                </li>
              </ul>
              <ui-button className="mt-4" variant="accent" onClick={addFile}>
                Add file
              </ui-button>
            </div>
    </div>
  );
}
