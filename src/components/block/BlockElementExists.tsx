import React from 'react';
import { useTranslation } from 'react-i18next';
// TODO: import Handle, Position from react-flow equivalent
// TODO: import useEditorBlock, useComponentId from composables
import BlockBase from './BlockBase';

interface BlockElementExistsProps {
  id?: string;
  label?: string;
  data?: Record<string, any>;
  onDelete?: (id: string) => void;
  onEdit?: () => void;
  onUpdate?: (payload: Record<string, any>) => void;
  onSettings?: (payload: Record<string, any>) => void;
}

const BlockElementExists: React.FC<BlockElementExistsProps> = ({
  id = '',
  label = '',
  data = {},
  onDelete,
  onEdit,
  onUpdate,
  onSettings,
}) => {
  const { t } = useTranslation();

  // TODO: replace with real hook implementations
  // const block = useEditorBlock(label);
  // const componentId = useComponentId('block-delay');
  const block: any = { details: { id: label, icon: 'riFocus3Line', name: label }, category: { color: 'bg-blue-500' } };
  const componentId = `block-element-exists-${id}`;

  return (
    <BlockBase
      id={componentId}
      data={data}
      blockId={id}
      blockData={block}
      style={{ width: '195px' }}
      onEdit={onEdit}
      onDelete={() => onDelete?.(id)}
      onUpdate={onUpdate}
      onSettings={onSettings}
    >
      {/* TODO: Handle - <Handle id={`${id}-input-1`} type="target" position={Position.Left} /> */}
      <div data-handle-id={`${id}-input-1`} data-handle-type="target" data-handle-position="left" />
      <div
        className={`mb-2 inline-block rounded-lg p-2 text-sm dark:text-black ${data.disableBlock ? 'bg-box-transparent' : block.category.color}`}
      >
        <i className="ri-focus-3-line" style={{ fontSize: 20, marginRight: 4, display: 'inline-block' }} />
        <span>{t('workflow.blocks.element-exists.name')}</span>
      </div>
      <p
        title={t('workflow.blocks.element-exists.selector')}
        className={`text-overflow bg-box-transparent mb-2 rounded-lg p-2 text-right text-sm${!data.description ? ' font-mono' : ''}`}
        style={{ maxWidth: '200px' }}
      >
        {data.description || data.selector || t('workflow.blocks.element-exists.selector')}
      </p>
      <p className="text-right text-gray-600 dark:text-gray-200">
        <span title={t('workflow.blocks.element-exists.fallbackTitle')}>&#9432;</span>
        {' '}
        {t('common.fallback')}
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

export default BlockElementExists;
