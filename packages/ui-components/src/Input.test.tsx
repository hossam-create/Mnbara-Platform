import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Input } from './Input';

describe('Input', () => {
  it('should render successfully', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<Input label="Email" placeholder="Enter email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('should render with error state', () => {
    render(<Input label="Email" error="Email is required" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
    expect(screen.getByLabelText('Email')).toHaveClass('border-red-500');
  });

  it('should render with success validation state', () => {
    render(<Input label="Email" validationState="success" />);
    expect(screen.getByLabelText('Email')).toHaveClass('border-green-500');
  });

  it('should render with warning validation state', () => {
    render(<Input label="Email" validationState="warning" />);
    expect(screen.getByLabelText('Email')).toHaveClass('border-yellow-500');
  });

  it('should render with helper text', () => {
    render(<Input label="Email" helperText="We'll never share your email" />);
    expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input label="Email" disabled />);
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Email')).toHaveClass('bg-gray-100');
  });

  it('should be readonly when readOnly prop is true', () => {
    render(<Input label="Email" readOnly value="test@example.com" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveClass('bg-gray-50');
  });

  it('should render full width when fullWidth prop is true', () => {
    render(<Input label="Email" fullWidth />);
    const outerWrapper = screen.getByLabelText('Email').parentElement?.parentElement;
    expect(outerWrapper).toHaveClass('w-full');
  });

  it('should show required indicator when required prop is true', () => {
    render(<Input label="Email" required />);
    expect(screen.getByLabelText('required')).toBeInTheDocument();
  });

  it('should have proper ARIA attributes for error state', () => {
    render(<Input label="Email" error="Email is required" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
  });

  it('should support different input types', () => {
    const { rerender } = render(<Input type="email" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');
  });

  it('should render with left icon', () => {
    const icon = <span data-testid="left-icon">@</span>;
    render(<Input leftIcon={icon} />);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('should render with right icon', () => {
    const icon = <span data-testid="right-icon">✓</span>;
    render(<Input rightIcon={icon} />);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('error prop should take precedence over validationState', () => {
    render(<Input label="Email" validationState="success" error="Email is required" />);
    expect(screen.getByLabelText('Email')).toHaveClass('border-red-500');
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
  });
});
