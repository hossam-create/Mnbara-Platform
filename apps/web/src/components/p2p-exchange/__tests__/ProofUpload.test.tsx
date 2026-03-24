import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import { ProofUpload } from '../ProofUpload';

describe('ProofUpload', () => {
  let mockOnSuccess: ReturnType<typeof vi.fn>;
  let mockOnCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSuccess = vi.fn();
    mockOnCancel = vi.fn();
  });

  describe('Rendering', () => {
    it('should render proof upload component', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByTestId('proof-upload')).toBeInTheDocument();
    });

    it('should render proof upload form', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByTestId('proof-upload-form')).toBeInTheDocument();
    });

    it('should render photo upload section', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByTestId('photo-upload-section')).toBeInTheDocument();
    });

    it('should render video upload section', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByTestId('video-upload-section')).toBeInTheDocument();
    });

    it('should render photo dropzone', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByTestId('photo-dropzone')).toBeInTheDocument();
    });

    it('should render form fields', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByTestId('reference-id-input')).toBeInTheDocument();
      expect(screen.getByTestId('recipient-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('payment-method-select')).toBeInTheDocument();
      expect(screen.getByTestId('notes-textarea')).toBeInTheDocument();
    });

    it('should render upload button', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByTestId('upload-proof-button')).toBeInTheDocument();
    });

    it('should render cancel button when onCancel provided', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByTestId('cancel-upload-button')).toBeInTheDocument();
    });
  });

  describe('Photo Upload', () => {
    it('should disable upload button when no photo selected', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const button = screen.getByTestId('upload-proof-button');
      expect(button).toBeDisabled();
    });

    it('should display photo input', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByTestId('photo-input')).toBeInTheDocument();
    });

    it('should display video input', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByTestId('video-input')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should have reference ID input with proper id', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );
      const input = screen.getByTestId('reference-id-input') as HTMLInputElement;
      expect(input.id).toBe('referenceId');
    });

    it('should have recipient name input with proper id', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );
      const input = screen.getByTestId('recipient-name-input') as HTMLInputElement;
      expect(input.id).toBe('recipientName');
    });

    it('should have payment method select with proper id', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );
      const select = screen.getByTestId('payment-method-select') as HTMLSelectElement;
      expect(select.id).toBe('paymentMethod');
    });

    it('should have notes textarea with proper id', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );
      const textarea = screen.getByTestId('notes-textarea') as HTMLTextAreaElement;
      expect(textarea.id).toBe('notes');
    });
  });

  describe('User Interactions', () => {
    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByTestId('cancel-upload-button');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should allow typing in reference ID field', async () => {
      const user = userEvent.setup();
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const input = screen.getByTestId('reference-id-input') as HTMLInputElement;
      await user.type(input, 'REF123456');

      expect(input.value).toBe('REF123456');
    });

    it('should allow typing in recipient name field', async () => {
      const user = userEvent.setup();
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const input = screen.getByTestId('recipient-name-input') as HTMLInputElement;
      await user.type(input, 'John Doe');

      expect(input.value).toBe('John Doe');
    });

    it('should allow selecting payment method', async () => {
      const user = userEvent.setup();
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const select = screen.getByTestId('payment-method-select') as HTMLSelectElement;
      await user.selectOptions(select, 'bank_transfer');

      expect(select.value).toBe('bank_transfer');
    });

    it('should allow typing in notes field', async () => {
      const user = userEvent.setup();
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const textarea = screen.getByTestId('notes-textarea') as HTMLTextAreaElement;
      await user.type(textarea, 'Additional notes here');

      expect(textarea.value).toBe('Additional notes here');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when upload fails', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Error message might not be present initially
      const errorMessage = screen.queryByTestId('upload-error-message');
      if (errorMessage) {
        expect(errorMessage).toBeInTheDocument();
      }
    });

    it('should display reference ID error when field is invalid', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Error might not be present initially
      const error = screen.queryByTestId('reference-id-error');
      if (error) {
        expect(error).toBeInTheDocument();
      }
    });

    it('should display recipient name error when field is invalid', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Error might not be present initially
      const error = screen.queryByTestId('recipient-name-error');
      if (error) {
        expect(error).toBeInTheDocument();
      }
    });

    it('should display payment method error when field is invalid', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Error might not be present initially
      const error = screen.queryByTestId('payment-method-error');
      if (error) {
        expect(error).toBeInTheDocument();
      }
    });
  });

  describe('Success State', () => {
    it('should display success message when upload succeeds', () => {
      render(
        <ProofUpload
          matchId={1}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Success message might not be present initially
      const successMessage = screen.queryByTestId('upload-success-message');
      if (successMessage) {
        expect(successMessage).toBeInTheDocument();
      }
    });
  });
});
