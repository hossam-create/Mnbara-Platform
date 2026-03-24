/**
 * Main Wallet Page
 * READ-ONLY wallet visibility with escrow awareness
 * Shows balances, escrow holds, and transaction history
 */

import React, { useState, useEffect } from 'react';
import WalletSummaryCard from '../../components/wallet/WalletSummaryCard';
import EscrowBreakdownTable from '../../components/wallet/EscrowBreakdownTable';
import TransactionTimeline from '../../components/wallet/TransactionTimeline';
import PaymentStatusBadge from '../../components/payment/PaymentStatusBadge';
import paymentService from '../../services/paymentService';
import { PaymentStatus, EscrowStatus } from '../../types/payment.types';
import styles from './WalletPage.module.css';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api.service';

interface WalletSummary {
  walletType: 'buyer' | 'seller' | 'traveler';
  balances: {
    available: number;
    totalEscrowHeld: number;
    pendingRefunds: number;
    releasedEarnings: number;
    totalValue: number;
  };
  currency: string;
  lastUpdated: string;
  isReadOnly: boolean;
}

interface EscrowHold {
  id: number;
  orderId: number;
  amount: number;
  currency: string;
  status: string;
  userRole: 'buyer' | 'seller' | 'traveler';
  description: string;
  createdAt: string;
  expiresAt?: string;
  releasedAt?: string;
  order?: any;
  statusLabel: string;
  actionContext: string;
  metadata?: any;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  description: string;
  orderId?: number;
  escrowId?: number;
  orderStatus?: string;
  escrowStatus?: string;
  performedBy: number;
  metadata?: any;
  createdAt: string;
  label: string;
  isSystemGenerated: boolean;
}

export default function WalletPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'escrow'>('overview');
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [escrowHolds, setEscrowHolds] = useState<EscrowHold[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableFormatted, setAvailableFormatted] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      setError(null);

      const summaryResponse = await fetch('/api/v1/wallet/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!summaryResponse.ok) {
        throw new Error('Failed to load wallet summary');
      }
      const summaryData = await summaryResponse.json();
      setWalletSummary(summaryData.data);

      const escrowResponse = await fetch('/api/v1/wallet/escrow/holds', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (escrowResponse.ok) {
        const escrowData = await escrowResponse.json();
        setEscrowHolds(escrowData.data.escrows);
      }

      const ownerType = 'USER';
      if (user?.id) {
        const walletByOwner = await apiService.walletV2.getByOwner(ownerType, String(user.id));
        const walletData = walletByOwner.data.data;
        setWalletId(walletData.id);
        setAvailableFormatted(walletData.balanceFormatted);
        const ledger = await apiService.walletV2.listLedger(walletData.id, { limit: 50, offset: 0 });
        const currency = walletData.currency;
        const ledgerEntries = ledger.data.data.map((e: any) => {
          const mappedType =
            e.reason === 'PURCHASE_HOLD' ? 'ESCROW_HOLD' :
            e.reason === 'PURCHASE_RELEASE' ? 'ESCROW_RELEASE' :
            e.reason === 'REFUND' ? 'ESCROW_REFUND' :
            e.reason;
          const creditReasons = ['DEPOSIT','TRANSFER_IN','ESCROW_RELEASE','REFUND','PAYOUT'];
          return {
            id: e.id,
            type: mappedType,
            amount: 0,
            balanceBefore: 0,
            balanceAfter: 0,
            currency,
            description: e.description || '',
            orderId: undefined,
            escrowId: undefined,
            orderStatus: undefined,
            escrowStatus: undefined,
            performedBy: 0,
            metadata: undefined,
            createdAt: e.createdAt,
            label: mappedType,
            isSystemGenerated: true,
            amountFormatted: e.amountFormatted,
            balanceAfterFormatted: e.balanceAfterFormatted,
            isCredit: creditReasons.includes(e.reason)
          };
        });
        setTransactions(ledgerEntries);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet data');
      console.error('Wallet data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={styles.walletPage}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.walletPage}>
        <div className={styles.error}>
          <h3>Wallet Temporarily Unavailable</h3>
          <p>{error}</p>
          <button onClick={loadWalletData} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!walletSummary) {
    return (
      <div className={styles.walletPage}>
        <div className={styles.noData}>
          <h3>Wallet Not Found</h3>
          <p>Your wallet could not be loaded. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.walletPage}>
      <div className={styles.header}>
        <h1>My Wallet</h1>
        <p className={styles.subtitle}>
          {walletSummary.walletType === 'buyer' && 'Buyer protection and payment status'}
          {walletSummary.walletType === 'seller' && 'Seller earnings and escrow status'}
          {walletSummary.walletType === 'traveler' && 'Traveler mission payments and earnings'}
        </p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'transactions' ? styles.active : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'escrow' ? styles.active : ''}`}
          onClick={() => setActiveTab('escrow')}
        >
          Escrow
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'overview' && (
          <div className={styles.overviewTab}>
            <WalletSummaryCard summary={walletSummary} availableFormattedOverride={availableFormatted || undefined} />
            
            {escrowHolds.length > 0 && (
              <div className={styles.quickEscrow}>
                <h3>Recent Escrow Activity</h3>
                <div className={styles.recentEscrows}>
                  {escrowHolds.slice(0, 3).map(escrow => (
                    <div key={escrow.id} className={styles.recentEscrowItem}>
                      <div className={styles.escrowInfo}>
                        <span className={styles.orderNumber}>#{escrow.orderId}</span>
                        <span className={styles.escrowAmount}>
                          {formatCurrency(escrow.amount, escrow.currency)}
                        </span>
                      </div>
                      <div className={styles.escrowStatus}>
                        <PaymentStatusBadge
                          status={escrow.status as EscrowStatus}
                          type="escrow"
                          size="small"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {escrowHolds.length > 3 && (
                  <button 
                    className={styles.viewAllButton}
                    onClick={() => setActiveTab('escrow')}
                  >
                    View All Escrow Transactions
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className={styles.transactionsTab}>
            <TransactionTimeline transactions={transactions} />
          </div>
        )}

        {activeTab === 'escrow' && (
          <div className={styles.escrowTab}>
            <EscrowBreakdownTable 
              escrows={escrowHolds} 
              userRole={walletSummary.walletType}
            />
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.securityInfo}>
          <div className={styles.securityItem}>
            <span className={styles.securityIcon}>🔒</span>
            <div className={styles.securityText}>
              <strong>Read-Only Access</strong>
              <p>All financial operations are processed by system rules</p>
            </div>
          </div>
          
          <div className={styles.securityItem}>
            <span className={styles.securityIcon}>✓</span>
            <div className={styles.securityText}>
              <strong>Escrow Protection</strong>
              <p>Funds held securely until order completion</p>
            </div>
          </div>
          
          <div className={styles.securityItem}>
            <span className={styles.securityIcon}>📋</span>
            <div className={styles.securityText}>
              <strong>Immutable Ledger</strong>
              <p>All transactions are permanently recorded</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
