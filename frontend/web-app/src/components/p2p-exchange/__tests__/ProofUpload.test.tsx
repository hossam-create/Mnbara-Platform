import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import ProofUpload from '../ProofUpload';
import { mockMatches } from '../../../__tests__/fixtures/mock-data';

describe('ProofUpload', () => {
  const mockMatch = mockMatches[0];
  const mockOnProofUploaded = vi.fn();
  const mockOnCancel = vi.fn();

  describe('Rendering', () => {
    it('should render proof upload form', () => {
      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByText(/proof|upload|evidence/i)).toBeInTheDocument();
    });

    it('should display upload instructions', () => {
      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByText(/upload|drag|drop|select/i)).toBeInTheDocument();
    });

    it('should display accepted file types', () => {
      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByText(/image|pdf|jpg|png/i)).toBeInTheDocument();
    });

    it('should display file size limit', () => {
      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByText(/size|mb|limit/i)).toBeInTheDocument();
    });

    it('should display upload button', () => {
      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByRole('button', { name: /upload|submit/i })).toBeInTheDocument();
    });
  });

  describe('File Upload', () => {
    it('should handle file selection', async () => {
      const user = userEvent.setup();
      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );

      const fileInput = screen.getByLabelText(/upload|file/i, { hidden: true });
      const file = new File(['test'], 'proof.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, file);

      expect(fileInput).toHaveValue(expect.stringContaining('proof.jpg'));
    });

    it('should display selected file name', async () => {
      const user = userEvent.setup();
      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );

      const fileInput = screen.getByLabelText(/upload|file/i, { hidden: true });
      const file = new File(['test'], 'proof.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, file);

      expect(screen.getByText(/proof\.jpg/i)).toBeInTheDocument();
    });

    it('should validate file type', async () => {
      const user = userEvent.setup();
      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );

      const fileInput = screen.getByLabelText(/upload|file/i, { hidden: true });
      const file = new File(['test'], 'proof.txt', { type: 'text/plain' });

      await user.upload(fileInput, file);

      expect(screen.queryByText(/invalid|type|format/i)).toBeInTheDocument();
    });

    it('should validate file size', async () => {
      const user = userEvent.setup();
      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );

      const fileInput = screen.getByLabelText(/upload|file/i, { hidden: true });
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, largeFile);

      expect(screen.queryByText(/too large|size.*exceeded/i)).toBeInTheDocument();
    });

    it('should call onProofUploaded on successful upload', async () => {
      const user = userEvent.setup();
      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );

      const fileInput = screen.getByLabelText(/upload|file/i, { hidden: true });
      const file = new File(['test'], 'proof.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, file);

      const submitButton = screen.getByRole('button', { name: /upload|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnProofUploaded).toHaveBeenCalled();
      });
    });
  });

  describe('User Interactions', () => {
    it('should handle cancel button', async () => {
      const user = userEvent.setup();
      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should disable submit when no file selected', () => {
      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /upload|submit/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit when file selected', async () => {
      const user = userEvent.setup();
      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );

      const fileInput = screen.getByLabelText(/upload|file/i, { hidden: true });
      const file = new File(['test'], 'proof.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, file);

      const submitButton = screen.getByRole('button', { name: /upload|submit/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels', () => {
      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByLabelText(/upload|file/i, { hidden: true })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );

      await user.tab();
      expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
    });

    it('should have ARIA labels for form', () => {
      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );
      const form = screen.getByRole('form', { hidden: true });
      expect(form).toHaveAttribute('aria-label');
    });
  });

  describe('Loading State', () => {
    it('should show loading state during upload', async () => {
      const user = userEvent.setup();
      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );

      const fileInput = screen.getByLabelText(/upload|file/i, { hidden: true });
      const file = new File(['test'], 'proof.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, file);

      const submitButton = screen.getByRole('button', { name: /upload|submit/i });
      await user.click(submitButton);

      expect(submitButton).toHaveAttribute('disabled');
    });
  });

  describe('RTL Support', () => {
    it('should render with RTL direction', () => {
      render(
        <ProofUpload
          match={mockMatch}
          onProofUploaded={mockOnProofUploaded}
          onCancel={mockOnCancel}
        />
      );
      const form = screen.getByRole('form', { hidden: true });
      expect(form).toHaveAttribute('dir', 'rtl');
    });
  });
});
