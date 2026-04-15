import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TriggerItem {
  id: string;
  type: string;
  data: Record<string, any>;
}

interface SharedWorkflowTriggersProps {
  triggers?: TriggerItem[];
  disabled?: boolean;
  onChange?: (triggers: TriggerItem[]) => void;
}

export default function SharedWorkflowTriggers({ triggers = [], disabled = false, onChange }: SharedWorkflowTriggersProps) {
  const { t } = useTranslation();
  const [triggersList, setTriggersList] = useState<TriggerItem[]>(triggers);

  // TODO: Full implementation — render trigger type-specific editors (Date, CronJob, Interval, VisitWeb, etc.)
  return (
    <div className="scroll overflow-auto" style={{ minHeight: 350, maxHeight: 'calc(100vh - 14rem)' }}>
      {triggersList.length === 0 ? (
        <p className="py-8 text-center text-gray-500">{t('message.noData')}</p>
      ) : (
        triggersList.map((trigger, index) => (
          <div key={trigger.id || index} className="trigger-item mb-2 rounded-lg border p-4">
            <div className="flex items-center">
              <p className="flex-1">
                {t(`workflow.blocks.trigger.items.${trigger.type}`, trigger.type)}
              </p>
              {!disabled && (
                <button
                  className="ml-2 text-red-500 hover:text-red-700"
                  onClick={() => {
                    const next = triggersList.filter((_, i) => i !== index);
                    setTriggersList(next);
                    onChange?.(next);
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            <pre className="mt-2 rounded bg-gray-100 p-2 text-xs dark:bg-gray-700">
              {JSON.stringify(trigger.data, null, 2)}
            </pre>
          </div>
        ))
      )}
    </div>
  );
}
