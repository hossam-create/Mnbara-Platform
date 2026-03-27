import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = [
      'mnbara-button',
      `mnbara-button--${variant}`,
      `mnbara-button--${size}`,
      fullWidth && 'mnbara-button--full-width',
      loading && 'mnbara-button--loading',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classNames}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="mnbara-button__spinner" aria-hidden="true">
            <svg className="mnbara-button__spinner-icon" viewBox="0 0 24 24">
              <circle
                className="mnbara-button__spinner-track"
                cx="12"
                cy="12"
                r="10"
                fill="none"
                strokeWidth="3"
              />
              <circle
                className="mnbara-button__spinner-head"
                cx="12"
                cy="12"
                r="10"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
        )}
        {!loading && leftIcon && (
          <span className="mnbara-button__icon mnbara-button__icon--left" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <span className="mnbara-button__text">{children}</span>
        {!loading && rightIcon && (
          <span className="mnbara-button__icon mnbara-button__icon--right" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
