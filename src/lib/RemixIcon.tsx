import React from 'react';
import { icons } from './vRemixicon';

interface RemixIconProps {
  name: string;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  viewBox?: string;
  fill?: string;
  rotate?: number | string;
  path?: string;
  onClick?: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export default function RemixIcon({
  name,
  size = 24,
  className = '',
  style = {},
  title,
  viewBox = '0 0 24 24',
  fill = 'currentColor',
  rotate = 0,
  path: pathProp = '',
  onClick,
  onMouseDown,
}: RemixIconProps) {
  const iconPath = pathProp || (icons as Record<string, string>)[name];

  if (!iconPath) {
    console.error(`[RemixIcon] Icon "${name}" not found`);
    return null;
  }

  return (
    <svg
      viewBox={viewBox}
      fill={fill}
      height={size}
      width={size}
      className={`v-remixicon ${className}`.trim()}
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined, ...style }}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      {title && <title>{title}</title>}
      <g>
        <path fill="none" d="M0 0h24v24H0z" />
        <path fillRule="nonzero" d={iconPath} />
      </g>
    </svg>
  );
}
