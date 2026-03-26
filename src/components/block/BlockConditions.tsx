import React from 'react';
import { useTranslation } from 'react-i18next';
// TODO: import Handle, Position from react-flow equivalent
// import { Handle, Position } from 'reactflow';
// TODO: import useEditorBlock, useComponentId from composables
import BlockBase from './BlockBase';

interface Condition {
  id: string;
  name?: string;
  compareValue?: string;
  type?: string;
  value?: string;
}

interface BlockConditionsProps {
  id?: string;
  label?: string;
  data?: {
    disableBlock?: boolean;
    description?: string;
    conditions?: Condition[];
    [key: string]: any;
  };
  onDelete?: (id: string) => void;
  onEdit?: (payload?: any) => void;
  onUpdate?: (payload: Record<string, any>) => void;
  onSettings?: (payload: Record<string, any>) => void;
}

const BlockConditions: React.FC<BlockConditionsProps> = ({
  id = '',
  label = '',
  data = {},
  onDelete,
  onEdit,
  onUpdate,
  onSettings,
}) => {
  const { t } = useTranslation();
  const conditions: Condition[] = data.conditions ?? [];

  // TODO: replace with real hook implementations
  // const block = useEditorBlock(label);
  // const componentId = useComponentId('block-conditions');
  const block: any = { details: { id: label, icon: 'riAB', name: label }, category: { color: 'bg-blue-500' } };
  const componentId = `block-conditions-${id}`;

  return (
    <BlockBase
      id={componentId}
      data={data}
      blockId={id}
      blockData={block}
      className="w-64"
      onEdit={onEdit}
      onDelete={() => onDelete?.(id)}
      onUpdate={onUpdate}
      onSettings={onSettings}
    >
      {/* TODO: Handle - <Handle id={`${id}-input-1`} type="target" position={Position.Left} /> */}
      <div data-handle-id={`${id}-input-1`} data-handle-type="target" data-handle-position="left" />
      <div className="flex items-center">
        <div
          className={`mr-4 inline-block rounded-lg p-2 text-sm dark:text-black ${data.disableBlock ? 'bg-box-transparent' : block.category.color}`}
        >
          <i className="ri-a-b" style={{ fontSize: 20, marginRight: 4, display: 'inline-block' }} />
          <span>{t('workflow.blocks.conditions.name')}</span>
        </div>
      </div>
      <p
        className="text-overflow mt-2 leading-tight text-gray-600 dark:text-gray-200"
        style={{ display: data.description ? '' : 'none' }}
      >
        {data.description}
      </p>
      {conditions.length > 0 && (
        <ul className="mt-4 space-y-2">
          {conditions.map((item) => (
            <li
              key={item.id}
              className="bg-box-transparent relative flex w-full flex-1 items-center rounded-lg p-2"
              onDoubleClick={(e) => { e.stopPropagation(); onEdit?.({ editCondition: item.id }); }}
            >
              {item.name ? (
                <p className="text-overflow w-full text-right" title={item.name}>
                  {item.name}
                </p>
              ) : (
                <>
                  <p className="text-overflow w-5/12 text-right">{item.compareValue || '_____'}</p>
                  <p className="mx-1 w-2/12 text-center font-mono">{item.type}</p>
                  <p className="text-overflow w-5/12">{item.value || '_____'}</p>
                </>
              )}
              {/* TODO: Handle - <Handle id={`${id}-output-${item.id}`} position={Position.Right} style={{ marginRight: '-33px' }} type="source" /> */}
              <div
                data-handle-id={`${id}-output-${item.id}`}
                data-handle-type="source"
                data-handle-position="right"
                style={{ marginRight: '-33px' }}
              />
            </li>
          ))}
          {conditions.length > 0 && (
            <p className="text-right text-gray-600 dark:text-gray-200">
              <span title="Fallback"> &#9432; </span>
              Fallback
            </p>
          )}
        </ul>
      )}
      {conditions.length > 0 && (
        /* TODO: Handle - <Handle id={`${id}-output-fallback`} position={Position.Right} type="source" style={{ top: 'auto', bottom: 10 }} /> */
        <div
          data-handle-id={`${id}-output-fallback`}
          data-handle-type="source"
          data-handle-position="right"
          style={{ top: 'auto', bottom: 10 }}
        />
      )}
    </BlockBase>
  );
};

export default BlockConditions;
