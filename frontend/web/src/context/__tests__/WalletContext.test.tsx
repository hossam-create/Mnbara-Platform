import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { WalletProvider, useWallet } from '../WalletContext';
import walletService from '../../services/wallet.service';
import type { ReactNode } from 'react';

// Mock wallet service
vi.mock('../../services/wallet.service', () => ({
  default: {
    isMetaMaskInstalled: vi.fn(),
    connectMetaMask: vi.fn(),
    connectWalletConnect: vi.fn(),
    disconnect: vi.fn(),
    getEthBalance: vi.fn(),
    getMNBBalance: vi.fn(),
    getKYCTier: vi.fn(),
    getDailyLimit: vi.fn(),
    transferMNB: vi.fn(),
    approveMNB: vi.fn(),
    payWithMNB: vi.fn(),
    getMNBPrice: vi.fn(),
    getTokenInfo: vi.fn(),
    switchNetwork: vi.fn(),
    formatAddress: vi.fn((addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`),
  },
}));

// Mock window.ethereum
const mockEthereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
  isMetaMask: true,
};

// Test wrapper
const wrapper = ({ children }: { children: ReactNode }) => (
  <WalletProvider>{children}</WalletProvider>
);

// Mock wallet state
const mockWalletState = {
  isConnected: true,
  address: '0x1234567890abcdef1234567890abcdef12345678',
  chainId: 1,
  balance: '1.5',
  mnbBalance: '1000.0',
  kycTier: 2,
  dailyLimit: '5000.0',
  provider: {},
};

describe('WalletContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup window.ethereum mock
    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      writable: true,
      configurable: true,
    });
    // Default mocks
    (walletService.isMetaMaskInstalled as Mock).mockReturnValue(true);
    mockEthereum.request.mockResolvedValue([]);
  });

  describe('Initialization', () => {
    it('should initialize with disconnected state', async () => {
      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.address).toBeNull();
      expect(result.current.mnbBalance).toBe('0');
    });

    it('should check for existing connection on mount', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890abcdef1234567890abcdef12345678']);
      (walletService.connectMetaMask as Mock).mockResolvedValue(mockWalletState);

      const { result } = renderHook(() => useWallet(), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(result.current.address).toBe(mockWalletState.address);
      expect(result.current.mnbBalance).toBe(mockWalletState.mnbBalance);
    });
  });

  describe('MetaMask Connection', () => {
    it('should connect to MetaMask successfully', async () => {
      (walletService.connectMetaMask as Mock).mockResolvedValue(mockWalletState);

      const { result } = renderHook(() => useWallet(), { wrapper });

      await act(async () => {
        await result.current.connectMetaMask();
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.address).toBe(mockWalletState.address);
      expect(result.current.mnbBalance).toBe(mockWalletState.mnbBalance);
      expect(result.current.chainId).toBe(mockWalletState.chainId);
    });

    it('should set connecting state during connection', async () => {
      let resolveConnect: (value: typeof mockWalletState) => void;
      const connectPromise = new Promise<typeof mockWalletState>((resolve) => {
        resolveConnect = resolve;
      });
      (walletService.connectMetaMask as Mock).mockReturnValue(connectPromise);

      const { result } = renderHook(() => useWallet(), { wrapper });

      // Start connection without awaiting
      let connectionPromise: Promise<void>;
      act(() => {
        connectionPromise = result.current.connectMetaMask();
      });

      // Check connecting state
      expect(result.current.isConnecting).toBe(true);

      // Resolve the connection
      await act(async () => {
        resolveConnect!(mockWalletState);
        await connectionPromise;
      });

      expect(result.current.isConnecting).toBe(false);
      expect(result.current.isConnected).toBe(true);
    });

    it('should handle connection error', async () => {
      const errorMessage = 'User rejected connection';
      (walletService.connectMetaMask as Mock).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useWallet(), { wrapper });

      // Wait for initial render
      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      await act(async () => {
        try {
          await result.current.connectMetaMask();
        } catch {
          // Expected error
        }
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Disconnect', () => {
    it('should disconnect wallet and clear state', async () => {
      (walletService.connectMetaMask as Mock).mockResolvedValue(mockWalletState);
      (walletService.disconnect as Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useWallet(), { wrapper });

      // Wait for initial render
      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      // First connect
      await act(async () => {
        await result.current.connectMetaMask();
      });

      expect(result.current.isConnected).toBe(true);

      // Then disconnect
      await act(async () => {
        await result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.address).toBeNull();
      expect(result.current.mnbBalance).toBe('0');
      expect(result.current.error).toBeNull();
    });
  });

  describe('Balance Refresh', () => {
    it('should refresh balances when connected', async () => {
      (walletService.connectMetaMask as Mock).mockResolvedValue(mockWalletState);
      (walletService.getEthBalance as Mock).mockResolvedValue('2.0');
      (walletService.getMNBBalance as Mock).mockResolvedValue('2000.0');
      (walletService.getKYCTier as Mock).mockResolvedValue(3);
      (walletService.getDailyLimit as Mock).mockResolvedValue('10000.0');

      const { result } = renderHook(() => useWallet(), { wrapper });

      // Wait for initial render
      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      await act(async () => {
        await result.current.connectMetaMask();
      });

      await act(async () => {
        await result.current.refreshBalances();
      });

      expect(result.current.balance).toBe('2.0');
      expect(result.current.mnbBalance).toBe('2000.0');
      expect(result.current.kycTier).toBe(3);
      expect(result.current.dailyLimit).toBe('10000.0');
    });
  });

  describe('Token Operations', () => {
    it('should transfer MNB tokens', async () => {
      (walletService.connectMetaMask as Mock).mockResolvedValue(mockWalletState);
      (walletService.transferMNB as Mock).mockResolvedValue({ success: true, hash: '0xabc123' });
      (walletService.getEthBalance as Mock).mockResolvedValue('1.5');
      (walletService.getMNBBalance as Mock).mockResolvedValue('900.0');
      (walletService.getKYCTier as Mock).mockResolvedValue(2);
      (walletService.getDailyLimit as Mock).mockResolvedValue('5000.0');

      const { result } = renderHook(() => useWallet(), { wrapper });

      // Wait for initial render
      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      await act(async () => {
        await result.current.connectMetaMask();
      });

      let transferResult: { success: boolean; hash?: string };
      await act(async () => {
        transferResult = await result.current.transferMNB('0xrecipient', '100');
      });

      expect(transferResult!.success).toBe(true);
      expect(transferResult!.hash).toBe('0xabc123');
    });

    it('should pay with MNB tokens', async () => {
      (walletService.connectMetaMask as Mock).mockResolvedValue(mockWalletState);
      (walletService.payWithMNB as Mock).mockResolvedValue({ success: true, hash: '0xdef456' });
      (walletService.getEthBalance as Mock).mockResolvedValue('1.5');
      (walletService.getMNBBalance as Mock).mockResolvedValue('950.0');
      (walletService.getKYCTier as Mock).mockResolvedValue(2);
      (walletService.getDailyLimit as Mock).mockResolvedValue('5000.0');

      const { result } = renderHook(() => useWallet(), { wrapper });

      // Wait for initial render
      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      await act(async () => {
        await result.current.connectMetaMask();
      });

      let payResult: { success: boolean; hash?: string };
      await act(async () => {
        payResult = await result.current.payWithMNB('0xmerchant', 50, 'order-123');
      });

      expect(payResult!.success).toBe(true);
      expect(payResult!.hash).toBe('0xdef456');
    });
  });

  describe('Utilities', () => {
    it('should format address correctly', async () => {
      const { result } = renderHook(() => useWallet(), { wrapper });

      // Wait for initial render
      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      const formatted = result.current.formatAddress('0x1234567890abcdef1234567890abcdef12345678');
      expect(formatted).toBe('0x1234...5678');
    });

    it('should report MetaMask installation status', async () => {
      (walletService.isMetaMaskInstalled as Mock).mockReturnValue(true);

      const { result } = renderHook(() => useWallet(), { wrapper });

      // Wait for initial render
      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      expect(result.current.isMetaMaskInstalled).toBe(true);
    });
  });

  describe('useWallet hook', () => {
    it('should throw error when used outside WalletProvider', () => {
      // Suppress console.error for this test since we expect an error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // The hook should throw when used outside provider
      // We wrap in try-catch since renderHook will propagate the error
      let errorThrown = false;
      let errorMessage = '';
      
      try {
        renderHook(() => useWallet());
      } catch (error) {
        errorThrown = true;
        errorMessage = (error as Error).message;
      }

      expect(errorThrown).toBe(true);
      expect(errorMessage).toBe('useWallet must be used within a WalletProvider');

      consoleSpy.mockRestore();
    });
  });
});
