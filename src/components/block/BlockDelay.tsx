import React from 'react';
import { useTranslation } from 'react-i18next';
// TODO: import Handle, Position from react-flow equivalent
// TODO: import useEditorBlock, useComponentId from composables
import BlockBase from './BlockBase';

interface BlockDelayProps {
  id?: string;
  label?: string;
  data?: Record<string, any>;
  onDelete?: (id: string) => void;
  onUpdate?: (payload: Record<string, any>) => void;
  onSettings?: (payload: Record<string, any>) => void;
}

const BlockDelay: React.FC<BlockDelayProps> = ({
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
  const block: any = { details: { id: label, icon: 'riTimerLine', name: label }, category: { color: 'bg-blue-500' } };
  const componentId = `block-delay-${id}`;

  function handleStartDrag(event: React.DragEvent<HTMLDivElement>) {
    const payload = {
      id: label,
      data,
      blockId: id,
      fromBlockBasic: true,
    };
    event.dataTransfer.setData('block', JSON.stringify(payload));
  }

  return (
    <BlockBase
      id={componentId}
      data={data}
      blockId={id}
      blockData={block}
      className="w-48"
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
          <i className="ri-timer-line" style={{ fontSize: 20, marginRight: 4, display: 'inline-block' }} />
          <span>{t('workflow.blocks.delay.name')}</span>
        </div>
        <div className="grow" />
        <i
          className="ri-delete-bin-7-line cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onDelete?.(id); }}
        />
      </div>
      <input
        value={data.time ?? ''}
        min={0}
        title={t('workflow.blocks.delay.input.title')}
        placeholder={t('workflow.blocks.delay.input.placeholder')}
        className="bg-input w-full rounded-lg px-4 py-2"
        type="text"
        required
        onKeyDown={(e) => e.stopPropagation()}
        onChange={(e) => onUpdate?.({ time: e.target.value })}
      />
      {block.details.id !== 'trigger' && (
        <div
          title={t('workflow.blocks.base.moveToGroup')}
          draggable
          className="move-to-group invisible absolute -top-2 -right-2 z-50 rounded-md bg-white p-1 shadow-md dark:bg-gray-700"
          onDragStart={handleStartDrag}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <i className="ri-drag-drop-line" style={{ fontSize: 20 }} />
        </div>
      )}
      {/* TODO: Handle - <Handle id={`${id}-output-1`} type="source" position={Position.Right} /> */}
      <div data-handle-id={`${id}-output-1`} data-handle-type="source" data-handle-position="right" />
    </BlockBase>
  );
};

export default BlockDelay;
