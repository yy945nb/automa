import React, { useRef } from 'react';
import { debounce } from '@/utils/helper';

const colors: Record<string, string> = {
  white: 'bg-white dark:bg-gray-800',
  red: 'bg-red-200 dark:bg-red-300',
  indigo: 'bg-indigo-200 dark:bg-indigo-300',
  green: 'bg-green-200 dark:bg-green-300',
  amber: 'bg-amber-200 dark:bg-amber-300',
  sky: 'bg-sky-200 dark:bg-sky-300',
};

const fontSize: Record<string, { name: string; class: string }> = {
  regular: { name: 'Regular', class: 'text-base' },
  medium: { name: 'Medium', class: 'text-xl' },
  large: { name: 'Large', class: 'text-2xl' },
  'extra-large': { name: 'Extra Large', class: 'text-3xl' },
};

interface BlockNoteProps {
  id?: string;
  label?: string;
  data?: {
    note?: string;
    color?: string;
    fontSize?: string;
    width?: number;
    height?: number;
    [key: string]: any;
  };
  onDelete?: (id: string) => void;
  onUpdate?: (payload: Record<string, any>) => void;
}

const BlockNote: React.FC<BlockNoteProps> = ({
  id = '',
  label = '',
  data = {},
  onDelete,
  onUpdate,
}) => {
  const updateDataDebounced = useRef(
    debounce((d: Record<string, any>) => onUpdate?.(d), 250)
  ).current;

  const initialSize = {
    width: data.width ? `${data.width}px` : undefined,
    height: data.height ? `${data.height}px` : undefined,
  };

  const colorKey = data.color || 'white';
  const colorClass = colors[colorKey] || colors.white;

  function onMouseup(event: React.MouseEvent<HTMLTextAreaElement>) {
    const target = event.currentTarget;
    let { height, width } = target.style;
    const w = parseInt(width, 10);
    const h = parseInt(height, 10);

    if (w === data.width && h === data.height) return;

    updateDataDebounced({ height: h, width: w });
  }

  return (
    <div
      className={`block-note rounded-lg p-4 ${colorKey} ${colorClass}`}
      style={{ minWidth: '192px' }}
    >
      <div className="flex items-center border-b pb-2">
        <i className="ri-file-edit-line" style={{ fontSize: 20 }} />
        <p className="mx-2 flex-1 font-semibold">Note</p>
        {/* TODO: ui-popover equivalent - for now render color buttons inline */}
        <details className="note-color relative">
          <summary className="cursor-pointer list-none">
            <i className="ri-settings-3-line cursor-pointer" style={{ fontSize: 20 }} />
          </summary>
          <div className="absolute right-0 z-10 rounded-lg bg-white p-2 shadow-lg dark:bg-gray-800">
            <p className="mb-1 ml-1 text-sm text-gray-600 dark:text-gray-200">Colors</p>
            <div className="flex items-center space-x-2">
              {Object.entries(colors).map(([colorId, colorCls]) => (
                <span
                  key={colorId}
                  className={`${colorCls} inline-block h-8 w-8 cursor-pointer rounded-full`}
                  style={{ borderWidth: '3px' }}
                  onClick={() => updateDataDebounced({ color: colorId })}
                />
              ))}
            </div>
            <div className="mt-2 w-full">
              <label className="text-sm">Font size</label>
              <select
                value={data.fontSize ?? 'regular'}
                className="mt-1 w-full"
                onChange={(e) => updateDataDebounced({ fontSize: e.target.value })}
              >
                {Object.entries(fontSize).map(([fontId, { name }]) => (
                  <option key={fontId} value={fontId}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </details>
        <hr className="mx-2 h-7 border-r" />
        <i
          className="ri-delete-bin-7-line cursor-pointer"
          style={{ fontSize: 20 }}
          onClick={() => onDelete?.(id)}
        />
      </div>
      <textarea
        value={data.note ?? ''}
        style={{ ...initialSize, resize: 'both', minWidth: '280px', minHeight: '168px' }}
        className={`mt-2 bg-transparent focus:ring-0 ${fontSize[data.fontSize || 'regular']?.class ?? 'text-base'}`}
        placeholder="Write a note here..."
        cols={30}
        rows={7}
        onKeyDown={(e) => e.stopPropagation()}
        onChange={(e) => updateDataDebounced({ note: e.target.value })}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={onMouseup}
      />
    </div>
  );
};

export default BlockNote;
