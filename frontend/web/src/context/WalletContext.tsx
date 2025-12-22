// ============================================
// 🔗 Wallet Context - Blockchain Wallet State
// ============================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import walletService, { type WalletState, type TransactionResult, type TokenInfo } from '../services/wallet.service';

// Context types
interface WalletContextType {
  // State
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  chainId: number | null;
  balance: string;
  mnbBalance: string;
  kycTier: number;
  dailyLimit: string;
  error: string | null;
  
  // Actions
  connectMetaMask: () => Promise<void>;
  connectWalletConnect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  
  // Token operations
  transferMNB: (to: string, amount: string) => Promise<TransactionResult>;
  approveMNB: (spender: string, amount: string) => Promise<TransactionResult>;
  payWithMNB: (recipientAddress: string, amountUSD: number, orderId: string) => Promise<TransactionResult>;
  getMNBPrice: () => Promise<number>;
  getTokenInfo: () => Promise<TokenInfo | null>;
  
  // Utilities
  formatAddress: (address: string) => string;
  isMetaMaskInstalled: boolean;
  switchNetwork: (chainId: number) => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Provider component
interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    balance: '0',
    mnbBalance: '0',
    kycTier: 0,
    dailyLimit: '0',
    provider: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (!walletService.isMetaMaskInstalled()) return;

      try {
        // Check if already connected
        const accounts = await window.ethereum?.request({
          method: 'eth_accounts',
        }) as string[] | undefined;

        if (accounts && accounts.length > 0) {
          // Reconnect silently
          const state = await walletService.connectMetaMask();
          setWalletState(state);
        }
      } catch (err) {
        console.error('Failed to check existing connection:', err);
      }
    };

    checkExistingConnection();
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: unknown) => {
      const accountsArray = accounts as string[];
      if (accountsArray.length === 0) {
        // User disconnected
        setWalletState({
          isConnected: false,
          address: null,
          chainId: null,
          balance: '0',
          mnbBalance: '0',
          kycTier: 0,
          dailyLimit: '0',
          provider: null,
        });
      } else if (walletState.isConnected) {
        // Account changed, refresh state
        try {
          const state = await walletService.connectMetaMask();
          setWalletState(state);
        } catch (err) {
          console.error('Failed to refresh after account change:', err);
        }
      }
    };

    const handleChainChanged = async () => {
      // Chain changed, refresh state
      if (walletState.isConnected) {
        try {
          const state = await walletService.connectMetaMask();
          setWalletState(state);
        } catch (err) {
          console.error('Failed to refresh after chain change:', err);
        }
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [walletState.isConnected]);

  // Connect MetaMask
  const connectMetaMask = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const state = await walletService.connectMetaMask();
      setWalletState(state);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Connect WalletConnect
  const connectWalletConnect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const state = await walletService.connectWalletConnect();
      setWalletState(state);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(async () => {
    await walletService.disconnect();
    setWalletState({
      isConnected: false,
      address: null,
      chainId: null,
      balance: '0',
      mnbBalance: '0',
      kycTier: 0,
      dailyLimit: '0',
      provider: null,
    });
    setError(null);
  }, []);

  // Refresh balances
  const refreshBalances = useCallback(async () => {
    if (!walletState.address) return;

    try {
      const [balance, mnbBalance, kycTier, dailyLimit] = await Promise.all([
        walletService.getEthBalance(walletState.address),
        walletService.getMNBBalance(walletState.address),
        walletService.getKYCTier(walletState.address),
        walletService.getDailyLimit(walletState.address),
      ]);

      setWalletState(prev => ({
        ...prev,
        balance,
        mnbBalance,
        kycTier,
        dailyLimit,
      }));
    } catch (err) {
      console.error('Failed to refresh balances:', err);
    }
  }, [walletState.address]);

  // Transfer MNB
  const transferMNB = useCallback(async (to: string, amount: string): Promise<TransactionResult> => {
    const result = await walletService.transferMNB(to, amount);
    if (result.success) {
      await refreshBalances();
    }
    return result;
  }, [refreshBalances]);

  // Approve MNB
  const approveMNB = useCallback(async (spender: string, amount: string): Promise<TransactionResult> => {
    return walletService.approveMNB(spender, amount);
  }, []);

  // Pay with MNB
  const payWithMNB = useCallback(async (
    recipientAddress: string,
    amountUSD: number,
    orderId: string
  ): Promise<TransactionResult> => {
    const result = await walletService.payWithMNB(recipientAddress, amountUSD, orderId);
    if (result.success) {
      await refreshBalances();
    }
    return result;
  }, [refreshBalances]);

  // Get MNB price
  const getMNBPrice = useCallback(async (): Promise<number> => {
    return walletService.getMNBPrice();
  }, []);

  // Get token info
  const getTokenInfo = useCallback(async (): Promise<TokenInfo | null> => {
    if (!walletState.address) return null;
    return walletService.getTokenInfo(walletState.address);
  }, [walletState.address]);

  // Switch network
  const switchNetwork = useCallback(async (chainId: number): Promise<boolean> => {
    return walletService.switchNetwork(chainId);
  }, []);

  const value: WalletContextType = {
    // State
    isConnected: walletState.isConnected,
    isConnecting,
    address: walletState.address,
    chainId: walletState.chainId,
    balance: walletState.balance,
    mnbBalance: walletState.mnbBalance,
    kycTier: walletState.kycTier,
    dailyLimit: walletState.dailyLimit,
    error,
    
    // Actions
    connectMetaMask,
    connectWalletConnect,
    disconnect,
    refreshBalances,
    
    // Token operations
    transferMNB,
    approveMNB,
    payWithMNB,
    getMNBPrice,
    getTokenInfo,
    
    // Utilities
    formatAddress: walletService.formatAddress,
    isMetaMaskInstalled: walletService.isMetaMaskInstalled(),
    switchNetwork,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// Hook to use wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export default WalletContext;
