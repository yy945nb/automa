import React from 'react';
import { icons } from '@/lib/vRemixicon';

interface VRemixiconProps {
  name?: string;
  title?: string;
  viewBox?: string;
  size?: number | string;
  fill?: string;
  rotate?: number | string;
  path?: string;
  className?: string;
}

const iconMap = icons as Record<string, string>;

export default function VRemixicon({
  name = '',
  title,
  viewBox = '0 0 24 24',
  size = 24,
  fill = 'currentColor',
  rotate = 0,
  path: pathProp = '',
  className = '',
}: VRemixiconProps) {
  const iconPath = (() => {
    if (pathProp) return pathProp;
    const iconStr = iconMap[name];
    if (typeof iconStr === 'undefined') {
      console.error(`[VRemixicon] Icon name '${name}' not found in icon library. Please verify the icon name is correct.`);
      return null;
    }
    return iconStr;
  })();

  if (!iconPath) return null;

  return (
    <svg
      viewBox={viewBox}
      fill={fill}
      height={size}
      width={size}
      className={`v-remixicon ${className}`.trim()}
      xmlns="http://www.w3.org/2000/svg"
      style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
    >
      {title && <title>{title}</title>}
      <g>
        <path fill="none" d="M0 0h24v24H0z" />
        <path fillRule="nonzero" d={iconPath} />
      </g>
    </svg>
  );
}
