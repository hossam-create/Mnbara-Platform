import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletConnectButton } from '../WalletConnectButton';

// Mock the useWallet hook
const mockUseWallet = {
  isConnected: false,
  isConnecting: false,
  address: null as string | null,
  mnbBalance: '0',
  connectMetaMask: vi.fn(),
  disconnect: vi.fn(),
  formatAddress: (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`,
  isMetaMaskInstalled: true,
  error: null as string | null,
};

vi.mock('../../../context/WalletContext', () => ({
  useWallet: () => mockUseWallet,
}));

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('WalletConnectButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWallet.isConnected = false;
    mockUseWallet.isConnecting = false;
    mockUseWallet.address = null;
    mockUseWallet.mnbBalance = '0';
    mockUseWallet.isMetaMaskInstalled = true;
    mockUseWallet.error = null;
    mockUseWallet.connectMetaMask.mockResolvedValue(undefined);
    mockUseWallet.disconnect.mockResolvedValue(undefined);
  });

  describe('Disconnected State', () => {
    it('should render connect button when not connected', () => {
      render(<WalletConnectButton />);

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('should open connection modal when clicked', () => {
      render(<WalletConnectButton />);

      fireEvent.click(screen.getByText('Connect Wallet'));

      expect(screen.getByText('Connect your wallet to pay with MNB tokens')).toBeInTheDocument();
    });

    it('should show MetaMask option in modal', () => {
      render(<WalletConnectButton />);

      fireEvent.click(screen.getByText('Connect Wallet'));

      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('Connect to your MetaMask wallet')).toBeInTheDocument();
    });

    it('should call connectMetaMask when MetaMask option is clicked', async () => {
      render(<WalletConnectButton />);

      fireEvent.click(screen.getByText('Connect Wallet'));
      
      const metamaskButton = screen.getByText('MetaMask').closest('button');
      fireEvent.click(metamaskButton!);

      await waitFor(() => {
        expect(mockUseWallet.connectMetaMask).toHaveBeenCalled();
      });
    });

    it('should open MetaMask download page when not installed', () => {
      mockUseWallet.isMetaMaskInstalled = false;

      render(<WalletConnectButton />);

      fireEvent.click(screen.getByText('Connect Wallet'));
      
      const metamaskButton = screen.getByText('MetaMask').closest('button');
      fireEvent.click(metamaskButton!);

      expect(mockWindowOpen).toHaveBeenCalledWith('https://metamask.io/download/', '_blank');
    });
  });

  describe('Connected State', () => {
    beforeEach(() => {
      mockUseWallet.isConnected = true;
      mockUseWallet.address = '0x1234567890abcdef1234567890abcdef12345678';
      mockUseWallet.mnbBalance = '1000.0';
    });

    it('should display formatted address when connected', () => {
      render(<WalletConnectButton />);

      expect(screen.getByText('0x1234...5678')).toBeInTheDocument();
    });

    it('should display balance when showBalance is true', () => {
      render(<WalletConnectButton showBalance />);

      expect(screen.getByText('1000.00 MNBT')).toBeInTheDocument();
    });

    it('should open dropdown when clicked', () => {
      render(<WalletConnectButton />);

      fireEvent.click(screen.getByText('0x1234...5678'));

      expect(screen.getByText('MNB Balance')).toBeInTheDocument();
      expect(screen.getByText('View Wallet')).toBeInTheDocument();
      expect(screen.getByText('Transaction History')).toBeInTheDocument();
      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });

    it('should call disconnect when disconnect button is clicked', async () => {
      render(<WalletConnectButton />);

      fireEvent.click(screen.getByText('0x1234...5678'));
      fireEvent.click(screen.getByText('Disconnect'));

      await waitFor(() => {
        expect(mockUseWallet.disconnect).toHaveBeenCalled();
      });
    });
  });

  describe('Compact Variant', () => {
    it('should render compact button when not connected', () => {
      render(<WalletConnectButton variant="compact" />);

      const button = screen.getByTitle('Connect Wallet');
      expect(button).toBeInTheDocument();
    });

    it('should show green indicator when connected', () => {
      mockUseWallet.isConnected = true;
      mockUseWallet.address = '0x1234567890abcdef1234567890abcdef12345678';

      render(<WalletConnectButton variant="compact" />);

      const button = screen.getByTitle('Connected: 0x1234567890abcdef1234567890abcdef12345678');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Full Variant', () => {
    it('should render full card when not connected', () => {
      render(<WalletConnectButton variant="full" />);

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      expect(screen.getByText('Pay with MNB tokens')).toBeInTheDocument();
      expect(screen.getByText('Connect MetaMask')).toBeInTheDocument();
    });

    it('should render connected card with balance', () => {
      mockUseWallet.isConnected = true;
      mockUseWallet.address = '0x1234567890abcdef1234567890abcdef12345678';
      mockUseWallet.mnbBalance = '1000.0';

      render(<WalletConnectButton variant="full" />);

      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('0x1234...5678')).toBeInTheDocument();
      expect(screen.getByText('MNB Balance')).toBeInTheDocument();
    });

    it('should show disconnect button in full variant when connected', () => {
      mockUseWallet.isConnected = true;
      mockUseWallet.address = '0x1234567890abcdef1234567890abcdef12345678';

      render(<WalletConnectButton variant="full" />);

      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show connecting state during connection', () => {
      mockUseWallet.isConnecting = true;

      render(<WalletConnectButton variant="full" />);

      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when connection fails', () => {
      mockUseWallet.error = 'User rejected connection';

      render(<WalletConnectButton variant="full" />);

      expect(screen.getByText('User rejected connection')).toBeInTheDocument();
    });
  });

  describe('Modal Behavior', () => {
    it('should close modal when backdrop is clicked', () => {
      render(<WalletConnectButton />);

      fireEvent.click(screen.getByText('Connect Wallet'));
      expect(screen.getByText('Connect your wallet to pay with MNB tokens')).toBeInTheDocument();

      // Click backdrop
      const backdrop = document.querySelector('.bg-black\\/50');
      fireEvent.click(backdrop!);

      expect(screen.queryByText('Connect your wallet to pay with MNB tokens')).not.toBeInTheDocument();
    });

    it('should close modal when close button is clicked', async () => {
      render(<WalletConnectButton />);

      fireEvent.click(screen.getByText('Connect Wallet'));
      
      // Find the close button in the modal header (the one with just an SVG, not the MetaMask button)
      const modalHeader = document.querySelector('.border-b');
      const closeButton = modalHeader?.querySelector('button');
      
      if (closeButton) {
        fireEvent.click(closeButton);
        
        await waitFor(() => {
          expect(screen.queryByText('Connect your wallet to pay with MNB tokens')).not.toBeInTheDocument();
        });
      }
    });
  });
});
