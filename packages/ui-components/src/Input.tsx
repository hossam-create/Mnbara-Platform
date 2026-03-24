import React from 'react';

// Input validation states
export type InputValidationState = 'default' | 'error' | 'success' | 'warning';

// Input props interface
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  validationState?: InputValidationState;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    leftIcon, 
    rightIcon, 
    fullWidth = false, 
    validationState = 'default',
    className = '', 
    id, 
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    
    // Determine actual validation state (error prop takes precedence)
    const actualState = error ? 'error' : validationState;
    
    const baseStyles = 'block w-full px-4 py-2 border rounded-lg text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';
    
    const stateStyles: Record<InputValidationState, string> = {
      default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
      error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
      success: 'border-green-500 focus:border-green-500 focus:ring-green-500',
      warning: 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500',
    };
    
    const disabledStyles = props.disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white';
    const readonlyStyles = props.readOnly ? 'bg-gray-50 cursor-default' : '';
    const iconPadding = leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '';
    const widthStyle = fullWidth ? 'w-full' : '';
    const wrapperClassName = fullWidth ? 'w-full' : 'inline-block';
    
    const classNames = [
      baseStyles, 
      stateStyles[actualState], 
      disabledStyles, 
      readonlyStyles,
      iconPadding, 
      widthStyle, 
      className
    ].filter(Boolean).join(' ');
    
    return (
      <div className={wrapperClassName}>
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          <input 
            ref={ref} 
            id={inputId} 
            className={classNames}
            aria-invalid={actualState === 'error' ? 'true' : 'false'}
            aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
            {...props} 
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
