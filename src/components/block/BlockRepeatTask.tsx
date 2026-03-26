import React from 'react';
import { useTranslation } from 'react-i18next';
// TODO: import Handle, Position from react-flow equivalent
// TODO: import useEditorBlock, useComponentId from composables
import BlockBase from './BlockBase';

interface BlockRepeatTaskProps {
  id?: string;
  label?: string;
  data?: Record<string, any>;
  onDelete?: (id: string) => void;
  onUpdate?: (payload: Record<string, any>) => void;
  onSettings?: (payload: Record<string, any>) => void;
}

const BlockRepeatTask: React.FC<BlockRepeatTaskProps> = ({
  id = '',
  label = '',
  data = {},
  onDelete,
  onUpdate,
  onSettings,
}) => {
  const { t } = useTranslation();

  // TODO: replace with real hook implementations
  // const block = useEditorBlock(label);
  // const componentId = useComponentId('block-delay');
  const block: any = { details: { id: label, icon: 'riRepeat2Line', name: label }, category: { color: 'bg-blue-500' } };
  const componentId = `block-repeat-task-${id}`;

  function handleInput(event: React.ChangeEvent<HTMLInputElement>) {
    onUpdate?.({ repeatFor: event.target.value });
  }

  return (
    <BlockBase
      id={componentId}
      data={data}
      blockId={id}
      blockData={block}
      className="repeat-task w-64"
      onDelete={() => onDelete?.(id)}
      onUpdate={onUpdate}
      onSettings={onSettings}
    >
      {/* TODO: Handle - <Handle id={`${id}-input-1`} type="target" position={Position.Left} /> */}
      <div data-handle-id={`${id}-input-1`} data-handle-type="target" data-handle-position="left" />
      <div className="mb-2 flex items-center">
        <div
          className={`mr-4 inline-block rounded-lg p-2 text-sm dark:text-black ${data.disableBlock ? 'bg-box-transparent' : block.category.color}`}
        >
          <i className="ri-repeat-2-line" style={{ fontSize: 20, marginRight: 4, display: 'inline-block' }} />
          <span>{t('workflow.blocks.repeat-task.name')}</span>
        </div>
      </div>
      <div className="bg-input relative flex items-center rounded-lg">
        <input
          value={data.repeatFor ?? ''}
          placeholder="0"
          className="bg-transparent py-2 px-4 focus:ring-0"
          style={{ paddingRight: '57px', width: '95%' }}
          onKeyDown={(e) => e.stopPropagation()}
          onChange={handleInput}
        />
        <span className="absolute right-4 text-gray-600 dark:text-gray-200">
          {t('workflow.blocks.repeat-task.times')}
        </span>
      </div>
      <p className="text-right text-gray-600 dark:text-gray-200">
        {t('workflow.blocks.repeat-task.repeatFrom')}
      </p>
      {/* TODO: Handle - <Handle id={`${id}-output-1`} type="source" position={Position.Right} /> */}
      <div data-handle-id={`${id}-output-1`} data-handle-type="source" data-handle-position="right" />
      {/* TODO: Handle - <Handle id={`${id}-output-2`} type="source" position={Position.Right} style={{ top: 'auto', bottom: 12 }} /> */}
      <div
        data-handle-id={`${id}-output-2`}
        data-handle-type="source"
        data-handle-position="right"
        style={{ top: 'auto', bottom: 12 }}
      />
    </BlockBase>
  );
};

export default BlockRepeatTask;
