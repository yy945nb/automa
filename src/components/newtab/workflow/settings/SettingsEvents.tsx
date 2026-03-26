import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';
import cloneDeep from 'lodash.clonedeep';
import EventCodeHTTP from './event/EventCodeHTTP.vue';
import EventCodeAction from './event/EventCodeAction.vue';

interface SettingsEventsProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function SettingsEvents({ children, ...props }: SettingsEventsProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="settingsevents-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div>
          <div className="flex items-center">
            <p className="flex-1">{t('workflow.events.description')}</p>
            <ui-button variant="accent" onClick={updateModalState({ show: true })}>
              {t('workflow.events.add-action')}
            </ui-button>
          </div>
          <ui-list className="mt-4 space-y-1">
            <ui-list-item
              /* v-for: action in settings.events */ key={action.id}
              className="gap-2 group"
            >
              <div className="flex-1 overflow-hidden">
                <p className="text-overflow">{action.name || 'Untitled action'}</p>
                <div
                  /* v-for: event in action.events */ key={event}
                  className={[
                    WORKFLOW_EVENTS_CLASSES[event],
                    'border rounded-md px-2 py-1 text-xs inline-flex items-center mr-0.5',
                  ]}
                >
                  {t(`workflow.events.types.${event}.name`)}
                </div>
              </div>
              <i className={"ri-icon"} />
              <v-remixicon
                name="riDeleteBin7Line"
                className="group-hover:visible invisible cursor-pointer text-red-500 dark:text-red-400"
                onClick={
                  emit('update', {
                    key: 'events',
                    value: settings.events.filter((item) => item.id !== action.id),
                  })
                }
              />
            </ui-list-item>
          </ui-list>
          <ui-modal
            value={actionModal.show} onChange={(e: any) => { /* TODO update actionModal.show */ }}
            persist
            title={t('workflow.events.add-action')}
            content-className="max-w-xl"
            onClose={updateModalState({})}
          >
            <ui-input
              value={actionModal.data.name} onChange={(e: any) => { /* TODO update actionModal.data.name */ }}
              label={t('common.name')}
              placeholder="Untitled"
              autofocus
              className="w-full"
            />
            <p className="mt-4">{t('workflow.events.event', 2)}</p>
            <div className="mt-1 flex flex-wrap items-center space-x-2">
              <div
                /* v-for: (event, index) in actionModal.data.events */ key={event}
                className={[
                  WORKFLOW_EVENTS_CLASSES[event],
                  'border rounded-lg px-3 text-sm h-8 inline-flex items-center',
                ]}
              >
                <p className="flex-1">{t(`workflow.events.types.${event}.name`)}</p>
                <i className={"ri-icon"} />
              </div>
              <ui-popover
                {/* v-if: WORKFLOW_EVENTS.length !== actionModal.data.events.length */}
              >
                <template #trigger>
                  <ui-button className="!h-8 !px-3">
                    <i className={"ri-icon"} />
                    <p className="text-sm">{t('common.add')}</p>
                  </ui-button>
    </div>
  );
}
