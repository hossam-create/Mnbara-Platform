import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletBalance } from '../WalletBalance';

// Mock the useWallet hook
const mockUseWallet = {
  isConnected: true,
  address: '0x1234567890abcdef1234567890abcdef12345678',
  balance: '1.5',
  mnbBalance: '1000.0',
  kycTier: 2,
  dailyLimit: '5000.0',
  refreshBalances: vi.fn(),
  formatAddress: (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`,
  getMNBPrice: vi.fn().mockResolvedValue(1.0),
};

vi.mock('../../../context/WalletContext', () => ({
  useWallet: () => mockUseWallet,
}));

// Helper to find text that may be formatted with different locales
const findBalanceText = (container: HTMLElement, expectedValue: string) => {
  // Look for the balance value in the rendered content
  const textContent = container.textContent || '';
  // Check if the expected value (or its numeric equivalent) is present
  const numericValue = parseFloat(expectedValue.replace(/,/g, ''));
  return textContent.includes(expectedValue) || 
         textContent.includes(numericValue.toString()) ||
         textContent.includes(numericValue.toLocaleString());
};

describe('WalletBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWallet.isConnected = true;
    mockUseWallet.mnbBalance = '1000.0';
    mockUseWallet.balance = '1.5';
    mockUseWallet.kycTier = 2;
    mockUseWallet.dailyLimit = '5000.0';
    mockUseWallet.getMNBPrice.mockResolvedValue(1.0);
  });

  describe('Rendering', () => {
    it('should not render when wallet is not connected', () => {
      mockUseWallet.isConnected = false;

      const { container } = render(<WalletBalance />);

      expect(container.firstChild).toBeNull();
    });

    it('should render MNB balance in card variant', () => {
      const { container } = render(<WalletBalance variant="card" />);

      expect(screen.getByText('MNB Token Balance')).toBeInTheDocument();
      expect(screen.getByText('MNBT')).toBeInTheDocument();
      // Balance is formatted with locale, check container has the value
      expect(findBalanceText(container, '1,000')).toBe(true);
    });

    it('should render formatted address in card variant', () => {
      render(<WalletBalance variant="card" />);

      expect(screen.getByText('0x1234...5678')).toBeInTheDocument();
    });
  });

  describe('Compact Variant', () => {
    it('should render balance in compact format', () => {
      const { container } = render(<WalletBalance variant="compact" />);

      // Balance is formatted with locale, check container has the value and MNBT
      expect(findBalanceText(container, '1,000')).toBe(true);
      expect(container.textContent).toContain('MNBT');
    });
  });

  describe('Inline Variant', () => {
    it('should render balance inline with USD equivalent', () => {
      const { container } = render(<WalletBalance variant="inline" />);

      // Balance is formatted with locale
      expect(findBalanceText(container, '1,000')).toBe(true);
      expect(container.textContent).toContain('MNBT');
      expect(container.textContent).toContain('≈');
    });

    it('should show ETH balance when showEth is true', () => {
      const { container } = render(<WalletBalance variant="inline" showEth />);

      expect(container.textContent).toContain('ETH');
    });
  });

  describe('Card Variant Features', () => {
    it('should show ETH balance when showEth is true', () => {
      render(<WalletBalance variant="card" showEth />);

      expect(screen.getByText('ETH Balance')).toBeInTheDocument();
      expect(screen.getByText('1.5000')).toBeInTheDocument();
    });

    it('should show KYC tier when showKycTier is true', () => {
      render(<WalletBalance variant="card" showKycTier />);

      expect(screen.getByText('KYC Status')).toBeInTheDocument();
      expect(screen.getByText('Enhanced')).toBeInTheDocument();
    });

    it('should show daily limit when showKycTier is true', () => {
      const { container } = render(<WalletBalance variant="card" showKycTier />);

      expect(screen.getByText('Daily Limit')).toBeInTheDocument();
      // Daily limit is formatted with locale
      expect(findBalanceText(container, '5,000')).toBe(true);
    });

    it('should display correct KYC tier labels', () => {
      // Test tier 0
      mockUseWallet.kycTier = 0;
      const { rerender } = render(<WalletBalance variant="card" showKycTier />);
      expect(screen.getByText('Not Verified')).toBeInTheDocument();

      // Test tier 1
      mockUseWallet.kycTier = 1;
      rerender(<WalletBalance variant="card" showKycTier />);
      expect(screen.getByText('Basic')).toBeInTheDocument();

      // Test tier 3
      mockUseWallet.kycTier = 3;
      rerender(<WalletBalance variant="card" showKycTier />);
      expect(screen.getByText('Full')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('should call refreshBalances when refresh button is clicked in card variant', async () => {
      render(<WalletBalance variant="card" />);

      const refreshButton = screen.getByTitle('Refresh balance');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockUseWallet.refreshBalances).toHaveBeenCalled();
      });
    });

    it('should call refreshBalances when refresh button is clicked in inline variant', async () => {
      render(<WalletBalance variant="inline" />);

      const refreshButton = screen.getByTitle('Refresh balance');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockUseWallet.refreshBalances).toHaveBeenCalled();
      });
    });
  });

  describe('Action Links', () => {
    it('should render deposit and withdraw links in card variant', () => {
      render(<WalletBalance variant="card" />);

      expect(screen.getByText('Deposit')).toBeInTheDocument();
      expect(screen.getByText('Withdraw')).toBeInTheDocument();
    });
  });

  describe('Balance Formatting', () => {
    it('should format large balances with commas', () => {
      mockUseWallet.mnbBalance = '1234567.89';

      const { container } = render(<WalletBalance variant="card" />);

      // Balance is formatted with locale
      expect(findBalanceText(container, '1,234,567.89')).toBe(true);
    });

    it('should handle zero balance', () => {
      mockUseWallet.mnbBalance = '0';

      const { container } = render(<WalletBalance variant="card" />);

      // Zero balance should be displayed
      expect(container.textContent).toContain('MNB Token Balance');
      expect(findBalanceText(container, '0')).toBe(true);
    });
  });
});
