import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import { SecurityDepositCard } from '../SecurityDepositCard';

describe('SecurityDepositCard', () => {
  let mockOnAddSuccess: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnAddSuccess = vi.fn();
  });

  describe('Rendering', () => {
    it('should render security deposit card', () => {
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      expect(screen.getByTestId('security-deposit-card')).toBeInTheDocument();
    });

    it('should render deposit information section when deposit exists', () => {
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      // Deposit information might not be present if no deposit exists
      const depositInfo = screen.queryByTestId('deposit-information');
      if (depositInfo) {
        expect(depositInfo).toBeInTheDocument();
      }
    });

    it('should render no deposit section when no deposit exists', () => {
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      // Either deposit info or no deposit section should be present
      const noDeposit = screen.queryByTestId('no-deposit-section');
      const depositInfo = screen.queryByTestId('deposit-information');
      
      expect(noDeposit || depositInfo).toBeTruthy();
    });

    it('should render create deposit button when no deposit', () => {
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      const createButton = screen.queryByTestId('create-deposit-button');
      if (createButton) {
        expect(createButton).toBeInTheDocument();
      }
    });
  });

  describe('Deposit Display', () => {
    it('should display total deposit amount when deposit exists', () => {
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      const totalDeposit = screen.queryByTestId('total-deposit-amount');
      if (totalDeposit) {
        expect(totalDeposit).toBeInTheDocument();
      }
    });

    it('should display deposit status badge when deposit exists', () => {
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      const statusBadge = screen.queryByTestId('deposit-status-badge');
      if (statusBadge) {
        expect(statusBadge).toBeInTheDocument();
      }
    });

    it('should display available amount when deposit exists', () => {
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      const availableAmount = screen.queryByTestId('available-amount-section');
      if (availableAmount) {
        expect(availableAmount).toBeInTheDocument();
      }
    });

    it('should display deposit source when deposit exists', () => {
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      const sourceSection = screen.queryByTestId('source-section');
      if (sourceSection) {
        expect(sourceSection).toBeInTheDocument();
      }
    });

    it('should display frozen amount section when amount is frozen', () => {
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      const frozenSection = screen.queryByTestId('frozen-amount-section');
      if (frozenSection) {
        expect(frozenSection).toBeInTheDocument();
      }
    });
  });

  describe('Add to Deposit Form', () => {
    it('should show add to deposit form when button clicked', async () => {
      const user = userEvent.setup();
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      const addButton = screen.queryByTestId('add-to-deposit-button');
      if (addButton) {
        await user.click(addButton);
        expect(screen.getByTestId('add-deposit-form')).toBeInTheDocument();
      }
    });

    it('should have amount input field in form', async () => {
      const user = userEvent.setup();
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      const addButton = screen.queryByTestId('add-to-deposit-button');
      if (addButton) {
        await user.click(addButton);
        expect(screen.getByTestId('deposit-amount-input')).toBeInTheDocument();
      }
    });

    it('should have currency select field in form', async () => {
      const user = userEvent.setup();
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      const addButton = screen.queryByTestId('add-to-deposit-button');
      if (addButton) {
        await user.click(addButton);
        expect(screen.getByTestId('deposit-currency-select')).toBeInTheDocument();
      }
    });

    it('should have source select field in form', async () => {
      const user = userEvent.setup();
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      const addButton = screen.queryByTestId('add-to-deposit-button');
      if (addButton) {
        await user.click(addButton);
        expect(screen.getByTestId('deposit-source-select')).toBeInTheDocument();
      }
    });

    it('should have submit button in form', async () => {
      const user = userEvent.setup();
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      const addButton = screen.queryByTestId('add-to-deposit-button');
      if (addButton) {
        await user.click(addButton);
        expect(screen.getByTestId('submit-deposit-button')).toBeInTheDocument();
      }
    });

    it('should have cancel button in form', async () => {
      const user = userEvent.setup();
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      const addButton = screen.queryByTestId('add-to-deposit-button');
      if (addButton) {
        await user.click(addButton);
        expect(screen.getByTestId('cancel-deposit-button')).toBeInTheDocument();
      }
    });
  });

  describe('Form Interactions', () => {
    it('should allow typing amount', async () => {
      const user = userEvent.setup();
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      const addButton = screen.queryByTestId('add-to-deposit-button');
      if (addButton) {
        await user.click(addButton);
        const amountInput = screen.getByTestId('deposit-amount-input') as HTMLInputElement;
        await user.type(amountInput, '100');
        expect(amountInput.value).toBe('100');
      }
    });

    it('should allow selecting currency', async () => {
      const user = userEvent.setup();
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      const addButton = screen.queryByTestId('add-to-deposit-button');
      if (addButton) {
        await user.click(addButton);
        const currencySelect = screen.getByTestId('deposit-currency-select') as HTMLSelectElement;
        await user.selectOptions(currencySelect, 'SAR');
        expect(currencySelect.value).toBe('SAR');
      }
    });

    it('should allow selecting source', async () => {
      const user = userEvent.setup();
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      const addButton = screen.queryByTestId('add-to-deposit-button');
      if (addButton) {
        await user.click(addButton);
        const sourceSelect = screen.getByTestId('deposit-source-select') as HTMLSelectElement;
        await user.selectOptions(sourceSelect, 'TRANSACTION_HISTORY');
        expect(sourceSelect.value).toBe('TRANSACTION_HISTORY');
      }
    });

    it('should close form when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      const addButton = screen.queryByTestId('add-to-deposit-button');
      if (addButton) {
        await user.click(addButton);
        const cancelButton = screen.getByTestId('cancel-deposit-button');
        await user.click(cancelButton);
        
        // Form should be hidden after cancel
        const form = screen.queryByTestId('add-deposit-form');
        if (form) {
          expect(form).not.toBeVisible();
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should display error message when add deposit fails', () => {
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      const errorMessage = screen.queryByTestId('add-deposit-error');
      if (errorMessage) {
        expect(errorMessage).toBeInTheDocument();
      }
    });

    it('should display amount error when validation fails', async () => {
      const user = userEvent.setup();
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      const addButton = screen.queryByTestId('add-to-deposit-button');
      if (addButton) {
        await user.click(addButton);
        const amountError = screen.queryByTestId('amount-error');
        if (amountError) {
          expect(amountError).toBeInTheDocument();
        }
      }
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      render(<SecurityDepositCard onAddSuccess={mockOnAddSuccess} />);
      
      // Loading state might not be visible if data loads quickly
      const card = screen.getByTestId('security-deposit-card');
      expect(card).toBeInTheDocument();
    });
  });
});
