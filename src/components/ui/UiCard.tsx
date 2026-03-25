import React from 'react';

interface UiCardProps {
  hover?: boolean;
  padding?: string;
  tag?: keyof JSX.IntrinsicElements;
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}

export default function UiCard({
  hover = false,
  padding = 'p-4',
  tag: Tag = 'div',
  className = '',
  children,
  ...rest
}: UiCardProps) {
  const classes = [
    'ui-card rounded-lg bg-white dark:bg-gray-800',
    padding,
    hover ? 'hover:shadow-xl hover:-translate-y-1' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
