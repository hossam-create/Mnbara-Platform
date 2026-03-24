import React, { useState } from 'react';
import { BalanceDisplay } from '../../components/wallet/BalanceDisplay';
import { QuickActions } from '../../components/wallet/QuickActions';
import { TransactionList } from '../../components/wallet/TransactionList';
import { EscrowStatus } from '../../components/wallet/EscrowStatus';
import type { Wallet, Transaction, Escrow, WalletBalance } from '../../types/wallet';
import './WalletPage.css';

// Mock data for demonstration
const mockWallet: Wallet = {
  id: 'wallet-1',
  userId: 'user-1',
  balance: 12500.00,
  pendingBalance: 2500.00,
  currency: 'USD',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
};

const mockTransactions: Transaction[] = [
  {
    id: 'txn-1',
    walletId: 'wallet-1',
    type: 'deposit',
    status: 'completed',
    amount: 5000.00,
    currency: 'USD',
    fee: 0,
    netAmount: 5000.00,
    description: 'Bank Transfer - Chase Bank',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'txn-2',
    walletId: 'wallet-1',
    type: 'purchase',
    status: 'completed',
    amount: -250.00,
    currency: 'USD',
    fee: 5.00,
    netAmount: -255.00,
    description: 'Product Purchase - #ORD-12345',
    createdAt: '2024-01-16T14:20:00Z',
    updatedAt: '2024-01-16T14:20:00Z',
  },
  {
    id: 'txn-3',
    walletId: 'wallet-1',
    type: 'sale',
    status: 'pending',
    amount: 1500.00,
    currency: 'USD',
    fee: 30.00,
    netAmount: 1470.00,
    description: 'Product Sale - #ORD-12346',
    createdAt: '2024-01-17T09:15:00Z',
    updatedAt: '2024-01-17T09:15:00Z',
  },
];

const mockEscrows: Escrow[] = [
  {
    id: 'esc-1',
    transactionId: 'txn-4',
    buyerId: 'user-2',
    sellerId: 'user-1',
    amount: 3000.00,
    currency: 'USD',
    fee: 60.00,
    netAmount: 2940.00,
    status: 'active',
    description: 'Vintage Rolex Watch',
    timeline: [
      {
        id: 't1',
        escrowId: 'esc-1',
        event: 'created',
        description: 'Escrow created and funds held',
        timestamp: '2024-01-18T11:00:00Z',
      },
      {
        id: 't2',
        escrowId: 'esc-1',
        event: 'shipped',
        description: 'Item shipped by seller',
        timestamp: '2024-01-19T14:30:00Z',
      },
    ],
    createdAt: '2024-01-18T11:00:00Z',
    updatedAt: '2024-01-19T14:30:00Z',
    releaseDeadline: '2024-01-26T11:00:00Z',
  },
];

export const WalletPage: React.FC = () => {
  const [wallet] = useState<Wallet | null>(mockWallet);
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [escrows] = useState<Escrow[]>(mockEscrows);
  const [isLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'escrow'>('overview');

  const balance: WalletBalance = {
    available: wallet?.balance || 0,
    pending: wallet?.pendingBalance || 0,
    currency: wallet?.currency || 'USD',
    lastUpdated: wallet?.updatedAt || new Date().toISOString(),
  };

  return (
    <div className="mnbara-wallet-page">
      <div className="mnbara-wallet-page__container">
        <header className="mnbara-wallet-page__header">
          <div>
            <h1 className="mnbara-wallet-page__title">My Wallet</h1>
            <p className="mnbara-wallet-page__subtitle">
              Manage your funds, transactions, and escrow payments
            </p>
          </div>
        </header>

        <nav className="mnbara-wallet-page__nav">
          <button
            className={`mnbara-wallet-page__nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`mnbara-wallet-page__nav-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
          <button
            className={`mnbara-wallet-page__nav-btn ${activeTab === 'escrow' ? 'active' : ''}`}
            onClick={() => setActiveTab('escrow')}
          >
            Escrow
          </button>
        </nav>

        <main className="mnbara-wallet-page__content">
          {activeTab === 'overview' && (
            <div className="mnbara-wallet-page__overview">
              <section className="mnbara-wallet-page__balance-section">
                <BalanceDisplay balance={balance} />
              </section>

              <section className="mnbara-wallet-page__quick-actions-section">
                <QuickActions 
                  onDeposit={() => window.location.href = '/wallet/deposit'}
                  onWithdraw={() => window.location.href = '/wallet/withdraw'}
                />
              </section>

              <section className="mnbara-wallet-page__recent-section">
                <h2 className="mnbara-wallet-page__section-title">Recent Transactions</h2>
                <TransactionList 
                  transactions={transactions.slice(0, 5)} 
                  showHeader={false}
                  compact
                />
              </section>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="mnbara-wallet-page__transactions">
              <TransactionList 
                transactions={transactions}
                showHeader
                paginated
              />
            </div>
          )}

          {activeTab === 'escrow' && (
            <div className="mnbara-wallet-page__escrow">
              <EscrowStatus 
                escrows={escrows}
                onRelease={(id) => console.log('Release escrow:', id)}
                onDispute={(id) => console.log('Dispute escrow:', id)}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default WalletPage;
