// ============================================
// 💰 Wallet Page - Financial Dashboard & Crypto
// ============================================

import { useState, useEffect } from 'react';
import type { Wallet, WalletTransaction, PaymentMethod } from '../../types/chat-wallet';
import { blockchainService, type BlockchainBalance } from '../../services/blockchain.service';
import { biometricService } from '../../services/biometric.service';

type WalletTab = 'overview' | 'transactions' | 'transfer' | 'deposit' | 'withdraw' | 'payment-methods' | 'security';

export function WalletPage() {
  const [activeTab, setActiveTab] = useState<WalletTab>('overview');
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [blockchainBalances, setBlockchainBalances] = useState<BlockchainBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockchainLoading, setBlockchainLoading] = useState(true);
  
  // Transaction States
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [processingTx, setProcessingTx] = useState(false);

  // Security States
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Mock data
  const mockWallet: Wallet = {
    id: 'w1',
    userId: 'me',
    balance: 2840.50,
    currency: 'USD',
    pendingBalance: 350.00,
    frozenBalance: 1200.00,
    totalEarnings: 8540.00,
    totalSpent: 3250.00,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockTransactions: WalletTransaction[] = [
    { id: 't1', walletId: 'w1', type: 'earning', amount: 120, currency: 'USD', fee: 6, netAmount: 114, status: 'completed', description: 'Delivery reward - Order #12345', orderId: '#12345', createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: 't2', walletId: 'w1', type: 'payment', amount: 89.99, currency: 'USD', fee: 0, netAmount: 89.99, status: 'completed', description: 'Purchase - iPhone Case', orderId: '#12344', createdAt: new Date(Date.now() - 24 * 3600000).toISOString() },
    { id: 't3', walletId: 'w1', type: 'deposit', amount: 500, currency: 'USD', fee: 0, netAmount: 500, status: 'completed', description: 'Deposit via Visa ****4242', createdAt: new Date(Date.now() - 48 * 3600000).toISOString() },
    { id: 't4', walletId: 'w1', type: 'withdrawal', amount: 200, currency: 'USD', fee: 2.50, netAmount: 197.50, status: 'processing', description: 'Withdrawal to Bank Account', createdAt: new Date(Date.now() - 72 * 3600000).toISOString() },
    { id: 't5', walletId: 'w1', type: 'escrow_hold', amount: 1200, currency: 'USD', fee: 0, netAmount: 1200, status: 'completed', description: 'Escrow hold - Order #12340', orderId: '#12340', createdAt: new Date(Date.now() - 96 * 3600000).toISOString() },
    { id: 't6', walletId: 'w1', type: 'bonus', amount: 25, currency: 'USD', fee: 0, netAmount: 25, status: 'completed', description: 'Referral bonus - User signup', createdAt: new Date(Date.now() - 120 * 3600000).toISOString() },
  ];

  const mockPaymentMethods: PaymentMethod[] = [
    { id: 'pm1', userId: 'me', type: 'card', isDefault: true, details: { brand: 'visa', last4: '4242', expiryMonth: 12, expiryYear: 2027, holderName: 'HOSSAM ELSEFY' }, status: 'active', createdAt: new Date().toISOString() },
    { id: 'pm2', userId: 'me', type: 'card', isDefault: false, details: { brand: 'mastercard', last4: '5555', expiryMonth: 6, expiryYear: 2026, holderName: 'HOSSAM ELSEFY' }, status: 'active', createdAt: new Date().toISOString() },
    { id: 'pm3', userId: 'me', type: 'mobile_wallet', isDefault: false, details: { provider: 'vodafone_cash', phoneNumber: '+20 100 XXX XXXX' }, status: 'active', createdAt: new Date().toISOString() },
  ];

  const quickAmounts = [50, 100, 250, 500, 1000];

  useEffect(() => {
    // Load mock data
    setWallet(mockWallet);
    setTransactions(mockTransactions);
    setPaymentMethods(mockPaymentMethods);
    setLoading(false);

    // Load blockchain data
    const loadBlockchainData = async () => {
      try {
        const userAddress = '0x742d35Cc6634C893292Ce8bB6239C002Ad8e6b59'; // Example
        const mnbBalance = await blockchainService.getMNBTokenBalance(userAddress);
        setBlockchainBalances([mnbBalance]);
      } catch (error) {
        console.error('Error loading blockchain data:', error);
      } finally {
        setBlockchainLoading(false);
      }
    };

    // Check Biometrics
    const checkBiometrics = async () => {
      const isAvailable = await biometricService.isSupported();
      setBiometricAvailable(isAvailable);
      const status = await biometricService.getStatus();
      setBiometricEnabled(status.isEnabled);
    };

    loadBlockchainData();
    checkBiometrics();
  }, []);

  const handleBiometricToggle = async () => {
    if (!biometricEnabled) {
      try {
        await biometricService.register();
        setBiometricEnabled(true);
      } catch (e) {
        alert('Failed to register biometrics');
      }
    } else {
      localStorage.removeItem('biometric_credential_id');
      setBiometricEnabled(false);
    }
  };

  const handleTransfer = async () => {
    if (!amount || !recipientAddress) return;
    try {
      setProcessingTx(true);
      if (biometricEnabled) {
        const verified = await biometricService.verify();
        if (!verified) {
          alert('Biometric verification failed');
          setProcessingTx(false);
          return;
        }
      }
      // Simulate transfer
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Successfully sent ${amount} MNBT to ${recipientAddress}`);
      setAmount('');
      setRecipientAddress('');
    } catch (error) {
      alert('Transaction failed');
    } finally {
      setProcessingTx(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, { icon: string; color: string }> = {
      earning: { icon: '💰', color: 'bg-green-100 text-green-600' },
      payment: { icon: '🛒', color: 'bg-blue-100 text-blue-600' },
      deposit: { icon: '📥', color: 'bg-indigo-100 text-indigo-600' },
      withdrawal: { icon: '📤', color: 'bg-orange-100 text-orange-600' },
      escrow_hold: { icon: '🔒', color: 'bg-yellow-100 text-yellow-600' },
      escrow_release: { icon: '🔓', color: 'bg-green-100 text-green-600' },
      transfer: { icon: '↔️', color: 'bg-purple-100 text-purple-600' },
      bonus: { icon: '🎁', color: 'bg-pink-100 text-pink-600' },
      refund: { icon: '↩️', color: 'bg-gray-100 text-gray-600' },
      fee: { icon: '📋', color: 'bg-red-100 text-red-600' },
    };
    return icons[type] || icons.payment;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      completed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      failed: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
    };
    return badges[status] || badges.pending;
  };

  const getCardIcon = (brand: string) => {
      const icons: Record<string, string> = {
        visa: '💳',
        mastercard: '💳',
        amex: '💳',
      };
      return icons[brand] || '💳';
  };

  const tabs = [
    { id: 'overview' as WalletTab, label: 'Overview', icon: '📊' },
    { id: 'transactions' as WalletTab, label: 'Transactions', icon: '📜' },
    { id: 'transfer' as WalletTab, label: 'Transfer', icon: '💸' },
    { id: 'deposit' as WalletTab, label: 'Deposit', icon: '📥' },
    { id: 'withdraw' as WalletTab, label: 'Withdraw', icon: '📤' },
    { id: 'payment-methods' as WalletTab, label: 'Methods', icon: '💳' },
    { id: 'security' as WalletTab, label: 'Security', icon: '🛡️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/circuit-board.svg')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <span>🏦</span> Mnbara Vault
              </h1>
              <p className="text-gray-300">Secure Blockchain & Fiat Wallet</p>
            </div>
            
            {/* Balances */}
            {wallet && (
              <div className="flex flex-wrap gap-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 min-w-[160px]">
                  <div className="text-xs text-indigo-200 uppercase tracking-wider mb-1">Fiat Balance</div>
                  <div className="text-2xl font-bold font-mono">{formatCurrency(wallet.balance)}</div>
                </div>
                {!blockchainLoading && blockchainBalances.length > 0 && (
                  <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-md border border-yellow-500/30 rounded-2xl px-6 py-4 min-w-[160px]">
                    <div className="text-xs text-yellow-200 uppercase tracking-wider mb-1">Crypto Assets</div>
                    <div className="text-2xl font-bold font-mono text-yellow-100">
                      {blockchainBalances[0].formattedBalance} <span className="text-sm">MNB</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setActiveTab('deposit')}
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-xl font-bold hover:shadow-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Funds
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Withdraw
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b bg-white sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Overview Tab (Enhanced) */}
        {activeTab === 'overview' && wallet && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-gray-500 text-sm mb-1">Total Earnings</div>
                  <div className="text-xl font-bold text-green-600">{formatCurrency(wallet.totalEarnings)}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-gray-500 text-sm mb-1">Total Spent</div>
                  <div className="text-xl font-bold text-red-600">{formatCurrency(wallet.totalSpent)}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-gray-500 text-sm mb-1">Pending</div>
                  <div className="text-xl font-bold text-orange-600">{formatCurrency(wallet.pendingBalance)}</div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="font-bold text-lg">Recent Activity</h2>
                  <button onClick={() => setActiveTab('transactions')} className="text-indigo-600 text-sm font-medium hover:underline">View All</button>
                </div>
                <div className="divide-y divide-gray-50">
                  {transactions.slice(0, 4).map((tx) => {
                    const typeInfo = getTypeIcon(tx.type);
                    return (
                      <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${typeInfo.color}`}>
                          {typeInfo.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{tx.description}</div>
                          <div className="text-xs text-gray-500">{formatDate(tx.createdAt)}</div>
                        </div>
                        <div className={`font-mono font-bold ${['earning', 'deposit'].includes(tx.type) ? 'text-green-600' : 'text-gray-900'}`}>
                          {['earning', 'deposit'].includes(tx.type) ? '+' : '-'}{formatCurrency(tx.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">MNB Chain</span>
                  </div>
                  <div className="mb-2 text-indigo-200 text-sm">Token Balance</div>
                  <div className="text-3xl font-mono font-bold mb-6">
                    {blockchainBalances[0]?.formattedBalance || '0.00'} MNBT
                  </div>
                  <button onClick={() => setActiveTab('transfer')} className="w-full bg-white text-indigo-900 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                    Send Crypto <span>↗️</span>
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Security Status</h3>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">Biometrics</span>
                  {biometricEnabled ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">ACTIVE</span>
                  ) : (
                     <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-bold">DISABLED</span>
                  )}
                </div>
                <button onClick={() => setActiveTab('security')} className="w-full py-2 border border-gray-200 rounded-xl text-gray-600 text-sm hover:border-gray-300 transition-colors">Manage Security</button>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab (Restored) */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Transaction History</h2>
            <div className="space-y-3">
              {transactions.map((tx) => {
                const typeInfo = getTypeIcon(tx.type);
                const isCredit = ['earning', 'deposit', 'refund', 'bonus', 'escrow_release'].includes(tx.type);
                return (
                  <div key={tx.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${typeInfo.color}`}>
                      {typeInfo.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{tx.description}</span>
                        {tx.orderId && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tx.orderId}</span>}
                      </div>
                      <div className="text-sm text-gray-500">{formatDate(tx.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${isCredit ? 'text-green-600' : 'text-gray-900'}`}>
                        {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(tx.status)}`}>{tx.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Deposit Tab (Restored) */}
        {activeTab === 'deposit' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Add Funds</h2>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Amount</label>
                <div className="grid grid-cols-5 gap-3">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmount(amt.toString())}
                      className={`py-3 rounded-xl font-bold transition-all ${
                        amount === amt.toString() ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Or Custom Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-4 text-2xl font-bold border-2 rounded-xl focus:border-indigo-500 focus:ring-0"
                />
              </div>
               <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
                <div className="space-y-3">
                  {paymentMethods.map((pm) => (
                    <button
                      key={pm.id}
                      onClick={() => setSelectedMethod(pm.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        selectedMethod === pm.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{pm.type === 'card' ? getCardIcon((pm.details as any).brand) : '📱'}</span>
                      <div className="flex-1 text-left">
                        {pm.type === 'card' ? (
                          <>
                            <div className="font-medium capitalize">{(pm.details as any).brand} ****{(pm.details as any).last4}</div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium capitalize">{(pm.details as any).provider}</div>
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <button disabled={!amount || !selectedMethod} className="w-full py-4 bg-gray-900 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-gray-800 disabled:opacity-50 transition-all">
                Add Funds
              </button>
            </div>
          </div>
        )}

        {/* Withdraw Tab (Restored) */}
        {activeTab === 'withdraw' && wallet && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Withdraw</h2>
              <p className="text-gray-500 text-center mb-6">Available: <span className="font-bold text-gray-900">{formatCurrency(wallet.balance)}</span></p>
              <div className="mb-6">
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    max={wallet.balance}
                    placeholder="0.00"
                    className="w-full px-4 py-4 text-2xl font-bold border-2 rounded-xl focus:border-indigo-500"
                  />
              </div>
              <button disabled={!amount || parseFloat(amount) > wallet.balance} className="w-full py-4 bg-gray-900 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-gray-800 disabled:opacity-50 transition-all">
                Withdraw
              </button>
            </div>
          </div>
        )}
        
        {/* Payment Methods Tab */}
        {activeTab === 'payment-methods' && (
          <div className="max-w-2xl mx-auto">
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between mb-6">
                    <h2 className="text-xl font-bold">Payment Methods</h2>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Add New</button>
                </div>
                <div className="space-y-4">
                    {paymentMethods.map(pm => (
                        <div key={pm.id} className="p-4 border rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">{pm.type === 'card' ? '💳' : '📱'}</span>
                                <div>
                                    <div className="font-bold">{(pm.details as any).brand || (pm.details as any).provider}</div>
                                    <div className="text-sm text-gray-500">****{(pm.details as any).last4 || (pm.details as any).phoneNumber}</div>
                                </div>
                            </div>
                            <button className="text-gray-400 hover:text-red-500">Remove</button>
                        </div>
                    ))}
                </div>
             </div>
          </div>
        )}

        {/* Transfer Tab (New) */}
        {activeTab === 'transfer' && (
          <div className="max-w-xl mx-auto">
             <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gray-900 text-white p-8">
                <h2 className="text-2xl font-bold mb-2">Send MNB Tokens</h2>
                <p className="text-gray-400 text-sm">Secure blockchain transfer with biometric verification</p>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recipient</label>
                  <input type="text" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} placeholder="0x..." className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (MNBT)</label>
                  <div className="relative">
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none font-mono text-lg" />
                    <button onClick={() => setAmount(blockchainBalances[0]?.formattedBalance || '0')} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-indigo-600 font-bold hover:underline">MAX</button>
                  </div>
                </div>
                <button onClick={handleTransfer} disabled={!amount || !recipientAddress || processingTx} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all">
                  {processingTx ? 'Processing...' : (biometricEnabled ? '🔒 Verify & Send' : 'Send Transaction')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab (New) */}
        {activeTab === 'security' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${biometricEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {biometricEnabled ? '🛡️' : '🔓'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Biometric Authentication</h3>
                  <p className="text-sm text-gray-500">Use FaceID or Fingerprint for transactions</p>
                </div>
              </div>
              {biometricAvailable ? (
                <button onClick={handleBiometricToggle} className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${biometricEnabled ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${biometricEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              ) : (
                <span className="text-xs text-red-500 font-medium">Not Supported</span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default WalletPage;
