import React, { ReactNode } from 'react';
import './Card.css';

export type CardVariant = 'default' | 'elevated' | 'outlined';

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  onClick,
  className = '',
}) => {
  const cardClassNames = [
    'mnbara-card',
    `mnbara-card--${variant}`,
    `mnbara-card--padding-${padding}`,
    hoverable && 'mnbara-card--hoverable',
    onClick && 'mnbara-card--clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClassNames} onClick={onClick} role={onClick ? 'button' : undefined}>
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`mnbara-card-header ${className}`}>{children}</div>
);

export interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => (
  <div className={`mnbara-card-body ${className}`}>{children}</div>
);

export interface CardFooterProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '', align = 'right' }) => (
  <div className={`mnbara-card-footer mnbara-card-footer--align-${align} ${className}`}>
    {children}
  </div>
);

export default Card;
