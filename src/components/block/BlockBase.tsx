import React, { useState, useRef, useContext } from 'react';
import { useTranslation } from 'react-i18next';
// TODO: import excludeGroupBlocks from '@/utils/shared'
import { excludeGroupBlocks } from '@/utils/shared';

// TODO: replace with real React context types
const WorkflowContext = React.createContext<any>(null);
const WorkflowUtilsContext = React.createContext<any>(null);

interface BlockBaseProps {
  contentClass?: string;
  blockData?: Record<string, any>;
  data?: Record<string, any>;
  blockId?: string;
  children?: React.ReactNode;
  /** Named slot: prepend */
  prepend?: React.ReactNode;
  /** Named slot: append */
  append?: React.ReactNode;
  /** Named slot: action (extra menu buttons) */
  action?: React.ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  onUpdate?: (payload: Record<string, any>) => void;
  onSettings?: (payload: Record<string, any>) => void;
  [key: string]: any;
}

const BlockBase: React.FC<BlockBaseProps> = ({
  contentClass = '',
  blockData = {},
  data = {},
  blockId = '',
  children,
  prepend,
  append,
  action,
  onDelete,
  onEdit,
  onUpdate,
  onSettings,
  ...rest
}) => {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);
  // TODO: consume workflow/workflow-utils via React context
  const workflow = useContext(WorkflowContext);
  const workflowUtils = useContext(WorkflowUtilsContext);

  function insertToClipboard() {
    navigator.clipboard.writeText(blockId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1000);
  }

  function handleStartDrag(event: React.DragEvent<HTMLButtonElement>) {
    const payload = {
      data,
      fromBlockBasic: true,
      blockId,
      id: blockData?.details?.id,
    };
    event.dataTransfer.setData('block', JSON.stringify(payload));
  }

  function runWorkflow() {
    if (!workflowUtils) return;
    workflowUtils.executeFromBlock(blockId);
  }

  return (
    <div
      className="block-base relative w-48"
      data-block-id={blockId}
      onDoubleClick={(e) => { e.stopPropagation(); onEdit?.(); }}
      {...rest}
    >
      <div
        className="block-menu-container absolute top-0 hidden w-full"
        style={{ transform: 'translateY(-100%)' }}
      >
        <div className="pointer-events-none">
          <p
            title="Block id (click to copy)"
            className="block-menu pointer-events-auto text-overflow inline-block px-1 dark:text-gray-300"
            style={{ maxWidth: '96px', marginBottom: 0 }}
            onClick={insertToClipboard}
          >
            {isCopied ? '✅ Copied' : blockId}
          </p>
        </div>
        <div className="block-menu inline-flex items-center dark:text-gray-300">
          {!blockData?.details?.disableDelete && (
            <button title="Delete block" onClick={(e) => { e.stopPropagation(); onDelete?.(); }}>
              <i className="ri-delete-bin-7-line" style={{ fontSize: 20 }} />
            </button>
          )}
          <button
            title={t('workflow.blocks.base.settings.title')}
            onClick={(e) => {
              e.stopPropagation();
              onSettings?.({ details: blockData?.details, data, blockId });
            }}
          >
            <i className="ri-settings-3-line" style={{ fontSize: 20 }} />
          </button>
          {!excludeGroupBlocks.includes(blockData?.details?.id) && (
            <button
              title={t('workflow.blocks.base.moveToGroup')}
              draggable
              className="cursor-move"
              onDragStart={handleStartDrag}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <i className="ri-drag-drop-line" style={{ fontSize: 20 }} />
            </button>
          )}
          {blockData?.details?.id !== 'trigger' && (
            <button
              title="Enable/Disable block"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate?.({ disableBlock: !data.disableBlock });
              }}
            >
              <i
                className={data.disableBlock ? 'ri-toggle-line' : 'ri-toggle-fill'}
                style={{ fontSize: 20 }}
              />
            </button>
          )}
          <button title="Run workflow from here" onClick={(e) => { e.stopPropagation(); runWorkflow(); }}>
            <i className="ri-play-line" style={{ fontSize: 20 }} />
          </button>
          {!blockData?.details?.disableEdit && (
            <button title="Edit block" onClick={() => onEdit?.()}>
              <i className="ri-pencil-line" style={{ fontSize: 20 }} />
            </button>
          )}
          {action}
        </div>
      </div>
      {prepend}
      {/* ui-card equivalent */}
      <div className={`block-base__content relative z-10 ${contentClass}`}>
        {workflow?.data?.value?.testingMode && (
          <i
            className={`ri-record-circle-fill absolute left-0 top-0${data.$breakpoint ? ' text-red-500 dark:text-red-400' : ''}`}
            title="Set as breakpoint"
            style={{ fontSize: 20 }}
            onClick={() => onUpdate?.({ $breakpoint: !data.$breakpoint })}
          />
        )}
        {children}
      </div>
      {append}
    </div>
  );
};

export { WorkflowContext, WorkflowUtilsContext };
export default BlockBase;
