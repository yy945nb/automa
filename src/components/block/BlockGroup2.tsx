import React, { useRef, useEffect } from 'react';

interface BlockGroup2Props {
  id?: string;
  label?: string;
  data?: {
    name?: string;
    width?: number;
    height?: number;
    [key: string]: any;
  };
  position?: Record<string, any>;
  events?: Record<string, any>;
  dimensions?: Record<string, any>;
  onDelete?: (id: string) => void;
  onEdit?: () => void;
  onUpdate?: (payload: Record<string, any>) => void;
}

const BlockGroup2: React.FC<BlockGroup2Props> = ({
  id = '',
  label = '',
  data = {},
  position = {},
  events = {},
  dimensions = {},
  onDelete,
  onEdit,
  onUpdate,
}) => {
  const dragHandleRef = useRef<HTMLSpanElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const initialRect = useRef({ x: 0, y: 0, width: 0, height: 0 });

  function onMousemove(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!parentRef.current) return;

    const width = initialRect.current.width + event.clientX - initialRect.current.x;
    const height = initialRect.current.height + event.clientY - initialRect.current.y;

    parentRef.current.style.width = `${width}px`;
    parentRef.current.style.height = `${height}px`;

    onUpdate?.({ height, width });
  }

  function onMouseup() {
    document.documentElement.removeEventListener('mouseup', onMouseup);
    document.documentElement.removeEventListener('mousemove', onMousemove);
  }

  function initDragging(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!parentRef.current) return;

    const { height, width } = getComputedStyle(parentRef.current);

    initialRect.current.x = event.clientX;
    initialRect.current.y = event.clientY;
    initialRect.current.width = parseInt(width, 10);
    initialRect.current.height = parseInt(height, 10);

    document.documentElement.addEventListener('mouseup', onMouseup);
    document.documentElement.addEventListener('mousemove', onMousemove);
  }

  useEffect(() => {
    const handle = dragHandleRef.current;
    if (!handle) return;

    handle.addEventListener('mousedown', initDragging);
    return () => {
      handle.removeEventListener('mousedown', initDragging);
      document.documentElement.removeEventListener('mouseup', onMouseup);
      document.documentElement.removeEventListener('mousemove', onMousemove);
    };
  }, []);

  return (
    <div
      ref={parentRef}
      style={{
        width: `${data.width || 400}px`,
        height: `${data.height || 300}px`,
        minWidth: '400px',
        minHeight: '300px',
        borderColor: '#2563eb',
        backgroundColor: 'rgb(37, 99, 235, 0.3)',
      }}
      className="group-block-2 group relative rounded-lg border-2"
    >
      <div className="flex items-center p-4">
        <input
          value={data.name ?? ''}
          placeholder="name"
          type="text"
          className="rounded-lg bg-white px-4 py-2"
          onChange={(e) => onUpdate?.({ name: e.target.value })}
        />
        <div className="flex-1" />
        <i
          className="ri-delete-bin-7-line cursor-pointer"
          onClick={() => onDelete?.(id)}
        />
      </div>
      <span
        ref={dragHandleRef}
        style={{ cursor: 'nw-resize' }}
        className="drag-handle invisible absolute bottom-0 right-0 h-4 w-4 bg-accent group-hover:visible"
      />
    </div>
  );
};

export default BlockGroup2;
