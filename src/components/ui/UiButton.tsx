import React from 'react';
import UiSpinner from './UiSpinner';

const variants = {
  transparent: {
    default: 'hoverable',
  },
  fill: {
    default: 'bg-input',
    accent:
      'bg-accent hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-black text-white',
    primary:
      'bg-primary text-white dark:bg-secondary dark:hover:bg-primary hover:bg-secondary',
    danger:
      'bg-red-400 text-white dark:bg-red-500 dark:hover:bg-red-500 hover:bg-red-400',
  },
} as const;

interface UiButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: boolean;
  loading?: boolean;
  circle?: boolean;
  color?: string;
  tag?: keyof JSX.IntrinsicElements;
  btnType?: keyof typeof variants;
  variant?: string;
  children?: React.ReactNode;
}

export default function UiButton({
  icon = false,
  disabled = false,
  loading = false,
  circle = false,
  color = '',
  tag: Tag = 'button',
  btnType = 'fill',
  variant = 'default',
  className = '',
  children,
  ...rest
}: UiButtonProps) {
  const variantColor =
    color ||
    (variants[btnType] as Record<string, string>)?.[variant] ||
    'bg-input';

  const classes = [
    'ui-button relative h-10 transition',
    variantColor,
    icon ? 'p-2' : 'py-2 px-4',
    circle ? 'rounded-full' : 'rounded-lg',
    disabled ? 'opacity-70' : '',
    loading || disabled ? 'pointer-events-none' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const spinnerColor =
    variant === 'default' ? 'text-primary' : 'text-white dark:text-gray-900';

  return (
    <Tag
      role="button"
      className={classes}
      disabled={loading || disabled}
      {...(rest as React.HTMLAttributes<HTMLElement>)}
    >
      <span className={`flex h-full items-center justify-center ${loading ? 'opacity-25' : ''}`}>
        {children}
      </span>
      {loading && (
        <div className="button-loading">
          <UiSpinner color={spinnerColor} />
        </div>
      )}
      <style>{`
        .button-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
      `}</style>
    </Tag>
  );
}
