import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders without crashing', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies default size (md)', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-8', 'h-8');
  });

  it('applies small size', () => {
    const { container } = render(<Spinner size="sm" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-4', 'h-4');
  });

  it('applies large size', () => {
    const { container } = render(<Spinner size="lg" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-12', 'h-12');
  });

  it('applies default color (primary)', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('text-blue-600');
  });

  it('applies white color', () => {
    const { container } = render(<Spinner color="white" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('text-white');
  });

  it('applies custom className', () => {
    const { container } = render(<Spinner className="custom-class" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('has animate-spin class for animation', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('animate-spin');
  });

  it('renders SVG with correct viewBox', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('renders circle and path elements', () => {
    const { container } = render(<Spinner />);
    const circle = container.querySelector('circle');
    const path = container.querySelector('path');
    
    expect(circle).toBeInTheDocument();
    expect(path).toBeInTheDocument();
  });

  it('combines multiple props correctly', () => {
    const { container } = render(
      <Spinner size="lg" color="white" className="my-spinner" />
    );
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveClass('w-12', 'h-12', 'text-white', 'my-spinner', 'animate-spin');
  });
});
