import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  describe('Rendering', () => {
    it('should render successfully', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have base animation and styling classes', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('bg-gray-200');
      expect(skeleton).toHaveClass('animate-pulse');
    });
  });

  describe('Variants', () => {
    it('should render with text variant by default', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded');
    });

    it('should render with circular variant', () => {
      const { container } = render(<Skeleton variant="circular" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('should render with rectangular variant', () => {
      const { container } = render(<Skeleton variant="rectangular" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-lg');
    });

    it('should render with card variant', () => {
      const { container } = render(<Skeleton variant="card" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-lg');
    });
  });

  describe('Dimensions', () => {
    it('should apply custom width as string', () => {
      const { container } = render(<Skeleton width="200px" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: '200px' });
    });

    it('should apply custom width as number', () => {
      const { container } = render(<Skeleton width={150} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: '150px' });
    });

    it('should apply custom height as string', () => {
      const { container } = render(<Skeleton height="50px" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ height: '50px' });
    });

    it('should apply custom height as number', () => {
      const { container } = render(<Skeleton height={100} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ height: '100px' });
    });

    it('should apply both width and height', () => {
      const { container } = render(<Skeleton width={200} height={100} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: '200px', height: '100px' });
    });
  });

  describe('Multiple Lines', () => {
    it('should render single line by default', () => {
      const { container } = render(<Skeleton />);
      expect(container.querySelectorAll('.bg-gray-200').length).toBe(1);
    });

    it('should render multiple lines when lines prop is provided', () => {
      const { container } = render(<Skeleton lines={3} />);
      const skeletons = container.querySelectorAll('.bg-gray-200');
      expect(skeletons.length).toBe(3);
    });

    it('should render lines with proper spacing', () => {
      const { container } = render(<Skeleton lines={3} />);
      const wrapper = container.querySelector('.space-y-2');
      expect(wrapper).toBeInTheDocument();
    });

    it('should make last line shorter when multiple lines', () => {
      const { container } = render(<Skeleton lines={3} />);
      const skeletons = container.querySelectorAll('.bg-gray-200');
      const lastSkeleton = skeletons[skeletons.length - 1] as HTMLElement;
      expect(lastSkeleton).toHaveClass('w-3/4');
    });

    it('should apply full width to non-last lines', () => {
      const { container } = render(<Skeleton lines={3} />);
      const skeletons = container.querySelectorAll('.bg-gray-200');
      const firstSkeleton = skeletons[0] as HTMLElement;
      expect(firstSkeleton).toHaveClass('w-full');
    });

    it('should apply custom height to all lines', () => {
      const { container } = render(<Skeleton lines={3} height={20} />);
      const skeletons = container.querySelectorAll('.bg-gray-200');
      skeletons.forEach(skeleton => {
        expect(skeleton).toHaveStyle({ height: '20px' });
      });
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<Skeleton className="custom-skeleton" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('custom-skeleton');
    });

    it('should combine custom className with base classes', () => {
      const { container } = render(<Skeleton className="my-custom-class" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('bg-gray-200');
      expect(skeleton).toHaveClass('animate-pulse');
      expect(skeleton).toHaveClass('my-custom-class');
    });
  });

  describe('Use Cases', () => {
    it('should render avatar skeleton (circular)', () => {
      const { container } = render(<Skeleton variant="circular" width={48} height={48} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-full');
      expect(skeleton).toHaveStyle({ width: '48px', height: '48px' });
    });

    it('should render card skeleton', () => {
      const { container } = render(<Skeleton variant="card" width="100%" height={200} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-lg');
      expect(skeleton).toHaveStyle({ width: '100%', height: '200px' });
    });

    it('should render text paragraph skeleton', () => {
      const { container } = render(<Skeleton variant="text" lines={4} />);
      const skeletons = container.querySelectorAll('.bg-gray-200');
      expect(skeletons.length).toBe(4);
    });

    it('should render button skeleton', () => {
      const { container } = render(<Skeleton variant="rectangular" width={120} height={40} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-lg');
      expect(skeleton).toHaveStyle({ width: '120px', height: '40px' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle lines=1 as single skeleton', () => {
      const { container } = render(<Skeleton lines={1} />);
      expect(container.querySelectorAll('.bg-gray-200').length).toBe(1);
    });

    it('should handle zero width', () => {
      const { container } = render(<Skeleton width={0} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: '0px' });
    });

    it('should handle zero height', () => {
      const { container } = render(<Skeleton height={0} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ height: '0px' });
    });

    it('should not render multiple lines for non-text variants', () => {
      const { container } = render(<Skeleton variant="circular" lines={3} />);
      // Should only render one skeleton for non-text variants
      expect(container.querySelectorAll('.bg-gray-200').length).toBe(1);
    });
  });
});
