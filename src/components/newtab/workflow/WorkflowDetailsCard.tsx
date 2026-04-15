import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import browser from 'webextension-polyfill';
import { getShortcut } from '@/composable/shortcut';
import { categories } from '@/utils/shared';
import { getBlocks } from '@/utils/getSharedData';
import Mousetrap from 'mousetrap';
import UiPopover from '@/components/ui/UiPopover';
import UiImg from '@/components/ui/UiImg';
import UiInput from '@/components/ui/UiInput';
import VRemixicon from '@/components/VRemixicon';
import WorkflowBlockList from './WorkflowBlockList';

interface Workflow {
  icon: string;
  name: string;
  description: string;
  [key: string]: any;
}

interface WorkflowDetailsCardProps {
  workflow: Workflow;
  dataChanged?: boolean;
  onUpdate?: (data: Record<string, any>) => void;
}

const pinnedCategory = {
  name: 'Pinned blocks',
  color: 'bg-accent',
};

const iconNames = [
  'mdiPackageVariantClosed',
  'riGlobalLine',
  'riFileTextLine',
  'riEqualizerLine',
  'riTimerLine',
  'riCalendarLine',
  'riFlashlightLine',
  'riLightbulbFlashLine',
  'riDatabase2Line',
  'riWindowLine',
  'riCursorLine',
  'riDownloadLine',
  'riCommandLine',
];

const copyBlocks = getBlocks();
delete copyBlocks['block-package'];

export default function WorkflowDetailsCard({
  workflow,
  dataChanged = false,
  onUpdate,
}: WorkflowDetailsCardProps) {
  const { t, i18n } = useTranslation();
  const te = useCallback(
    (key: string) => i18n.exists(key),
    [i18n]
  );

  const shortcutData = getShortcut('action:search');

  const [descriptionCollapsed, setDescriptionCollapsed] = useState(true);
  const [query, setQuery] = useState('');
  const [pinnedBlocks, setPinnedBlocks] = useState<string[]>([]);

  const blocksArr = useMemo(() => {
    return Object.entries(copyBlocks).map(([key, block]) => {
      const localeKey = `workflow.blocks.${key}.name`;
      return {
        ...(block as object),
        id: key,
        name: te(localeKey) ? t(localeKey) : (block as any).name,
      };
    });
  }, [t, te]);

  const blocks = useMemo(() => {
    return blocksArr.reduce<Record<string, any[]>>((arr, block: any) => {
      if (block.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())) {
        (arr[block.category] = arr[block.category] || []).push(block);
      }
      return arr;
    }, {});
  }, [blocksArr, query]);

  const pinnedBlocksList = useMemo(() => {
    return pinnedBlocks
      .map((id) => {
        const namePath = `workflow.blocks.${id}.name`;
        const blockData = copyBlocks[id];
        if (!blockData) return null;
        return {
          ...(blockData as object),
          id,
          name: te(namePath) ? t(namePath) : (blockData as any).name,
        };
      })
      .filter(
        (item): item is NonNullable<typeof item> =>
          item !== null &&
          item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
      );
  }, [pinnedBlocks, query, t, te]);

  const updateWorkflowIcon = useCallback(
    (value: string | number) => {
      const strValue = String(value);
      if (!strValue.startsWith('http')) return;
      const iconUrl = strValue.slice(0, 1024);
      onUpdate?.({ icon: iconUrl });
    },
    [onUpdate]
  );

  const pinBlock = useCallback(
    (block: { id: string }) => {
      setPinnedBlocks((prev) => {
        const index = prev.indexOf(block.id);
        if (index !== -1) {
          return prev.filter((_, i) => i !== index);
        }
        return [...prev, block.id];
      });
    },
    []
  );

  // Persist pinned blocks to browser storage
  useEffect(() => {
    browser.storage.local.set({ pinnedBlocks });
  }, [pinnedBlocks]);

  // Load pinned blocks on mount
  useEffect(() => {
    browser.storage.local.get('pinnedBlocks').then((item) => {
      setPinnedBlocks(item.pinnedBlocks || []);
    });
  }, []);

  // Bind keyboard shortcut for search
  useEffect(() => {
    Mousetrap.prototype.stopCallback = () => false;
    const combo = shortcutData.combo;
    const handler = (event: Event) => {
      event.preventDefault();
      const searchInput = document.querySelector('#search-input input') as HTMLInputElement | null;
      searchInput?.focus();
    };
    Mousetrap.bind(combo, handler);
    return () => {
      Mousetrap.unbind(combo);
    };
  }, [shortcutData.combo]);

  return (
    <>
      <div className="mb-2 mt-1 flex items-start px-4">
        <UiPopover className="mr-2 h-8" triggerSlot={() => (
          <span
            title={t('workflow.sidebar.workflowIcon')}
            className="inline-block h-full cursor-pointer"
          >
            {workflow.icon.startsWith('http') ? (
              <span className="inline-block h-8 w-8">
                <UiImg src={workflow.icon} />
              </span>
            ) : (
              <VRemixicon name={workflow.icon} size={26} className="mt-1" />
            )}
          </span>
        )}>
          <div className="w-56">
            <p className="mb-2">{t('workflow.sidebar.workflowIcon')}</p>
            <div className="mb-2 grid grid-cols-5 gap-1">
              {iconNames.map((icon) => (
                <span
                  key={icon}
                  className="hoverable inline-block cursor-pointer rounded-lg p-2 text-center"
                  onClick={() => onUpdate?.({ icon })}
                >
                  <VRemixicon name={icon} />
                </span>
              ))}
            </div>
            <UiInput
              modelValue={workflow.icon.startsWith('http') ? workflow.icon : ''}
              type="url"
              placeholder="http://example.com/img.png"
              label="Icon URL"
              onChange={updateWorkflowIcon}
            />
          </div>
        </UiPopover>
        <div className="flex-1 overflow-hidden">
          <p className="text-overflow mt-1 text-lg font-semibold leading-tight">
            {workflow.name}
          </p>
          <p
            className={`cursor-pointer leading-tight ${descriptionCollapsed ? 'line-clamp' : 'whitespace-pre-wrap'}`}
            onClick={() => setDescriptionCollapsed(!descriptionCollapsed)}
          >
            {workflow.description}
          </p>
        </div>
      </div>
      <div id="search-input">
        <UiInput
          modelValue={query}
          onChange={(val) => setQuery(String(val))}
          placeholder={`${t('common.search')}... (${shortcutData.readable})`}
          prependIcon="riSearch2Line"
          className="mt-4 mb-2 w-full px-4"
        />
      </div>
      <div className="scroll relative flex-1 overflow-auto bg-scroll px-4">
        {pinnedBlocksList.length > 0 && (
          <WorkflowBlockList
            modelValue={true}
            blocks={pinnedBlocksList}
            category={pinnedCategory}
            pinned={pinnedBlocks}
            onPin={pinBlock}
          />
        )}
        {Object.entries(blocks).map(([catId, items]) => (
          <WorkflowBlockList
            key={catId}
            modelValue={true}
            blocks={items}
            category={(categories as Record<string, any>)[catId]}
            pinned={pinnedBlocks}
            onPin={pinBlock}
          />
        ))}
      </div>
    </>
  );
}
