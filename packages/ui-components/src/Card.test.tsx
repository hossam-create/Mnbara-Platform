import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card } from './Card';

describe('Card', () => {
  describe('Card component', () => {
    it('should render successfully', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should render with default variant', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('shadow-sm');
    });

    it('should render with outlined variant', () => {
      const { container } = render(<Card variant="outlined">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('border-gray-200');
    });

    it('should render with elevated variant', () => {
      const { container } = render(<Card variant="elevated">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('shadow-md');
    });

    it('should apply hover styles when hover prop is true', () => {
      const { container } = render(<Card hover>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('hover:shadow-lg');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('should apply padding when padding prop is true', () => {
      const { container } = render(<Card padding>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-6');
    });

    it('should render full width when fullWidth prop is true', () => {
      const { container } = render(<Card fullWidth>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('w-full');
    });

    it('should apply custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Card.Header component', () => {
    it('should render with title', () => {
      render(
        <Card>
          <Card.Header title="Card Title" />
        </Card>
      );
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('should render with title and subtitle', () => {
      render(
        <Card>
          <Card.Header title="Card Title" subtitle="Card subtitle" />
        </Card>
      );
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card subtitle')).toBeInTheDocument();
    });

    it('should render with action element', () => {
      render(
        <Card>
          <Card.Header title="Title" action={<button>Action</button>} />
        </Card>
      );
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('should render with children', () => {
      render(
        <Card>
          <Card.Header>
            <div>Custom header content</div>
          </Card.Header>
        </Card>
      );
      expect(screen.getByText('Custom header content')).toBeInTheDocument();
    });

    it('should apply border by default', () => {
      const { container } = render(
        <Card>
          <Card.Header title="Title" />
        </Card>
      );
      const header = container.querySelector('.border-b');
      expect(header).toBeInTheDocument();
    });

    it('should not apply border when bordered is false', () => {
      const { container } = render(
        <Card>
          <Card.Header title="Title" bordered={false} />
        </Card>
      );
      const header = container.querySelector('.border-b');
      expect(header).not.toBeInTheDocument();
    });
  });

  describe('Card.Body component', () => {
    it('should render with content', () => {
      render(
        <Card>
          <Card.Body>Body content</Card.Body>
        </Card>
      );
      expect(screen.getByText('Body content')).toBeInTheDocument();
    });

    it('should apply padding by default', () => {
      const { container } = render(
        <Card>
          <Card.Body>Content</Card.Body>
        </Card>
      );
      const body = screen.getByText('Content');
      expect(body).toHaveClass('px-6');
      expect(body).toHaveClass('py-4');
    });

    it('should not apply padding when padding is false', () => {
      const { container } = render(
        <Card>
          <Card.Body padding={false}>Content</Card.Body>
        </Card>
      );
      const body = screen.getByText('Content');
      expect(body).not.toHaveClass('px-6');
      expect(body).not.toHaveClass('py-4');
    });

    it('should apply custom className', () => {
      render(
        <Card>
          <Card.Body className="custom-body">Content</Card.Body>
        </Card>
      );
      const body = screen.getByText('Content');
      expect(body).toHaveClass('custom-body');
    });
  });

  describe('Card.Footer component', () => {
    it('should render with content', () => {
      render(
        <Card>
          <Card.Footer>Footer content</Card.Footer>
        </Card>
      );
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('should apply border by default', () => {
      const { container } = render(
        <Card>
          <Card.Footer>Content</Card.Footer>
        </Card>
      );
      const footer = container.querySelector('.border-t');
      expect(footer).toBeInTheDocument();
    });

    it('should not apply border when bordered is false', () => {
      const { container } = render(
        <Card>
          <Card.Footer bordered={false}>Content</Card.Footer>
        </Card>
      );
      const footer = container.querySelector('.border-t');
      expect(footer).not.toBeInTheDocument();
    });

    it('should align left by default', () => {
      render(
        <Card>
          <Card.Footer>Content</Card.Footer>
        </Card>
      );
      const footer = screen.getByText('Content');
      expect(footer).toHaveClass('text-left');
    });

    it('should align center when align is center', () => {
      render(
        <Card>
          <Card.Footer align="center">Content</Card.Footer>
        </Card>
      );
      const footer = screen.getByText('Content');
      expect(footer).toHaveClass('text-center');
    });

    it('should align right when align is right', () => {
      render(
        <Card>
          <Card.Footer align="right">Content</Card.Footer>
        </Card>
      );
      const footer = screen.getByText('Content');
      expect(footer).toHaveClass('text-right');
    });
  });

  describe('Card.Actions component', () => {
    it('should render with children', () => {
      render(
        <Card>
          <Card.Footer>
            <Card.Actions>
              <button>Cancel</button>
              <button>Save</button>
            </Card.Actions>
          </Card.Footer>
        </Card>
      );
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should align right by default', () => {
      const { container } = render(
        <Card>
          <Card.Footer>
            <Card.Actions>
              <button>Action</button>
            </Card.Actions>
          </Card.Footer>
        </Card>
      );
      const actions = container.querySelector('.justify-end');
      expect(actions).toBeInTheDocument();
    });

    it('should align left when align is left', () => {
      const { container } = render(
        <Card>
          <Card.Footer>
            <Card.Actions align="left">
              <button>Action</button>
            </Card.Actions>
          </Card.Footer>
        </Card>
      );
      const actions = container.querySelector('.justify-start');
      expect(actions).toBeInTheDocument();
    });

    it('should align center when align is center', () => {
      const { container } = render(
        <Card>
          <Card.Footer>
            <Card.Actions align="center">
              <button>Action</button>
            </Card.Actions>
          </Card.Footer>
        </Card>
      );
      const actions = container.querySelector('.justify-center');
      expect(actions).toBeInTheDocument();
    });

    it('should apply medium spacing by default', () => {
      const { container } = render(
        <Card>
          <Card.Footer>
            <Card.Actions>
              <button>Action</button>
            </Card.Actions>
          </Card.Footer>
        </Card>
      );
      const actions = container.querySelector('.gap-3');
      expect(actions).toBeInTheDocument();
    });

    it('should apply small spacing when spacing is sm', () => {
      const { container } = render(
        <Card>
          <Card.Footer>
            <Card.Actions spacing="sm">
              <button>Action</button>
            </Card.Actions>
          </Card.Footer>
        </Card>
      );
      const actions = container.querySelector('.gap-2');
      expect(actions).toBeInTheDocument();
    });

    it('should apply large spacing when spacing is lg', () => {
      const { container } = render(
        <Card>
          <Card.Footer>
            <Card.Actions spacing="lg">
              <button>Action</button>
            </Card.Actions>
          </Card.Footer>
        </Card>
      );
      const actions = container.querySelector('.gap-4');
      expect(actions).toBeInTheDocument();
    });
  });

  describe('Composable Card', () => {
    it('should render complete card with all slots', () => {
      render(
        <Card variant="elevated" hover>
          <Card.Header title="Card Title" subtitle="Card subtitle" action={<button>Edit</button>} />
          <Card.Body>
            <p>This is the card body content</p>
          </Card.Body>
          <Card.Footer>
            <Card.Actions align="right">
              <button>Cancel</button>
              <button>Save</button>
            </Card.Actions>
          </Card.Footer>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card subtitle')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('This is the card body content')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should render card with only body', () => {
      render(
        <Card>
          <Card.Body>Simple card content</Card.Body>
        </Card>
      );

      expect(screen.getByText('Simple card content')).toBeInTheDocument();
    });

    it('should render card with header and body only', () => {
      render(
        <Card>
          <Card.Header title="Title" />
          <Card.Body>Content</Card.Body>
        </Card>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});
