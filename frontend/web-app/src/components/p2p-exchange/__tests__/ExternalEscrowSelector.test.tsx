import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import ExternalEscrowSelector from '../ExternalEscrowSelector';

describe('ExternalEscrowSelector', () => {
  const mockOnSelect = vi.fn();

  const mockEscrowProviders = [
    { id: 'tatum', name: 'Tatum', description: 'Blockchain-based escrow' },
    { id: 'stripe', name: 'Stripe', description: 'Payment processor escrow' },
    { id: 'custom', name: 'Custom', description: 'Custom escrow service' },
  ];

  describe('Rendering', () => {
    it('should render escrow selector', () => {
      render(
        <ExternalEscrowSelector
          providers={mockEscrowProviders}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText(/escrow|provider/i)).toBeInTheDocument();
    });

    it('should display all providers', () => {
      render(
        <ExternalEscrowSelector
          providers={mockEscrowProviders}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText('Tatum')).toBeInTheDocument();
      expect(screen.getByText('Stripe')).toBeInTheDocument();
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });

    it('should display provider descriptions', () => {
      render(
        <ExternalEscrowSelector
          providers={mockEscrowProviders}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText(/blockchain-based/i)).toBeInTheDocument();
      expect(screen.getByText(/payment processor/i)).toBeInTheDocument();
    });

    it('should display provider icons', () => {
      render(
        <ExternalEscrowSelector
          providers={mockEscrowProviders}
          onSelect={mockOnSelect}
        />
      );
      const icons = screen.getAllByRole('img', { hidden: true });
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should display selection radio buttons', () => {
      render(
        <ExternalEscrowSelector
          providers={mockEscrowProviders}
          onSelect={mockOnSelect}
        />
      );
      const radios = screen.getAllByRole('radio');
      expect(radios.length).toBe(mockEscrowProviders.length);
    });
  });

  describe('User Interactions', () => {
    it('should select provider on click', async () => {
      const user = userEvent.setup();
      render(
        <ExternalEscrowSelector
          providers={mockEscrowProviders}
          onSelect={mockOnSelect}
        />
      );

      const tatumRadio = screen.getByRole('radio', { name: /tatum/i });
      await user.click(tatumRadio);

      expect(tatumRadio).toBeChecked();
    });

    it('should call onSelect when provider selected', async () => {
      const user = userEvent.setup();
      render(
        <ExternalEscrowSelector
          providers={mockEscrowProviders}
          onSelect={mockOnSelect}
        />
      );

      const tatumRadio = screen.getByRole('radio', { name: /tatum/i });
      await user.click(tatumRadio);

      expect(mockOnSelect).toHaveBeenCalledWith('tatum');
    });

    it('should allow switching between providers', async () => {
      const user = userEvent.setup();
      render(
        <ExternalEscrowSelector
          providers={mockEscrowProviders}
          onSelect={mockOnSelect}
        />
      );

      const tatumRadio = screen.getByRole('radio', { name: /tatum/i });
      const stripeRadio = screen.getByRole('radio', { name: /stripe/i });

      await user.click(tatumRadio);
      expect(tatumRadio).toBeChecked();

      await user.click(stripeRadio);
      expect(stripeRadio).toBeChecked();
      expect(tatumRadio).not.toBeChecked();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels', () => {
      render(
        <ExternalEscrowSelector
          providers={mockEscrowProviders}
          onSelect={mockOnSelect}
        />
      );
      const radios = screen.getAllByRole('radio');
      radios.forEach(radio => {
        expect(radio).toHaveAttribute('aria-label');
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <ExternalEscrowSelector
          providers={mockEscrowProviders}
          onSelect={mockOnSelect}
        />
      );

      await user.tab();
      const firstRadio = screen.getByRole('radio', { name: /tatum/i });
      expect(firstRadio).toHaveFocus();
    });

    it('should support arrow key navigation', async () => {
      const user = userEvent.setup();
      render(
        <ExternalEscrowSelector
          providers={mockEscrowProviders}
          onSelect={mockOnSelect}
        />
      );

      const firstRadio = screen.getByRole('radio', { name: /tatum/i });
      await user.click(firstRadio);

      await user.keyboard('{ArrowDown}');
      const secondRadio = screen.getByRole('radio', { name: /stripe/i });
      expect(secondRadio).toHaveFocus();
    });

    it('should have semantic HTML', () => {
      render(
        <ExternalEscrowSelector
          providers={mockEscrowProviders}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByRole('group', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Provider Information', () => {
    it('should display fees if available', () => {
      const providersWithFees = mockEscrowProviders.map(p => ({
        ...p,
        fee: '2.5%',
      }));

      render(
        <ExternalEscrowSelector
          providers={providersWithFees}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText(/2.5%|fee/i)).toBeInTheDocument();
    });

    it('should display processing time if available', () => {
      const providersWithTime = mockEscrowProviders.map(p => ({
        ...p,
        processingTime: '1-2 hours',
      }));

      render(
        <ExternalEscrowSelector
          providers={providersWithTime}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText(/1-2 hours|processing/i)).toBeInTheDocument();
    });

    it('should display security features if available', () => {
      const providersWithSecurity = mockEscrowProviders.map(p => ({
        ...p,
        security: 'SSL Encrypted',
      }));

      render(
        <ExternalEscrowSelector
          providers={providersWithSecurity}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText(/ssl|encrypted|security/i)).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable provider if unavailable', () => {
      const disabledProviders = [
        { ...mockEscrowProviders[0], disabled: true },
        mockEscrowProviders[1],
        mockEscrowProviders[2],
      ];

      render(
        <ExternalEscrowSelector
          providers={disabledProviders}
          onSelect={mockOnSelect}
        />
      );

      const tatumRadio = screen.getByRole('radio', { name: /tatum/i });
      expect(tatumRadio).toBeDisabled();
    });
  });

  describe('RTL Support', () => {
    it('should render with RTL direction', () => {
      render(
        <ExternalEscrowSelector
          providers={mockEscrowProviders}
          onSelect={mockOnSelect}
        />
      );
      const group = screen.getByRole('group', { hidden: true });
      expect(group).toHaveAttribute('dir', 'rtl');
    });
  });

  describe('Empty State', () => {
    it('should handle empty providers list', () => {
      render(
        <ExternalEscrowSelector
          providers={[]}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText(/no providers|empty/i)).toBeInTheDocument();
    });
  });
});
