// ============================================
// 🔗 Wallet Connect Button Component
// ============================================

import { useState } from 'react';
import { useWallet } from '../../context/WalletContext';

interface WalletConnectButtonProps {
  variant?: 'default' | 'compact' | 'full';
  className?: string;
  showBalance?: boolean;
}

export function WalletConnectButton({
  variant = 'default',
  className = '',
  showBalance = true,
}: WalletConnectButtonProps) {
  const {
    isConnected,
    isConnecting,
    address,
    mnbBalance,
    connectMetaMask,
    disconnect,
    formatAddress,
    isMetaMaskInstalled,
    error,
  } = useWallet();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleConnect = async () => {
    if (!isMetaMaskInstalled) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }
    
    try {
      await connectMetaMask();
      setShowModal(false);
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setShowDropdown(false);
  };

  // Compact variant - just icon
  if (variant === 'compact') {
    return (
      <button
        onClick={() => isConnected ? setShowDropdown(!showDropdown) : setShowModal(true)}
        className={`relative p-2 rounded-lg transition-all ${
          isConnected 
            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } ${className}`}
        title={isConnected ? `Connected: ${address}` : 'Connect Wallet'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        {isConnected && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </button>
    );
  }

  // Full variant - detailed card
  if (variant === 'full') {
    if (!isConnected) {
      return (
        <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200 ${className}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🔗</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Connect Wallet</h3>
              <p className="text-sm text-gray-600">Pay with MNB tokens</p>
            </div>
          </div>
          
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isConnecting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connecting...
              </span>
            ) : isMetaMaskInstalled ? (
              'Connect MetaMask'
            ) : (
              'Install MetaMask'
            )}
          </button>
          
          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </div>
      );
    }

    return (
      <div className={`bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-xl">🦊</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Connected</p>
              <p className="font-mono font-medium text-gray-900">{formatAddress(address!)}</p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Disconnect
          </button>
        </div>
        
        {showBalance && (
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">MNB Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              {parseFloat(mnbBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })} MNBT
            </p>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  if (isConnected) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-xl hover:shadow-md transition-all border border-green-200"
        >
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="font-mono text-sm">{formatAddress(address!)}</span>
          {showBalance && (
            <span className="text-xs bg-green-200 px-2 py-0.5 rounded-full">
              {parseFloat(mnbBalance).toFixed(2)} MNBT
            </span>
          )}
          <svg className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
                <p className="text-xs text-gray-500 mb-1">MNB Balance</p>
                <p className="text-xl font-bold text-gray-900">
                  {parseFloat(mnbBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })} MNBT
                </p>
              </div>
              
              <div className="p-2">
                <a
                  href="/wallet"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span>💰</span>
                  <span className="text-gray-700">View Wallet</span>
                </a>
                <a
                  href="/wallet/transactions"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span>📜</span>
                  <span className="text-gray-700">Transaction History</span>
                </a>
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                >
                  <span>🔌</span>
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all ${className}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <span className="font-medium">Connect Wallet</span>
      </button>

      {/* Connection Modal */}
      {showModal && (
        <WalletConnectModal
          onClose={() => setShowModal(false)}
          onConnect={handleConnect}
          isConnecting={isConnecting}
          error={error}
          isMetaMaskInstalled={isMetaMaskInstalled}
        />
      )}
    </>
  );
}

// Wallet Connect Modal
interface WalletConnectModalProps {
  onClose: () => void;
  onConnect: () => Promise<void>;
  isConnecting: boolean;
  error: string | null;
  isMetaMaskInstalled: boolean;
}

function WalletConnectModal({
  onClose,
  onConnect,
  isConnecting,
  error,
  isMetaMaskInstalled,
}: WalletConnectModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Connect Wallet</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Connect your wallet to pay with MNB tokens
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* MetaMask */}
          <button
            onClick={onConnect}
            disabled={isConnecting}
            className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🦊</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-gray-900">MetaMask</p>
              <p className="text-sm text-gray-500">
                {isMetaMaskInstalled ? 'Connect to your MetaMask wallet' : 'Install MetaMask to continue'}
              </p>
            </div>
            {isConnecting && (
              <svg className="animate-spin h-5 w-5 text-orange-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </button>

          {/* WalletConnect */}
          <button
            disabled
            className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl opacity-50 cursor-not-allowed"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🔗</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-gray-900">WalletConnect</p>
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
          </button>

          {/* Coinbase Wallet */}
          <button
            disabled
            className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl opacity-50 cursor-not-allowed"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💎</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-gray-900">Coinbase Wallet</p>
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            By connecting a wallet, you agree to MNBARA's{' '}
            <a href="/terms" className="text-pink-500 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-pink-500 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default WalletConnectButton;
