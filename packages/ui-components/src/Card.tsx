import React from 'react';

// Card variants
export type CardVariant = 'default' | 'outlined' | 'elevated';

// Card props interface
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
  hover?: boolean;
  padding?: boolean;
  fullWidth?: boolean;
}

// CardHeader props interface
export interface CardHeaderProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  bordered?: boolean;
}

// CardBody props interface
export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

// CardFooter props interface
export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
  align?: 'left' | 'center' | 'right';
}

// CardActions props interface
export interface CardActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  spacing?: 'sm' | 'md' | 'lg';
}

/**
 * Card component with composable slots
 * 
 * @example
 * ```tsx
 * <Card variant="elevated" hover>
 *   <Card.Header title="Card Title" subtitle="Card subtitle" />
 *   <Card.Body>
 *     Card content goes here
 *   </Card.Body>
 *   <Card.Footer>
 *     <Card.Actions align="right">
 *       <Button>Cancel</Button>
 *       <Button variant="primary">Save</Button>
 *     </Card.Actions>
 *   </Card.Footer>
 * </Card>
 * ```
 */
export const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Body: React.FC<CardBodyProps>;
  Footer: React.FC<CardFooterProps>;
  Actions: React.FC<CardActionsProps>;
} = ({
  children,
  className = '',
  variant = 'default',
  hover = false,
  padding = false,
  fullWidth = false,
}) => {
  const baseStyles = 'bg-white rounded-lg overflow-hidden transition-all duration-200';
  
  const variantStyles: Record<CardVariant, string> = {
    default: 'shadow-sm',
    outlined: 'border border-gray-200',
    elevated: 'shadow-md',
  };
  
  const hoverStyles = hover ? 'hover:shadow-lg cursor-pointer' : '';
  const paddingStyles = padding ? 'p-6' : '';
  const widthStyles = fullWidth ? 'w-full' : '';
  
  const classNames = [
    baseStyles,
    variantStyles[variant],
    hoverStyles,
    paddingStyles,
    widthStyles,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  
  return <div className={classNames}>{children}</div>;
};

/**
 * CardHeader component - displays title, subtitle, and optional action
 */
export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  bordered = true,
}) => {
  const baseStyles = 'px-6 py-4';
  const borderStyles = bordered ? 'border-b border-gray-200' : '';
  
  const classNames = [baseStyles, borderStyles, className].filter(Boolean).join(' ');
  
  return (
    <div className={classNames}>
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="ml-4 flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

/**
 * CardBody component - main content area
 */
export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = '',
  padding = true,
}) => {
  const baseStyles = padding ? 'px-6 py-4' : '';
  const classNames = [baseStyles, className].filter(Boolean).join(' ');
  
  return <div className={classNames}>{children}</div>;
};

/**
 * CardFooter component - footer area with optional border
 */
export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
  bordered = true,
  align = 'left',
}) => {
  const baseStyles = 'px-6 py-4 bg-gray-50';
  const borderStyles = bordered ? 'border-t border-gray-200' : '';
  
  const alignStyles: Record<typeof align, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };
  
  const classNames = [baseStyles, borderStyles, alignStyles[align], className]
    .filter(Boolean)
    .join(' ');
  
  return <div className={classNames}>{children}</div>;
};

/**
 * CardActions component - action buttons container
 */
export const CardActions: React.FC<CardActionsProps> = ({
  children,
  className = '',
  align = 'right',
  spacing = 'md',
}) => {
  const baseStyles = 'flex items-center';
  
  const alignStyles: Record<typeof align, string> = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };
  
  const spacingStyles: Record<typeof spacing, string> = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };
  
  const classNames = [
    baseStyles,
    alignStyles[align],
    spacingStyles[spacing],
    className,
  ]
    .filter(Boolean)
    .join(' ');
  
  return <div className={classNames}>{children}</div>;
};

// Attach sub-components to Card
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Actions = CardActions;

// Display names for debugging
Card.displayName = 'Card';
CardHeader.displayName = 'Card.Header';
CardBody.displayName = 'Card.Body';
CardFooter.displayName = 'Card.Footer';
CardActions.displayName = 'Card.Actions';
