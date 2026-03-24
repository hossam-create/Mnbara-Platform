import React from 'react';
import { clsx } from 'clsx';

export interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  className?: string;
}

const AlertDescription: React.FC<AlertDescriptionProps> = ({ children, className }) => {
  return (
    <div className={clsx('text-sm', className)}>
      {children}
    </div>
  );
};

const Alert: React.FC<AlertProps> = ({ 
  children, 
  variant = 'info', 
  className 
}) => {
  const baseClasses = 'p-4 rounded-md border';
  
  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  };

  return (
    <div className={clsx(baseClasses, variantClasses[variant], className)}>
      {children}
    </div>
  );
};

export { Alert, AlertDescription };
