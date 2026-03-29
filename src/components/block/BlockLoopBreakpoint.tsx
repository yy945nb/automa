import React from 'react';
import { useTranslation } from 'react-i18next';
// TODO: import Handle, Position from react-flow equivalent
// TODO: import useEditorBlock, useComponentId from composables
import BlockBase from './BlockBase';

interface BlockLoopBreakpointProps {
  id?: string;
  label?: string;
  data?: Record<string, any>;
  onDelete?: (id: string) => void;
  onUpdate?: (payload: Record<string, any>) => void;
  onSettings?: (payload: Record<string, any>) => void;
}

const BlockLoopBreakpoint: React.FC<BlockLoopBreakpointProps> = ({
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
  const block: any = { details: { id: label, icon: 'riStopLine', name: label }, category: { color: 'bg-blue-500' } };
  const componentId = `block-loop-breakpoint-${id}`;

  function handleInput(event: React.ChangeEvent<HTMLInputElement>) {
    const loopId = event.target.value.replace(/\s/g, '');
    onUpdate?.({ loopId });
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
          className={`text-overflow mr-4 inline-block rounded-lg p-2 text-sm dark:text-black ${data.disableBlock ? 'bg-box-transparent' : block.category.color}`}
        >
          <i className="ri-stop-line" style={{ fontSize: 20, marginRight: 4, display: 'inline-block' }} />
          <span>{t('workflow.blocks.loop-breakpoint.name')}</span>
        </div>
        <div className="grow" />
        <i
          className="ri-delete-bin-7-line cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onDelete?.(id); }}
        />
      </div>
      <input
        value={data.loopId ?? ''}
        className="bg-input w-full rounded-lg px-4 py-2"
        placeholder="Loop ID"
        type="text"
        required
        onKeyDown={(e) => e.stopPropagation()}
        onChange={handleInput}
      />
      {/* TODO: ui-checkbox equivalent */}
      <label className="mt-2 flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={data.clearLoop ?? false}
          onChange={(e) => onUpdate?.({ clearLoop: e.target.checked })}
        />
        Stop loop
      </label>
      {/* TODO: Handle - <Handle id={`${id}-output-1`} type="source" position={Position.Right} /> */}
      <div data-handle-id={`${id}-output-1`} data-handle-type="source" data-handle-position="right" />
    </BlockBase>
  );
};

export default BlockLoopBreakpoint;
