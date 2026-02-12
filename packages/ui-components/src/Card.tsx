import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  bordered?: boolean;
  elevated?: boolean;
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> & { Header: React.FC<CardHeaderProps>; Body: React.FC<CardBodyProps>; Footer: React.FC<CardFooterProps> } = ({
  children, className = '', hover = false, bordered = true, elevated = false,
}) => {
  const baseStyles = 'bg-white rounded-xl overflow-hidden';
  const hoverStyles = hover ? 'transition-shadow duration-300 hover:shadow-lg' : '';
  const borderStyles = bordered ? 'border border-gray-200' : '';
  const elevationStyles = elevated ? 'shadow-md' : 'shadow-sm';
  const classNames = [baseStyles, hoverStyles, borderStyles, elevationStyles, className].join(' ');
  return <div className={classNames}>{children}</div>;
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', title, subtitle, action }) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {children}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '', bordered = true }) => {
  return <div className={`px-6 py-4 bg-gray-50 ${bordered ? 'border-t border-gray-200' : ''} ${className}`}>{children}</div>;
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
