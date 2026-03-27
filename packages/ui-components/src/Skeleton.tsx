import React from 'react';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ variant = 'text', width, height, className = '', lines }) => {
  const baseStyles = 'bg-gray-200 animate-pulse';
  const variantStyles = { text: 'rounded', circular: 'rounded-full', rectangular: 'rounded-lg', card: 'rounded-lg' };

  if (variant === 'text' && lines && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={[baseStyles, variantStyles.text, i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'].join(' ')}
            style={{ height: typeof height === 'number' ? `${height}px` : height || '1rem', width: i === lines - 1 && lines > 1 ? '75%' : typeof width === 'number' ? `${width}px` : width || '100%' }} />
        ))}
      </div>
    );
  }

  return <div className={[baseStyles, variantStyles[variant], className].join(' ')} style={{ width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height }} />;
};
