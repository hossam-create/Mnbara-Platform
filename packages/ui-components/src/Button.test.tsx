import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from './Button';

describe('Button', () => {
  describe('Rendering', () => {
    it('should render successfully', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should render with primary variant by default', () => {
      render(<Button>Primary Button</Button>);
      const button = screen.getByText('Primary Button');
      expect(button).toHaveClass('bg-blue-600');
    });

    it('should render with all variants', () => {
      const variants = [
        { variant: 'secondary' as const, class: 'bg-gray-200' },
        { variant: 'success' as const, class: 'bg-green-600' },
        { variant: 'danger' as const, class: 'bg-red-600' },
        { variant: 'warning' as const, class: 'bg-yellow-500' },
        { variant: 'ghost' as const, class: 'bg-transparent' },
        { variant: 'link' as const, class: 'bg-transparent' },
      ];

      variants.forEach(({ variant, class: className }) => {
        const { unmount } = render(<Button variant={variant}>{variant}</Button>);
        expect(screen.getByText(variant)).toHaveClass(className);
        unmount();
      });
    });

    it('should render with different sizes', () => {
      const { rerender } = render(<Button size="sm">Small</Button>);
      expect(screen.getByText('Small')).toHaveClass('px-3');

      rerender(<Button size="md">Medium</Button>);
      expect(screen.getByText('Medium')).toHaveClass('px-4');

      rerender(<Button size="lg">Large</Button>);
      expect(screen.getByText('Large')).toHaveClass('px-6');
    });

    it('should render full width when fullWidth prop is true', () => {
      render(<Button fullWidth>Full Width</Button>);
      expect(screen.getByText('Full Width')).toHaveClass('w-full');
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByText('Disabled Button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('should show loading state with spinner', () => {
      render(<Button loading>Loading Button</Button>);
      const button = screen.getByText('Loading Button');
      expect(button).toBeDisabled();
      expect(button.querySelector('svg')).toBeInTheDocument();
      expect(button).toHaveClass('opacity-75');
    });

    it('should be disabled when loading is true', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByText('Loading')).toBeDisabled();
    });
  });

  describe('Icons', () => {
    it('should render with left icon', () => {
      const icon = <span data-testid="icon">🔍</span>;
      render(<Button icon={icon} iconPosition="left">Search</Button>);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should render with right icon', () => {
      const icon = <span data-testid="icon">→</span>;
      render(<Button icon={icon} iconPosition="right">Next</Button>);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should not show icon when loading', () => {
      const icon = <span data-testid="icon">🔍</span>;
      render(<Button icon={icon} loading>Loading</Button>);
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });
  });

  describe('Event Handlers', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      fireEvent.click(screen.getByText('Click me'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Click me</Button>);
      fireEvent.click(screen.getByText('Click me'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} loading>Click me</Button>);
      fireEvent.click(screen.getByText('Click me'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper focus styles', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByText('Focus me');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
    });

    it('should support custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      expect(screen.getByText('Custom')).toHaveClass('custom-class');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Button</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('should support all native button attributes', () => {
      render(<Button type="submit" name="submit-btn" data-testid="test-btn">Submit</Button>);
      const button = screen.getByTestId('test-btn');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('name', 'submit-btn');
    });
  });
});
