import React, { forwardRef, InputHTMLAttributes, useState } from 'react';
import './Input.css';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  size?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  transparent?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      size = 'md',
      leftIcon,
      rightIcon,
      fullWidth = false,
      transparent = false,
      className = '',
      id,
      type = 'text',
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      props.onChange?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const wrapperClassNames = [
      'mnbara-input-wrapper',
      `mnbara-input-wrapper--${size}`,
      fullWidth && 'mnbara-input-wrapper--full-width',
      isFocused && 'mnbara-input-wrapper--focused',
      error && 'mnbara-input-wrapper--error',
      disabled && 'mnbara-input-wrapper--disabled',
      transparent && 'mnbara-input-wrapper--transparent',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClassNames}>
        {label && (
          <label className="mnbara-input-label" htmlFor={inputId}>
            {label}
          </label>
        )}
        <div className="mnbara-input-container">
          {leftIcon && (
            <span className="mnbara-input-icon mnbara-input-icon--left" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className="mnbara-input"
            disabled={disabled}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          {rightIcon && (
            <span className="mnbara-input-icon mnbara-input-icon--right" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </div>
        {(error || hint) && (
          <span className={`mnbara-input-hint ${error ? 'mnbara-input-hint--error' : ''}`}>
            {error || hint}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
