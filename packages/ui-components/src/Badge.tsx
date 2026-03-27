import React from 'react';

// Badge variants with status colors
export type BadgeVariant = 
  | 'default'
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'danger' 
  | 'warning' 
  | 'info'
  | 'error';

// Badge sizes
export type BadgeSize = 'sm' | 'md' | 'lg';

// Badge props interface
export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

/**
 * Badge component with status colors and size variants
 * 
 * @example
 * ```tsx
 * <Badge variant="success" size="md">Active</Badge>
 * <Badge variant="warning" dot>Pending</Badge>
 * <Badge variant="error" removable onRemove={() => {}}>Failed</Badge>
 * ```
 */
export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  dot = false, 
  removable = false, 
  onRemove, 
  className = '' 
}) => {
  const baseStyles = 'inline-flex items-center rounded-full font-medium transition-colors';
  
  // Status color variants
  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-cyan-100 text-cyan-800',
    error: 'bg-red-100 text-red-800',
  };

  // Dot indicator colors
  const dotStyles: Record<BadgeVariant, string> = {
    default: 'bg-gray-500',
    primary: 'bg-blue-500',
    secondary: 'bg-gray-500',
    success: 'bg-green-500',
    danger: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-cyan-500',
    error: 'bg-red-500',
  };

  // Size variants
  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-0.5 text-sm gap-1.5',
    lg: 'px-3 py-1 text-base gap-2',
  };

  const dotSizeStyles: Record<BadgeSize, string> = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  };

  const removeBtnSizeStyles: Record<BadgeSize, string> = {
    sm: 'w-3 h-3 ml-0.5 -mr-0.5',
    md: 'w-4 h-4 ml-0.5 -mr-1',
    lg: 'w-5 h-5 ml-1 -mr-1',
  };

  const removeIconSizeStyles: Record<BadgeSize, string> = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  };

  const classNames = [
    baseStyles, 
    variantStyles[variant], 
    sizeStyles[size], 
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames}>
      {dot && (
        <span 
          className={[
            'rounded-full', 
            dotStyles[variant], 
            dotSizeStyles[size]
          ].join(' ')} 
        />
      )}
      {children}
      {removable && (
        <button 
          onClick={onRemove} 
          className={[
            'inline-flex items-center justify-center rounded-full hover:bg-black/10 transition-colors',
            removeBtnSizeStyles[size]
          ].join(' ')}
          aria-label="Remove"
          type="button"
        >
          <svg 
            className={removeIconSizeStyles[size]} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
      )}
    </span>
  );
};

Badge.displayName = 'Badge';
