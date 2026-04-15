import React from 'react';

// Re-export icon data from vRemixicon.js icons map
// This is a React wrapper for the Vue v-remixicon component
import { icons } from '@/lib/vRemixicon';

interface VRemixiconProps {
  name: string;
  size?: string | number;
  fill?: string;
  viewBox?: string;
  rotate?: number;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}

const VRemixicon: React.FC<VRemixiconProps> = ({
  name,
  size = 24,
  fill = 'currentColor',
  viewBox = '0 0 24 24',
  rotate,
  title,
  className = '',
  style,
  onClick,
}) => {
  const iconPath = (icons as Record<string, string>)[name];

  if (!iconPath) {
    console.warn(`[VRemixicon] "${name}" icon not found`);
    return null;
  }

  const combinedStyle: React.CSSProperties = {
    ...style,
    ...(rotate ? { transform: `rotate(${rotate}deg)` } : {}),
  };

  return (
    <svg
      viewBox={viewBox}
      fill={fill}
      height={size}
      width={size}
      className={`v-remixicon ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      style={combinedStyle}
      onClick={onClick}
    >
      {title && <title>{title}</title>}
      <g>
        <path fill="none" d="M0 0h24v24H0z" />
        <path fillRule="nonzero" d={iconPath} />
      </g>
    </svg>
  );
};

export default VRemixicon;
