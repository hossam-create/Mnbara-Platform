import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListingForm } from '../ListingForm';

describe('ListingForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create a mock file
  const createMockFile = (name: string = 'test.jpg'): File => {
    return new File(['test'], name, { type: 'image/jpeg' });
  };

  describe('Rendering', () => {
    it('should render all required form fields', () => {
      render(<ListingForm {...defaultProps} />);

      expect(screen.getByPlaceholderText('Enter a descriptive title')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Describe your product in detail...')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Condition')).toBeInTheDocument();
      expect(screen.getByText('Listing Type')).toBeInTheDocument();
    });

    it('should render listing type options', () => {
      render(<ListingForm {...defaultProps} />);

      expect(screen.getByText('Buy Now')).toBeInTheDocument();
      expect(screen.getByText('Auction')).toBeInTheDocument();
      expect(screen.getByText('Make Offer')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<ListingForm {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save as Draft')).toBeInTheDocument();
      expect(screen.getByText('Publish Listing')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when title is empty on publish', async () => {
      render(<ListingForm {...defaultProps} />);

      const publishButton = screen.getByText('Publish Listing');
      await userEvent.click(publishButton);

      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });

    it('should show error when description is empty on publish', async () => {
      render(<ListingForm {...defaultProps} />);

      // Fill title but leave description empty
      const titleInput = screen.getByPlaceholderText('Enter a descriptive title');
      await userEvent.type(titleInput, 'Test Product');

      const publishButton = screen.getByText('Publish Listing');
      await userEvent.click(publishButton);

      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    it('should show error when category is not selected on publish', async () => {
      render(<ListingForm {...defaultProps} />);

      // Fill title and description
      const titleInput = screen.getByPlaceholderText('Enter a descriptive title');
      await userEvent.type(titleInput, 'Test Product');

      const descInput = screen.getByPlaceholderText('Describe your product in detail...');
      await userEvent.type(descInput, 'Test description');

      const publishButton = screen.getByText('Publish Listing');
      await userEvent.click(publishButton);

      expect(screen.getByText('Category is required')).toBeInTheDocument();
    });

    it('should show error when no images are uploaded on publish', async () => {
      render(<ListingForm {...defaultProps} />);

      // Fill required text fields
      const titleInput = screen.getByPlaceholderText('Enter a descriptive title');
      await userEvent.type(titleInput, 'Test Product');

      const descInput = screen.getByPlaceholderText('Describe your product in detail...');
      await userEvent.type(descInput, 'Test description');

      // Select category using the first combobox
      const categorySelects = screen.getAllByRole('combobox');
      await userEvent.selectOptions(categorySelects[0], 'electronics');

      const publishButton = screen.getByText('Publish Listing');
      await userEvent.click(publishButton);

      expect(screen.getByText('At least one image is required')).toBeInTheDocument();
    });

    it('should show error when price is 0 for buy_now listing', async () => {
      render(<ListingForm {...defaultProps} />);

      // Fill required fields
      const titleInput = screen.getByPlaceholderText('Enter a descriptive title');
      await userEvent.type(titleInput, 'Test Product');

      const descInput = screen.getByPlaceholderText('Describe your product in detail...');
      await userEvent.type(descInput, 'Test description');

      // Select category
      const categorySelects = screen.getAllByRole('combobox');
      await userEvent.selectOptions(categorySelects[0], 'electronics');

      // Upload an image
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile();
      await userEvent.upload(fileInput, file);

      const publishButton = screen.getByText('Publish Listing');
      await userEvent.click(publishButton);

      expect(screen.getByText('Price must be greater than 0')).toBeInTheDocument();
    });
  });

  describe('Auction Listing Validation', () => {
    it('should show auction settings when auction type is selected', async () => {
      render(<ListingForm {...defaultProps} />);

      const auctionButton = screen.getByText('Auction').closest('button');
      await userEvent.click(auctionButton!);

      expect(screen.getByText('Auction Settings')).toBeInTheDocument();
      expect(screen.getByText('Starting Price')).toBeInTheDocument();
      expect(screen.getByText('Reserve Price (Optional)')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
    });

    it('should show error when starting price is 0 for auction listing', async () => {
      render(<ListingForm {...defaultProps} />);

      // Select auction type
      const auctionButton = screen.getByText('Auction').closest('button');
      await userEvent.click(auctionButton!);

      // Fill required fields
      const titleInput = screen.getByPlaceholderText('Enter a descriptive title');
      await userEvent.type(titleInput, 'Test Auction Product');

      const descInput = screen.getByPlaceholderText('Describe your product in detail...');
      await userEvent.type(descInput, 'Test description');

      // Select category
      const categorySelects = screen.getAllByRole('combobox');
      await userEvent.selectOptions(categorySelects[0], 'electronics');

      // Upload an image
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile();
      await userEvent.upload(fileInput, file);

      const publishButton = screen.getByText('Publish Listing');
      await userEvent.click(publishButton);

      expect(screen.getByText('Starting price must be greater than 0')).toBeInTheDocument();
    });
  });

  describe('Draft Submission', () => {
    it('should allow saving as draft without validation', async () => {
      render(<ListingForm {...defaultProps} />);

      const draftButton = screen.getByText('Save as Draft');
      await userEvent.click(draftButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '',
            description: '',
          }),
          true // isDraft
        );
      });
    });
  });

  describe('Cancel Action', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      render(<ListingForm {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should disable buttons when isLoading is true', () => {
      render(<ListingForm {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Cancel')).toBeDisabled();
      expect(screen.getByText('Saving...')).toBeDisabled();
      expect(screen.getByText('Publishing...')).toBeDisabled();
    });
  });

  describe('Image Upload', () => {
    it('should show error when trying to upload more than 10 images', async () => {
      render(<ListingForm {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Create 11 files
      const files = Array.from({ length: 11 }, (_, i) => createMockFile(`test${i}.jpg`));
      
      await userEvent.upload(fileInput, files);

      expect(screen.getByText('Maximum 10 images allowed')).toBeInTheDocument();
    });
  });

  describe('Initial Data', () => {
    it('should populate form with initial data', () => {
      render(
        <ListingForm
          {...defaultProps}
          initialData={{
            title: 'Existing Product',
            description: 'Existing description',
            categoryId: 'electronics',
            price: 99.99,
          }}
        />
      );

      expect(screen.getByDisplayValue('Existing Product')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
    });
  });
});
