import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Modal } from './Modal';

describe('Modal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    // Create a div with id 'root' for portal target
    const root = document.createElement('div');
    root.setAttribute('id', 'root');
    document.body.appendChild(root);
  });

  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
    document.body.style.overflow = 'unset';
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <Modal.Body>Modal content</Modal.Body>
        </Modal>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <Modal.Body>Modal content</Modal.Body>
        </Modal>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should render with custom size', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} size="lg">
          <Modal.Body>Modal content</Modal.Body>
        </Modal>
      );

      // Query from document since modal is in a portal
      const modalContent = document.querySelector('.max-w-lg');
      expect(modalContent).toBeInTheDocument();
    });

    it('should render with all sub-components', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <Modal.Header onClose={mockOnClose}>Modal Title</Modal.Header>
          <Modal.Body>Modal content</Modal.Body>
          <Modal.Footer>Footer content</Modal.Footer>
        </Modal>
      );

      expect(screen.getByText('Modal Title')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });
  });

  describe('Portal Rendering', () => {
    it('should render modal using portal to document.body by default', () => {
      render(
        <div id="app">
          <Modal isOpen={true} onClose={mockOnClose}>
            <Modal.Body>Modal content</Modal.Body>
          </Modal>
        </div>
      );

      // Modal should be rendered in a portal container, not inside #app
      const modal = screen.getByRole('dialog');
      const portalContainer = modal.parentElement;
      expect(portalContainer).toHaveAttribute('data-modal-container', 'true');
      expect(document.body.contains(portalContainer)).toBe(true);
    });

    it('should render modal to custom portal target', () => {
      const customTarget = document.createElement('div');
      customTarget.setAttribute('id', 'modal-root');
      document.body.appendChild(customTarget);

      render(
        <Modal isOpen={true} onClose={mockOnClose} portalTarget={customTarget}>
          <Modal.Body>Modal content</Modal.Body>
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      const portalContainer = modal.parentElement;
      expect(portalContainer).toHaveAttribute('data-modal-container', 'true');
      expect(customTarget.contains(portalContainer)).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <Modal.Body>Modal content</Modal.Body>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('tabIndex', '-1');
    });

    it('should focus modal when opened', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <Modal.Body>Modal content</Modal.Body>
        </Modal>
      );

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveFocus();
      });
    });

    it('should restore focus to previous element when closed', async () => {
      const button = document.createElement('button');
      button.textContent = 'Open Modal';
      document.body.appendChild(button);
      button.focus();

      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <Modal.Body>Modal content</Modal.Body>
        </Modal>
      );

      // Close modal
      rerender(
        <Modal isOpen={false} onClose={mockOnClose}>
          <Modal.Body>Modal content</Modal.Body>
        </Modal>
      );

      await waitFor(() => {
        expect(button).toHaveFocus();
      });
    });
  });

  describe('Overlay Click', () => {
    it('should close modal when overlay is clicked and closeOnOverlayClick is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={true}>
          <Modal.Body>Modal content</Modal.Body>
        </Modal>
      );

      // Query from document since modal is in a portal
      const overlay = document.querySelector('.bg-black.bg-opacity-50');
      fireEvent.click(overlay!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close modal when overlay is clicked and closeOnOverlayClick is false', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={false}>
          <Modal.Body>Modal content</Modal.Body>
        </Modal>
      );

      // Query from document since modal is in a portal
      const overlay = document.querySelector('.bg-black.bg-opacity-50');
      fireEvent.click(overlay!);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not close modal when clicking inside modal content', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <Modal.Body>Modal content</Modal.Body>
        </Modal>
      );

      const modalContent = screen.getByText('Modal content');
      fireEvent.click(modalContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Escape Key', () => {
    it('should close modal when Escape key is pressed and closeOnEscape is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnEscape={true}>
          <Modal.Body>Modal content</Modal.Body>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close modal when Escape key is pressed and closeOnEscape is false', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnEscape={false}>
          <Modal.Body>Modal content</Modal.Body>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not close modal when other keys are pressed', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <Modal.Body>Modal content</Modal.Body>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Lock', () => {
    it('should prevent body scroll when modal is open', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <Modal.Body>Modal content</Modal.Body>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when modal is closed', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <Modal.Body>Modal content</Modal.Body>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Modal isOpen={false} onClose={mockOnClose}>
          <Modal.Body>Modal content</Modal.Body>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Modal.Header', () => {
    it('should render header with children', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <Modal.Header>Test Header</Modal.Header>
        </Modal>
      );

      expect(screen.getByText('Test Header')).toBeInTheDocument();
    });

    it('should render close button when onClose is provided', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <Modal.Header onClose={mockOnClose}>Test Header</Modal.Header>
        </Modal>
      );

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <Modal.Header onClose={mockOnClose}>Test Header</Modal.Header>
        </Modal>
      );

      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not render close button when onClose is not provided', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <Modal.Header>Test Header</Modal.Header>
        </Modal>
      );

      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });
  });

  describe('Modal.Body', () => {
    it('should render body with children', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <Modal.Body>Body content</Modal.Body>
        </Modal>
      );

      expect(screen.getByText('Body content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <Modal.Body className="custom-class">Body content</Modal.Body>
        </Modal>
      );

      // Query from document since modal is in a portal
      const body = document.querySelector('.custom-class');
      expect(body).toBeInTheDocument();
    });
  });

  describe('Modal.Footer', () => {
    it('should render footer with children', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <Modal.Footer>Footer content</Modal.Footer>
        </Modal>
      );

      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <Modal.Footer className="custom-footer">Footer content</Modal.Footer>
        </Modal>
      );

      // Query from document since modal is in a portal
      const footer = document.querySelector('.custom-footer');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it.each([
      ['sm', 'max-w-sm'],
      ['md', 'max-w-md'],
      ['lg', 'max-w-lg'],
      ['xl', 'max-w-xl'],
    ])('should apply correct size class for %s size', (size, expectedClass) => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} size={size as any}>
          <Modal.Body>Content</Modal.Body>
        </Modal>
      );

      // Query from document since modal is in a portal
      const modalContent = document.querySelector(`.${expectedClass}`);
      expect(modalContent).toBeInTheDocument();
    });
  });
});
