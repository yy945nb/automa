import React, { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';
// TODO: import Handle, Position from react-flow equivalent
// TODO: import useEditorBlock, useComponentId from composables
// TODO: import draggable equivalent for React
// import { useToast } from 'react-toastification';
import { tasks, excludeGroupBlocks } from '@/utils/shared';
import { WorkflowContext } from './BlockBase';
import BlockBase from './BlockBase';

interface BlockItem {
  id: string;
  itemId: string;
  data: Record<string, any>;
}

interface BlockGroupProps {
  id?: string;
  label?: string;
  data?: {
    name?: string;
    blocks?: BlockItem[];
    disableBlock?: boolean;
    [key: string]: any;
  };
  editor?: Record<string, any>;
  events?: Record<string, any>;
  onDelete?: (id: string) => void;
  onEdit?: (payload?: any) => void;
  onUpdate?: (payload: Record<string, any>) => void;
  onSettings?: (payload: Record<string, any>) => void;
}

const BlockGroup: React.FC<BlockGroupProps> = ({
  id = '',
  label = '',
  data = {},
  editor,
  events = {},
  onDelete,
  onEdit,
  onUpdate,
  onSettings,
}) => {
  const { t, i18n } = useTranslation();
  const workflow = useContext(WorkflowContext);

  // TODO: replace with real hook implementations
  // const block = useEditorBlock(label);
  // const componentId = useComponentId('blocks-group');
  const block: any = { details: { id: label, icon: 'riFolderZipLine', name: label }, category: { color: 'bg-blue-500' } };
  const componentId = `blocks-group-${id}`;

  const blocks = useMemo<BlockItem[]>(() => {
    if (!data.blocks) return [];
    return Array.isArray(data.blocks) ? data.blocks : Object.values(data.blocks);
  }, [data.blocks]);

  function getTranslation(key: string, defText = '') {
    // TODO: use i18n.exists(key) when available
    return t(key, defText);
  }

  function editItemSettings(element: BlockItem) {
    onSettings?.({
      blockId: id,
      data: element.data,
      itemId: element.itemId,
      details: { id: element.id },
    });
  }

  function onDragStart(item: BlockItem, event: React.DragEvent<HTMLDivElement>) {
    event.dataTransfer.setData(
      'block',
      JSON.stringify({ ...(tasks as any)[item.id], ...item, fromGroup: true })
    );
  }

  function onDragEnd(itemId: string) {
    setTimeout(() => {
      const blockEl = document.querySelector(`[group-item-id="${itemId}"]`);
      if (blockEl) {
        const blockIndex = blocks.findIndex((item) => item.itemId === itemId);
        if (blockIndex !== -1) {
          const copyBlocks = [...(data.blocks || [])];
          copyBlocks.splice(blockIndex, 1);
          onUpdate?.({ blocks: copyBlocks });
        }
      }
    }, 200);
  }

  function editBlock(payload: BlockItem) {
    onEdit?.(payload);
  }

  function deleteItem(index: number, itemId: string) {
    const copyBlocks = [...(data.blocks || [])];
    // TODO: handle workflow.editState via context
    if (workflow?.editState?.blockData?.itemId === itemId) {
      workflow.editState.editing = false;
      workflow.editState.blockData = false;
    }
    copyBlocks.splice(index, 1);
    onUpdate?.({ blocks: copyBlocks });
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    let droppedBlock: any = null;
    try {
      droppedBlock = JSON.parse(event.dataTransfer.getData('block') || 'null');
    } catch {
      return;
    }
    if (!droppedBlock || droppedBlock.fromGroup) return;

    const { id: blockId_, data: blockData, blockId } = droppedBlock;
    const dropId: string = droppedBlock.id;

    if (excludeGroupBlocks.includes(dropId)) {
      // TODO: toast.error(t('workflow.blocks.blocks-group.cantAdd', { blockName: t(`workflow.blocks.${dropId}.name`) }));
      console.warn('Cannot add block to group:', dropId);
      return;
    }

    if (blockId) {
      onDelete?.(blockId);
    }

    const copyBlocks = [
      ...(data.blocks || []),
      { id: dropId, data: blockData, itemId: nanoid(5) },
    ];
    onUpdate?.({ blocks: copyBlocks });
  }

  function toggleBreakpoint(item: BlockItem, index: number) {
    const copyBlocks = [...(data.blocks || [])] as BlockItem[];
    copyBlocks[index] = {
      ...copyBlocks[index],
      data: {
        ...copyBlocks[index].data,
        $breakpoint: !item.data.$breakpoint,
      },
    };
    onUpdate?.({ blocks: copyBlocks });
  }

  return (
    <BlockBase
      id={componentId}
      data={data}
      blockId={id}
      blockData={block}
      className="w-64"
      contentClass="!p-0"
      onEdit={onEdit}
      onDelete={() => onDelete?.(id)}
      onUpdate={onUpdate}
      onSettings={onSettings}
    >
      {/* TODO: Handle - <Handle id={`${id}-input-1`} type="target" position={Position.Left} /> */}
      <div data-handle-id={`${id}-input-1`} data-handle-type="target" data-handle-position="left" />
      <div className="p-4">
        <div className="mb-2 flex items-center">
          <div
            className={`mr-4 inline-flex items-center rounded-lg p-2 text-sm dark:text-black ${data.disableBlock ? 'bg-box-transparent' : block.category.color}`}
          >
            <i
              className={block.details.icon || 'riFolderZipLine'}
              style={{ fontSize: 20, marginRight: 8, display: 'inline-block' }}
            />
            <span>{t('workflow.blocks.blocks-group.name')}</span>
          </div>
        </div>
        <input
          value={data.name ?? ''}
          placeholder={t('workflow.blocks.blocks-group.groupName')}
          type="text"
          className="w-full bg-transparent focus:ring-0"
          onKeyDown={(e) => e.stopPropagation()}
          onChange={(e) => onUpdate?.({ name: e.target.value })}
        />
      </div>
      {/* TODO: replace with react-sortable or @dnd-kit equivalent for draggable list */}
      <div
        className="nowheel scroll max-h-60 space-y-1 overflow-auto px-4 pb-4 text-sm"
        onMouseDown={(e) => e.stopPropagation()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {blocks.map((element, index) => (
          <div
            key={element.itemId}
            className="bg-input group flex items-center space-x-2 rounded-lg p-2"
            style={{ cursor: 'grab' }}
            data-block-id={element.id}
            draggable
            onDragStart={(e) => onDragStart(element, e)}
            onDragEnd={() => onDragEnd(element.itemId)}
          >
            <i
              className={(tasks as any)[element.id]?.icon ?? ''}
              style={{ fontSize: 20, flexShrink: 0 }}
            />
            <div className="flex-1 overflow-hidden leading-tight">
              <p className="text-overflow">
                {getTranslation(
                  `workflow.blocks.${element.id}.name`,
                  (tasks as any)[element.id]?.name
                )}
              </p>
              <p
                title={element.data.description}
                className="text-overflow text-gray-600 dark:text-gray-200"
              >
                {element.data.description}
              </p>
            </div>
            <div className="invisible group-hover:visible">
              {workflow?.data?.value?.testingMode && (
                <i
                  className={`ri-record-circle-line mr-2 inline-block cursor-pointer${element.data.$breakpoint ? ' text-red-500 dark:text-red-400' : ''}`}
                  title="Set as breakpoint"
                  style={{ fontSize: 18 }}
                  onClick={() => toggleBreakpoint(element, index)}
                />
              )}
              <i
                className="ri-pencil-line mr-2 inline-block cursor-pointer"
                style={{ fontSize: 18 }}
                onClick={() => editBlock(element)}
              />
              <i
                className="ri-settings-3-line mr-2 inline-block cursor-pointer"
                style={{ fontSize: 18 }}
                onClick={() => editItemSettings(element)}
              />
              <i
                className="ri-delete-bin-7-line inline-block cursor-pointer"
                style={{ fontSize: 18 }}
                onClick={() => deleteItem(index, element.itemId)}
              />
            </div>
          </div>
        ))}
        <div className="rounded-lg border border-dashed p-2 text-center text-gray-600 dark:text-gray-200">
          {t('workflow.blocks.blocks-group.dropText')}
        </div>
      </div>
      {/* TODO: Handle - <Handle id={`${id}-output-1`} type="source" position={Position.Right} /> */}
      <div data-handle-id={`${id}-output-1`} data-handle-type="source" data-handle-position="right" />
    </BlockBase>
  );
};

export default BlockGroup;
