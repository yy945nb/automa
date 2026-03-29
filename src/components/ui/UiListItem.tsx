import React from 'react';

interface UiListItemProps {
  active?: boolean;
  disabled?: boolean;
  small?: boolean;
  tag?: keyof JSX.IntrinsicElements;
  color?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}

export default function UiListItem({
  active = false,
  disabled = false,
  small = false,
  tag: Tag = 'div',
  color = 'bg-primary text-primary dark:bg-secondary dark:text-secondary bg-opacity-10 dark:bg-opacity-10',
  className = '',
  children,
  ...rest
}: UiListItemProps) {
  const classes = [
    'ui-list-item flex w-full items-center rounded-lg transition focus:outline-none',
    active ? color : 'hoverable',
    small ? 'p-2' : 'py-2 px-4',
    disabled ? 'pointer-events-none bg-opacity-75' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} role="listitem" {...rest}>
      {children}
    </Tag>
  );
}
