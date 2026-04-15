import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getBlocks } from '@/utils/getSharedData';
import UiExpand from '@/components/ui/UiExpand';
import VRemixicon from '@/components/VRemixicon';

interface BlockItem {
  id: string;
  name: string;
  icon: string;
  description?: string;
  tag?: string;
  [key: string]: any;
}

interface CategoryItem {
  name: string;
  color: string;
}

interface WorkflowBlockListProps {
  modelValue?: boolean;
  blocks: BlockItem[];
  category: CategoryItem;
  pinned: string[];
  onPin?: (block: BlockItem) => void;
}

const blocksDetail = getBlocks();

function getBlockTitle(
  block: BlockItem,
  t: (key: string) => string,
  te: (key: string) => boolean
): string {
  const { description, id, name } = block;
  const blockPath = `workflow.blocks.${id}`;
  if (!te(blockPath)) return blocksDetail[id]?.name ?? name;

  const descPath = `${blockPath}.${description ? 'description' : 'name'}`;
  let blockDescription = te(descPath) ? t(descPath) : name;

  if (description) {
    blockDescription = `[${t(`${blockPath}.name`)}]\n${blockDescription}`;
  }

  return blockDescription;
}

function getIconPath(path: string): string {
  if (path && path.startsWith('path')) {
    const parts = path.split(':');
    return parts[1] || '';
  }
  return '';
}

export default function WorkflowBlockList({
  modelValue = true,
  blocks,
  category,
  pinned,
  onPin,
}: WorkflowBlockListProps) {
  const { t, i18n } = useTranslation();
  const te = useCallback(
    (key: string) => i18n.exists(key),
    [i18n]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, block: BlockItem) => {
      e.dataTransfer.setData('block', JSON.stringify(block));
    },
    []
  );

  return (
    <UiExpand
      modelValue={modelValue}
      hideHeaderIcon
      headerClass="flex items-center py-2 focus:ring-0 w-full text-left text-gray-600 dark:text-gray-200"
      headerSlot={(show: boolean) => (
        <>
          <span className={`${category.color} h-3 w-3 rounded-full`} />
          <p className="ml-2 flex-1 capitalize">{category.name}</p>
          <VRemixicon name={show ? 'riSubtractLine' : 'riAddLine'} size={20} />
        </>
      )}
    >
      <div className="mb-4 grid grid-cols-2 gap-2">
        {blocks.map((block) => (
          <div
            key={block.id}
            title={getBlockTitle(block, t, te)}
            draggable
            className="bg-input group relative cursor-move select-none rounded-lg p-4 transition"
            onDragStart={(e) => handleDragStart(e, block)}
          >
            <div className="invisible absolute right-2 top-2 flex items-center text-gray-600 group-hover:visible dark:text-gray-300">
              <a
                href={`https://docs.extension.automa.site/blocks/${block.id}.html`}
                title={t('common.docs')}
                target="_blank"
                rel="noopener"
              >
                <VRemixicon name="riInformationLine" size={18} />
              </a>
              <span
                title={`${pinned.includes(block.id) ? 'Unpin' : 'Pin'} block`}
                className="ml-1 cursor-pointer"
                onClick={() => onPin?.(block)}
              >
                <VRemixicon
                  size={18}
                  name={pinned.includes(block.id) ? 'riPushpin2Fill' : 'riPushpin2Line'}
                />
              </span>
            </div>
            {block.icon.startsWith('http') ? (
              <img
                src={block.icon}
                alt=""
                width={24}
                className="mb-2 dark:invert"
              />
            ) : (
              <VRemixicon
                path={getIconPath(block.icon)}
                name={block.icon}
                size={24}
                className="mb-2"
              />
            )}
            <p className="text-overflow capitalize leading-tight">{block.name}</p>
            {block.tag && (
              <div className="absolute right-0 top-0 flex h-[22px] min-w-[52px] items-center justify-center rounded-bl-[22px] rounded-tl-0 rounded-br-0 rounded-tr-lg bg-[#79FFEB] text-sm font-semibold group-hover:invisible dark:bg-[#2DD4BF] dark:text-gray-900">
                {block.tag}
              </div>
            )}
          </div>
        ))}
      </div>
    </UiExpand>
  );
}
