import React from 'react';

interface HighlightItem {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  highlight?: boolean;
  outline?: boolean;
  [key: string]: any;
}

interface SharedElementHighlighterProps {
  items?: Record<string, HighlightItem> | HighlightItem[];
  stroke?: string | null;
  activeStroke?: string | null;
  fill?: string | null;
  activeFill?: string | null;
}

function getNumber(num: number | undefined | null): number {
  if (num == null || Number.isNaN(num)) return 0;
  return num;
}

function getFillColor(
  item: HighlightItem | undefined,
  fill: string | null | undefined,
  activeFill: string | null | undefined
): string | undefined {
  if (!item) return undefined;
  if (item.outline) return undefined;
  return item.highlight ? fill ?? undefined : activeFill ?? fill ?? undefined;
}

function getStrokeColor(
  item: HighlightItem | undefined,
  stroke: string | null | undefined,
  activeStroke: string | null | undefined
): string | undefined {
  if (!item) return undefined;
  return item.highlight ? stroke ?? undefined : activeStroke ?? stroke ?? undefined;
}

const SharedElementHighlighter: React.FC<SharedElementHighlighterProps> = ({
  items = {},
  stroke = null,
  activeStroke = null,
  fill = null,
  activeFill = null,
}) => {
  const itemArray: (HighlightItem | undefined)[] = Array.isArray(items)
    ? items
    : Object.values(items as Record<string, HighlightItem>);

  return (
    <>
      {itemArray.map((item, index) => (
        <rect
          key={index}
          x={getNumber(item?.x)}
          y={getNumber(item?.y)}
          fill={getFillColor(item, fill, activeFill)}
          stroke={getStrokeColor(item, stroke, activeStroke)}
          width={getNumber(item?.width)}
          height={getNumber(item?.height)}
          strokeDasharray={item?.outline ? '5,5' : undefined}
          strokeWidth={2}
        />
      ))}
    </>
  );
};

export default SharedElementHighlighter;
