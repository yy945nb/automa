import React from 'react';
import { useTranslation } from 'react-i18next';
// TODO: import Handle, Position from react-flow equivalent
// import { Handle, Position } from 'reactflow';
// TODO: import useEditorBlock, useBlockValidation, useComponentId from composables
import BlockBase from './BlockBase';

interface BlockBasicWithFallbackProps {
  id?: string;
  label?: string;
  data?: Record<string, any>;
  onDelete?: (id: string) => void;
  onEdit?: () => void;
  onUpdate?: (payload: Record<string, any>) => void;
  onSettings?: (payload: Record<string, any>) => void;
  children?: React.ReactNode | ((props: { block: any }) => React.ReactNode);
}

const BlockBasicWithFallback: React.FC<BlockBasicWithFallbackProps> = ({
  id = '',
  label = '',
  data = {},
  onDelete,
  onEdit,
  onUpdate,
  onSettings,
  children,
}) => {
  const { t } = useTranslation();

  // TODO: replace with real hook implementations
  // const block = useEditorBlock(label);
  // const componentId = useComponentId('block-base');
  // const { errors: blockErrors } = useBlockValidation(label, () => data);
  const block: any = { details: { id: label, icon: 'riGlobalLine', name: label }, category: { color: 'bg-blue-500' } };
  const componentId = `block-base-${id}`;
  const blockErrors: string | null = null;

  return (
    <BlockBase
      id={componentId}
      data={data}
      blockId={id}
      blockData={block}
      className="block-basic group"
      onEdit={onEdit}
      onDelete={() => onDelete?.(id)}
      onUpdate={onUpdate}
      onSettings={onSettings}
    >
      {/* TODO: Handle - <Handle id={`${id}-input-1`} type="target" position={Position.Left} /> */}
      <div data-handle-id={`${id}-input-1`} data-handle-type="target" data-handle-position="left" />
      <div className="flex items-center">
        <span
          className={`mr-2 inline-block rounded-lg p-2 dark:text-black ${data.disableBlock ? 'bg-box-transparent' : block.category.color}`}
        >
          <i className={block.details.icon || 'riGlobalLine'} />
        </span>
        <div className="flex-1 overflow-hidden">
          {block.details.id && (
            <p className="text-overflow whitespace-nowrap font-semibold leading-tight">
              {t(`workflow.blocks.${block.details.id}.name`)}
            </p>
          )}
          <p className="text-overflow leading-tight text-gray-600 dark:text-gray-200">
            {data.description}
          </p>
        </div>
      </div>
      {blockErrors && (
        <span
          title={blockErrors}
          className="absolute top-2 right-2 text-red-500 dark:text-red-400"
        >
          <i className="ri-alert-line" style={{ fontSize: 20 }} />
        </span>
      )}
      {typeof children === 'function' ? (children as (p: any) => React.ReactNode)({ block }) : children}
      {/* Fallback row is always shown in this variant */}
      <div className="fallback flex items-center justify-end">
        {block && (
          <i
            className="ri-information-line"
            title={t('workflow.blocks.base.onError.fallbackTitle')}
            style={{ fontSize: 18 }}
          />
        )}
        <span className="ml-1">{t('common.fallback')}</span>
      </div>
      {/* TODO: Handle - <Handle id={`${id}-output-1`} type="source" position={Position.Right} /> */}
      <div data-handle-id={`${id}-output-1`} data-handle-type="source" data-handle-position="right" />
      {/* TODO: Handle - <Handle id={`${id}-output-fallback`} type="source" position={Position.Right} style={{ top: 'auto', bottom: 10 }} /> */}
      <div
        data-handle-id={`${id}-output-fallback`}
        data-handle-type="source"
        data-handle-position="right"
        style={{ top: 'auto', bottom: 10 }}
      />
    </BlockBase>
  );
};

export default BlockBasicWithFallback;
