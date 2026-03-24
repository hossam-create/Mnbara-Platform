import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Badge } from './Badge';

describe('Badge', () => {
  it('should render successfully', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeDefined();
  });

  it('should render with default variant', () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText('Default Badge');
    expect(badge.className).toContain('bg-gray-100');
    expect(badge.className).toContain('text-gray-800');
  });

  it('should render with different status color variants', () => {
    const { rerender } = render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success').className).toContain('bg-green-100');

    rerender(<Badge variant="danger">Danger</Badge>);
    expect(screen.getByText('Danger').className).toContain('bg-red-100');

    rerender(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText('Warning').className).toContain('bg-yellow-100');

    rerender(<Badge variant="info">Info</Badge>);
    expect(screen.getByText('Info').className).toContain('bg-cyan-100');

    rerender(<Badge variant="error">Error</Badge>);
    expect(screen.getByText('Error').className).toContain('bg-red-100');

    rerender(<Badge variant="primary">Primary</Badge>);
    expect(screen.getByText('Primary').className).toContain('bg-blue-100');
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    const small = screen.getByText('Small');
    expect(small.className).toContain('px-2');
    expect(small.className).toContain('text-xs');

    rerender(<Badge size="md">Medium</Badge>);
    const medium = screen.getByText('Medium');
    expect(medium.className).toContain('px-2.5');
    expect(medium.className).toContain('text-sm');

    rerender(<Badge size="lg">Large</Badge>);
    const large = screen.getByText('Large');
    expect(large.className).toContain('px-3');
    expect(large.className).toContain('text-base');
  });

  it('should render with dot indicator', () => {
    render(<Badge dot variant="success">With Dot</Badge>);
    const badge = screen.getByText('With Dot');
    const dot = badge.querySelector('span.rounded-full.bg-green-500');
    expect(dot).toBeDefined();
  });

  it('should render removable badge with remove button', () => {
    const handleRemove = jest.fn();
    render(
      <Badge removable onRemove={handleRemove}>
        Removable
      </Badge>
    );
    
    const removeButton = screen.getByLabelText('Remove');
    expect(removeButton).toBeDefined();
    
    fireEvent.click(removeButton);
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    expect(screen.getByText('Custom').className).toContain('custom-class');
  });

  it('should render with all features combined', () => {
    const handleRemove = jest.fn();
    render(
      <Badge 
        variant="warning" 
        size="lg" 
        dot 
        removable 
        onRemove={handleRemove}
        className="custom"
      >
        Full Featured
      </Badge>
    );
    
    const badge = screen.getByText('Full Featured');
    expect(badge.className).toContain('bg-yellow-100');
    expect(badge.className).toContain('px-3');
    expect(badge.className).toContain('custom');
    
    const dot = badge.querySelector('span.rounded-full.bg-yellow-500');
    expect(dot).toBeDefined();
    
    const removeButton = screen.getByLabelText('Remove');
    expect(removeButton).toBeDefined();
  });
});
