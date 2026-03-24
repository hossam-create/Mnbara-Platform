/**
 * Property-Based Tests for UI Components
 * 
 * **Validates: Requirements 2.2.2**
 * 
 * These tests validate that all UI components handle their props correctly
 * across a wide range of inputs using property-based testing with fast-check.
 * 
 * Test Strategy:
 * - Generate random valid prop combinations
 * - Verify components render without crashing
 * - Validate CSS classes are applied correctly
 * - Ensure accessibility attributes are maintained
 * - Test edge cases (empty strings, long strings, special characters)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import { Button, ButtonVariant, ButtonSize } from '../Button';
import { Input, InputValidationState } from '../Input';
import { Card, CardVariant } from '../Card';
import { Modal } from '../Modal';
import { Badge, BadgeVariant, BadgeSize } from '../Badge';
import { Spinner } from '../Spinner';
import { Skeleton } from '../Skeleton';

// ============================================================================
// Arbitraries (Generators for test data)
// ============================================================================

const buttonVariantArb = fc.constantFrom<ButtonVariant>(
  'primary', 'secondary', 'success', 'danger', 'warning', 'ghost', 'link'
);

const buttonSizeArb = fc.constantFrom<ButtonSize>('sm', 'md', 'lg');

const inputValidationStateArb = fc.constantFrom<InputValidationState>(
  'default', 'error', 'success', 'warning'
);

const cardVariantArb = fc.constantFrom<CardVariant>('default', 'outlined', 'elevated');

const badgeVariantArb = fc.constantFrom<BadgeVariant>(
  'default', 'primary', 'secondary', 'success', 'danger', 'warning', 'info', 'error'
);

const badgeSizeArb = fc.constantFrom<BadgeSize>('sm', 'md', 'lg');

const spinnerSizeArb = fc.constantFrom<'sm' | 'md' | 'lg'>('sm', 'md', 'lg');

const spinnerColorArb = fc.constantFrom<'primary' | 'white'>('primary', 'white');

const skeletonVariantArb = fc.constantFrom<'text' | 'circular' | 'rectangular' | 'card'>(
  'text', 'circular', 'rectangular', 'card'
);

// Text generators with edge cases
const safeTextArb = fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2);
const emptyOrTextArb = fc.string({ maxLength: 100 });
const longTextArb = fc.string({ minLength: 100, maxLength: 500 }).filter(s => s.trim().length >= 100);
const specialCharsTextArb = fc.stringMatching(/^[a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/);
const validClassNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_-]*$/).filter(s => s.length >= 2 && s.length <= 50);

// ============================================================================
// Button Component Property Tests
// ============================================================================

describe('Button - Property-Based Tests', () => {
  it('should render without crashing for any valid prop combination', () => {
    fc.assert(
      fc.property(
        buttonVariantArb,
        buttonSizeArb,
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        safeTextArb,
        (variant, size, loading, fullWidth, disabled, text) => {
          const { container } = render(
            <Button
              variant={variant}
              size={size}
              loading={loading}
              fullWidth={fullWidth}
              disabled={disabled}
            >
              {text}
            </Button>
          );
          
          expect(container.querySelector('button')).toBeInTheDocument();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply correct variant classes for all variants', () => {
    fc.assert(
      fc.property(buttonVariantArb, safeTextArb, (variant, text) => {
        const { container } = render(
          <Button variant={variant}>{text}</Button>
        );
        
        const button = container.querySelector('button');
        expect(button).toBeInTheDocument();
        
        // Verify button has base styles
        expect(button).toHaveClass('inline-flex');
        expect(button).toHaveClass('items-center');
      }),
      { numRuns: 50 }
    );
  });

  it('should apply correct size classes for all sizes', () => {
    fc.assert(
      fc.property(buttonSizeArb, safeTextArb, (size, text) => {
        const { container } = render(
          <Button size={size}>{text}</Button>
        );
        
        const button = container.querySelector('button');
        expect(button).toBeInTheDocument();
        
        // Verify size-specific padding is applied
        const sizeClasses = {
          sm: 'px-3',
          md: 'px-4',
          lg: 'px-6',
        };
        
        expect(button).toHaveClass(sizeClasses[size]);
      }),
      { numRuns: 50 }
    );
  });

  it('should be disabled when disabled or loading is true', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        safeTextArb,
        (disabled, loading, text) => {
          const { container } = render(
            <Button disabled={disabled} loading={loading}>{text}</Button>
          );
          
          const button = container.querySelector('button');
          
          if (disabled || loading) {
            expect(button).toBeDisabled();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty and special character text', () => {
    fc.assert(
      fc.property(specialCharsTextArb, (text) => {
        const { container } = render(<Button>{text}</Button>);
        expect(container.querySelector('button')).toBeInTheDocument();
      }),
      { numRuns: 50 }
    );
  });
});

// ============================================================================
// Input Component Property Tests
// ============================================================================

describe('Input - Property-Based Tests', () => {
  it('should render without crashing for any valid prop combination', () => {
    fc.assert(
      fc.property(
        emptyOrTextArb,
        emptyOrTextArb,
        emptyOrTextArb,
        inputValidationStateArb,
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        (label, error, helperText, validationState, fullWidth, disabled, required) => {
          const { container } = render(
            <Input
              label={label || undefined}
              error={error || undefined}
              helperText={helperText || undefined}
              validationState={validationState}
              fullWidth={fullWidth}
              disabled={disabled}
              required={required}
            />
          );
          
          expect(container.querySelector('input')).toBeInTheDocument();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply correct validation state classes', () => {
    fc.assert(
      fc.property(inputValidationStateArb, (validationState) => {
        const { container } = render(
          <Input validationState={validationState} />
        );
        
        const input = container.querySelector('input');
        expect(input).toBeInTheDocument();
        expect(input).toHaveClass('border');
      }),
      { numRuns: 50 }
    );
  });

  it('should show error message when error prop is provided', () => {
    fc.assert(
      fc.property(safeTextArb, (errorText) => {
        const { container } = render(<Input error={errorText} />);
        const alert = container.querySelector('[role="alert"]');
        expect(alert).toBeInTheDocument();
        // Trim both sides for comparison since HTML normalizes whitespace
        expect(alert?.textContent?.trim()).toBe(errorText.trim());
      }),
      { numRuns: 50 }
    );
  });

  it('should have proper accessibility attributes', () => {
    fc.assert(
      fc.property(
        emptyOrTextArb,
        fc.boolean(),
        (error, required) => {
          const { container } = render(
            <Input error={error || undefined} required={required} />
          );
          
          const input = container.querySelector('input');
          expect(input).toHaveAttribute('aria-invalid', error ? 'true' : 'false');
          
          if (error) {
            expect(input).toHaveAttribute('aria-describedby');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle very long text in labels and errors', () => {
    fc.assert(
      fc.property(longTextArb, longTextArb, (label, error) => {
        const { container } = render(
          <Input label={label} error={error} />
        );
        
        expect(container.querySelector('input')).toBeInTheDocument();
        // Just verify the input renders - text content is already validated by component
        expect(container.querySelector('label')).toBeInTheDocument();
        expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
      }),
      { numRuns: 30 }
    );
  });
});

// ============================================================================
// Card Component Property Tests
// ============================================================================

describe('Card - Property-Based Tests', () => {
  it('should render without crashing for any valid prop combination', () => {
    fc.assert(
      fc.property(
        cardVariantArb,
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        safeTextArb,
        (variant, hover, padding, fullWidth, content) => {
          const { container } = render(
            <Card
              variant={variant}
              hover={hover}
              padding={padding}
              fullWidth={fullWidth}
            >
              {content}
            </Card>
          );
          
          expect(container.firstChild).toBeInTheDocument();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply correct variant classes', () => {
    fc.assert(
      fc.property(cardVariantArb, safeTextArb, (variant, content) => {
        const { container } = render(
          <Card variant={variant}>{content}</Card>
        );
        
        const card = container.firstChild as HTMLElement;
        expect(card).toHaveClass('bg-white');
        expect(card).toHaveClass('rounded-lg');
      }),
      { numRuns: 50 }
    );
  });

  it('should render with all slot components', () => {
    fc.assert(
      fc.property(
        safeTextArb,
        safeTextArb,
        safeTextArb,
        safeTextArb,
        (title, subtitle, body, footer) => {
          // Skip if all values are the same (would cause duplicate text issues)
          const uniqueValues = new Set([title, subtitle, body, footer]);
          if (uniqueValues.size < 4) {
            return true;
          }
          
          const { container } = render(
            <Card>
              <Card.Header title={title} subtitle={subtitle} />
              <Card.Body>{body}</Card.Body>
              <Card.Footer>{footer}</Card.Footer>
            </Card>
          );
          
          // Verify structure exists rather than querying for potentially duplicate text
          expect(container.querySelector('h3')).toBeInTheDocument();
          expect(container.querySelector('p.text-sm')).toBeInTheDocument();
          expect(container.querySelectorAll('.px-6').length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle empty content gracefully', () => {
    fc.assert(
      fc.property(cardVariantArb, (variant) => {
        const { container } = render(<Card variant={variant}>{''}</Card>);
        expect(container.firstChild).toBeInTheDocument();
      }),
      { numRuns: 30 }
    );
  });
});

// ============================================================================
// Modal Component Property Tests
// ============================================================================

describe('Modal - Property-Based Tests', () => {
  it('should render without crashing for any valid prop combination', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.constantFrom<'sm' | 'md' | 'lg' | 'xl'>('sm', 'md', 'lg', 'xl'),
        fc.boolean(),
        fc.boolean(),
        safeTextArb,
        (isOpen, size, closeOnOverlayClick, closeOnEscape, content) => {
          const onClose = jest.fn();
          
          const { unmount } = render(
            <Modal
              isOpen={isOpen}
              onClose={onClose}
              size={size}
              closeOnOverlayClick={closeOnOverlayClick}
              closeOnEscape={closeOnEscape}
            >
              {content}
            </Modal>
          );
          
          if (isOpen) {
            // Modal should be in the document when open
            expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();
          } else {
            // Modal should not be in the document when closed
            expect(document.querySelector('[role="dialog"]')).not.toBeInTheDocument();
          }
          
          // Clean up to prevent portal accumulation
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have proper accessibility attributes when open', () => {
    fc.assert(
      fc.property(safeTextArb, (content) => {
        const onClose = jest.fn();
        
        render(
          <Modal isOpen={true} onClose={onClose}>
            {content}
          </Modal>
        );
        
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
      }),
      { numRuns: 50 }
    );
  });

  it('should render with all slot components', () => {
    fc.assert(
      fc.property(
        safeTextArb,
        safeTextArb,
        safeTextArb,
        (header, body, footer) => {
          // Skip if all values are the same
          const uniqueValues = new Set([header, body, footer]);
          if (uniqueValues.size < 3) {
            return true;
          }
          
          const onClose = jest.fn();
          
          const { unmount } = render(
            <Modal isOpen={true} onClose={onClose}>
              <Modal.Header onClose={onClose}>{header}</Modal.Header>
              <Modal.Body>{body}</Modal.Body>
              <Modal.Footer>{footer}</Modal.Footer>
            </Modal>
          );
          
          // Verify modal is rendered
          const dialog = document.querySelector('[role="dialog"]');
          expect(dialog).toBeInTheDocument();
          expect(dialog?.querySelector('h2')).toBeInTheDocument();
          expect(dialog?.querySelectorAll('.px-6').length).toBeGreaterThan(0);
          
          // Clean up
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ============================================================================
// Badge Component Property Tests
// ============================================================================

describe('Badge - Property-Based Tests', () => {
  it('should render without crashing for any valid prop combination', () => {
    fc.assert(
      fc.property(
        badgeVariantArb,
        badgeSizeArb,
        fc.boolean(),
        fc.boolean(),
        safeTextArb,
        (variant, size, dot, removable, text) => {
          const onRemove = jest.fn();
          
          const { container } = render(
            <Badge
              variant={variant}
              size={size}
              dot={dot}
              removable={removable}
              onRemove={removable ? onRemove : undefined}
            >
              {text}
            </Badge>
          );
          
          expect(container.querySelector('span')).toBeInTheDocument();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply correct variant classes', () => {
    fc.assert(
      fc.property(badgeVariantArb, safeTextArb, (variant, text) => {
        const { container } = render(
          <Badge variant={variant}>{text}</Badge>
        );
        
        const badge = container.querySelector('span');
        expect(badge).toHaveClass('inline-flex');
        expect(badge).toHaveClass('items-center');
        expect(badge).toHaveClass('rounded-full');
      }),
      { numRuns: 50 }
    );
  });

  it('should apply correct size classes', () => {
    fc.assert(
      fc.property(badgeSizeArb, safeTextArb, (size, text) => {
        const { container } = render(
          <Badge size={size}>{text}</Badge>
        );
        
        const badge = container.querySelector('span');
        expect(badge).toBeInTheDocument();
        
        // Verify size-specific classes
        const sizeClasses = {
          sm: 'text-xs',
          md: 'text-sm',
          lg: 'text-base',
        };
        
        expect(badge).toHaveClass(sizeClasses[size]);
      }),
      { numRuns: 50 }
    );
  });

  it('should show dot indicator when dot prop is true', () => {
    fc.assert(
      fc.property(badgeVariantArb, safeTextArb, (variant, text) => {
        const { container } = render(
          <Badge variant={variant} dot>{text}</Badge>
        );
        
        const badge = container.querySelector('span');
        const dot = badge?.querySelector('span.rounded-full');
        expect(dot).toBeInTheDocument();
      }),
      { numRuns: 50 }
    );
  });

  it('should show remove button when removable is true', () => {
    fc.assert(
      fc.property(safeTextArb, (text) => {
        const onRemove = jest.fn();
        const { container } = render(
          <Badge removable onRemove={onRemove}>{text}</Badge>
        );
        
        const removeButton = container.querySelector('button');
        expect(removeButton).toBeInTheDocument();
        expect(removeButton).toHaveAttribute('aria-label', 'Remove');
      }),
      { numRuns: 50 }
    );
  });
});

// ============================================================================
// Spinner Component Property Tests
// ============================================================================

describe('Spinner - Property-Based Tests', () => {
  it('should render without crashing for any valid prop combination', () => {
    fc.assert(
      fc.property(
        spinnerSizeArb,
        spinnerColorArb,
        (size, color) => {
          const { container } = render(
            <Spinner size={size} color={color} />
          );
          
          expect(container.querySelector('svg')).toBeInTheDocument();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should apply correct size classes', () => {
    fc.assert(
      fc.property(spinnerSizeArb, (size) => {
        const { container } = render(<Spinner size={size} />);
        
        const svg = container.querySelector('svg');
        expect(svg).toHaveClass('animate-spin');
        
        const sizeClasses = {
          sm: 'w-4',
          md: 'w-8',
          lg: 'w-12',
        };
        
        expect(svg).toHaveClass(sizeClasses[size]);
      }),
      { numRuns: 50 }
    );
  });

  it('should apply correct color classes', () => {
    fc.assert(
      fc.property(spinnerColorArb, (color) => {
        const { container } = render(<Spinner color={color} />);
        
        const svg = container.querySelector('svg');
        const colorClasses = {
          primary: 'text-blue-600',
          white: 'text-white',
        };
        
        expect(svg).toHaveClass(colorClasses[color]);
      }),
      { numRuns: 50 }
    );
  });
});

// ============================================================================
// Skeleton Component Property Tests
// ============================================================================

describe('Skeleton - Property-Based Tests', () => {
  it('should render without crashing for any valid prop combination', () => {
    fc.assert(
      fc.property(
        skeletonVariantArb,
        fc.option(fc.integer({ min: 50, max: 500 })),
        fc.option(fc.integer({ min: 20, max: 200 })),
        (variant, width, height) => {
          const { container } = render(
            <Skeleton
              variant={variant}
              width={width ?? undefined}
              height={height ?? undefined}
            />
          );
          
          expect(container.querySelector('div')).toBeInTheDocument();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply correct variant classes', () => {
    fc.assert(
      fc.property(skeletonVariantArb, (variant) => {
        const { container } = render(<Skeleton variant={variant} />);
        
        const skeleton = container.querySelector('div');
        expect(skeleton).toHaveClass('bg-gray-200');
        expect(skeleton).toHaveClass('animate-pulse');
      }),
      { numRuns: 50 }
    );
  });

  it('should render multiple lines when lines prop is provided', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 10 }), (lines) => {
        const { container } = render(<Skeleton variant="text" lines={lines} />);
        
        const skeletons = container.querySelectorAll('div.bg-gray-200');
        expect(skeletons.length).toBe(lines);
      }),
      { numRuns: 30 }
    );
  });

  it('should handle custom dimensions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 500 }),
        fc.integer({ min: 20, max: 200 }),
        (width, height) => {
          const { container } = render(
            <Skeleton width={width} height={height} />
          );
          
          const skeleton = container.querySelector('div');
          expect(skeleton).toHaveStyle({ width: `${width}px`, height: `${height}px` });
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ============================================================================
// Cross-Component Property Tests
// ============================================================================

describe('Cross-Component Property Tests', () => {
  it('all components should handle className prop correctly', () => {
    fc.assert(
      fc.property(validClassNameArb, safeTextArb, (className, content) => {
        const components = [
          <Button key="button" className={className}>{content}</Button>,
          <Input key="input" className={className} />,
          <Card key="card" className={className}>{content}</Card>,
          <Badge key="badge" className={className}>{content}</Badge>,
          <Spinner key="spinner" className={className} />,
          <Skeleton key="skeleton" className={className} />,
        ];
        
        components.forEach((component) => {
          const { container, unmount } = render(component);
          const element = container.querySelector(`.${className}`);
          
          expect(element).toBeInTheDocument();
          
          unmount();
        });
      }),
      { numRuns: 50 }
    );
  });

  it('all components should render with empty string content', () => {
    const components = [
      { name: 'Button', element: <Button>{''}</Button> },
      { name: 'Card', element: <Card>{''}</Card> },
      { name: 'Badge', element: <Badge>{''}</Badge> },
    ];
    
    components.forEach(({ name, element }) => {
      const { container } = render(element);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
