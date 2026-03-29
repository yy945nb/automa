import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useHasPermissions } from '@/composable/hasPermissions';
import EditAutocomplete from './EditAutocomplete.tsx';

interface EditNotificationProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function EditNotification({ children, ...props }: EditNotificationProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="editnotification-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div>
          <ui-textarea
            model-value={data.description}
            placeholder={t('common.description')}
            className="mb-2 w-full"
            onChange={updateData({ description: $event })}
          />
          <template {/* v-if: permission.has.notifications */}>
            <edit-autocomplete className="mb-2">
              <ui-input
                model-value={data.title}
                label={t('workflow.blocks.notification.title')}
                placeholder="Hello world!"
                className="w-full"
                onChange={updateData({ title: $event })}
              />
            </edit-autocomplete>
            <label className="input-label" htmlFor="notification-message">
              {t('workflow.blocks.notification.message')}
            </label>
            <edit-autocomplete>
              <ui-textarea
                id="notification-message"
                model-value={data.message}
                placeholder="Notification message"
                className="w-full"
                onChange={updateData({ message: $event })}
              />
            </edit-autocomplete>
            <edit-autocomplete
              /* v-for: type in ['iconUrl', 'imageUrl'] */ key={type}
              className="mt-2"
            >
              <ui-input
                model-value={data[type]}
                label={t(`workflow.blocks.notification.${type}`)}
                className="w-full"
                placeholder="https://example.com/image.png"
                onChange={updateData({ [type]: $event })}
              />
            </edit-autocomplete>
    </div>
  );
}
