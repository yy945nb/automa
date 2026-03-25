import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
// TODO: import Handle, Position from react-flow equivalent
// import { Handle, Position } from 'reactflow';
// TODO: import useEditorBlock, useBlockValidation, useComponentId from composables
// import { useEditorBlock } from '@/composable/editorBlock';
// import { useBlockValidation } from '@/composable/blockValidation';
// import { useComponentId } from '@/composable/componentId';
import BlockBase from './BlockBase';

interface BlockBasicProps {
  id?: string;
  label?: string;
  data?: Record<string, any>;
  position?: Record<string, any>;
  events?: Record<string, any>;
  dimensions?: Record<string, any>;
  onDelete?: (id: string) => void;
  onEdit?: () => void;
  onUpdate?: (payload: Record<string, any>) => void;
  onSettings?: (payload: Record<string, any>) => void;
  children?: React.ReactNode | ((props: { block: any }) => React.ReactNode);
}

const loopBlocks = ['loop-data', 'loop-elements'];

const BlockBasic: React.FC<BlockBasicProps> = ({
  id = '',
  label = '',
  data = {},
  position = {},
  events = {},
  dimensions = {},
  onDelete,
  onEdit,
  onUpdate,
  onSettings,
  children,
}) => {
  const { t, i18n } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);

  // TODO: replace with real hook implementations
  // const block = useEditorBlock(label);
  // const componentId = useComponentId('block-base');
  // const { errors: blockErrors } = useBlockValidation(label, () => data);
  const block: any = { details: { id: label, icon: 'riGlobalLine', name: label }, category: { color: 'bg-blue-500' } };
  const componentId = `block-base-${id}`;
  const blockErrors: string | null = null;

  const showTextToCopy = useMemo(() => {
    if (loopBlocks.includes(block.details.id) && data.loopId) {
      return { name: 'Loop id', value: data.loopId };
    }
    if (block.details.id === 'google-sheets' && data.refKey) {
      return { name: 'Reference key', value: data.refKey };
    }
    return null;
  }, [block.details.id, data.loopId, data.refKey]);

  function insertToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1000);
  }

  function getBlockName() {
    const key = `workflow.blocks.${block.details.id}.name`;
    // TODO: check if key exists with i18n.exists(key)
    return t(key, block.details.name);
  }

  function getIconPath(path: string) {
    if (path && path.startsWith('path')) {
      const [, iconPath] = path.split(':');
      return iconPath;
    }
    return '';
  }

  return (
    <BlockBase
      id={componentId}
      data={data}
      blockId={id}
      blockData={block}
      data-position={JSON.stringify(position)}
      className="block-basic group"
      onEdit={onEdit}
      onDelete={() => onDelete?.(id)}
      onUpdate={onUpdate}
      onSettings={onSettings}
    >
      {/* TODO: Handle from reactflow - <Handle id={`${id}-input-1`} type="target" position={Position.Left} /> */}
      {label !== 'trigger' && (
        <div data-handle-id={`${id}-input-1`} data-handle-type="target" data-handle-position="left" />
      )}
      <div className="flex items-center">
        <span
          className={`mr-2 inline-block rounded-lg p-2 dark:text-black ${data.disableBlock ? 'bg-box-transparent' : block.category.color}`}
        >
          {block.details.name === 'AI Workflow' ? (
            <svg width="31.2" height="31.2" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.22626 4.28601V8.14343H1.36884V4.28601H5.22626Z" stroke="black" />
              <path d="M12.6076 0.50061V3.64319H9.46503V0.50061H12.6076Z" stroke="black" />
              <path d="M12.6309 8.35657V11.4991H9.48834V8.35657H12.6309Z" stroke="black" />
              <path d="M5.66516 6.37384H7.27247V2.13159H9.45839" stroke="black" />
              <path d="M5.15082 6.43445H7.26688V9.9986H9.91184" stroke="black" />
            </svg>
          ) : (
            <i
              className={block.details.icon || 'riGlobalLine'}
              data-icon-path={getIconPath(block.details.icon)}
            />
          )}
        </span>
        <div className="flex-1 overflow-hidden">
          {blockErrors && (
            <span
              title={blockErrors}
              className="absolute top-2 right-2 text-red-500 dark:text-red-400"
            >
              <i className="ri-alert-line" style={{ fontSize: 20 }} />
            </span>
          )}
          {block.details.id && (
            <p className="text-overflow whitespace-nowrap font-semibold leading-tight">
              {getBlockName()}
            </p>
          )}
          <p className={`text-overflow leading-tight text-gray-600 dark:text-gray-200${data.description && data.loopId ? ' mb-1' : ''}`}>
            {data.description}
          </p>
          {showTextToCopy && (
            <span
              title={`${showTextToCopy.name} (click to copy)`}
              className="bg-box-transparent text-overflow absolute bottom-0 right-0 rounded-sm rounded-br-lg py-px px-1 text-xs text-gray-600 dark:text-gray-200"
              style={{ maxWidth: '40%', cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); insertToClipboard(showTextToCopy.value); }}
            >
              {isCopied ? '✅ Copied' : showTextToCopy.value}
            </span>
          )}
        </div>
      </div>
      {typeof children === 'function' ? (children as (p: any) => React.ReactNode)({ block }) : children}
      {data.onError?.enable && data.onError?.toDo === 'fallback' && (
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
      )}
      {/* TODO: Handle - <Handle id={`${id}-output-1`} type="source" position={Position.Right} /> */}
      <div data-handle-id={`${id}-output-1`} data-handle-type="source" data-handle-position="right" />
      {data.onError?.enable && data.onError?.toDo === 'fallback' && (
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

export default BlockBasic;
