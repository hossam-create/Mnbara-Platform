/**
 * Wallet Transactions Page
 * READ-ONLY transaction history with filtering
 * Shows complete immutable transaction timeline
 */

import React, { useState, useEffect } from 'react';
import TransactionTimeline from '../../components/wallet/TransactionTimeline';
import styles from './TransactionsPage.module.css';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api.service';

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

export default function TransactionsPage() {
  const { user } = useAuth();
  const [walletId, setWalletId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadTransactions();
  }, [filter, page]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!walletId && user?.id) {
        const ownerType = 'USER';
        const walletByOwner = await apiService.walletV2.getByOwner(ownerType, String(user.id));
        const walletData = walletByOwner.data.data;
        setWalletId(walletData.id);
      }
      if (walletId) {
        const limit = 50;
        const offset = (page - 1) * limit;
        const ledger = await apiService.walletV2.listLedger(walletId, {
          limit,
          offset,
          reason: filter !== 'all' ? filter : undefined
        });
        const currency = ledger.data.data[0]?.amountFormatted?.split(' ')[0] ? undefined : undefined;
        const entries = ledger.data.data.map((e: any) => {
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
            currency: walletId ? '' : '',
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
        setTransactions(entries);
        setTotalCount(ledger.data.pagination?.total || 0);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
      console.error('Transactions loading error:', err);
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

  const totalPages = Math.ceil(totalCount / 50);

  return (
    <div className={styles.transactionsPage}>
      <div className={styles.header}>
        <h1>Transaction History</h1>
        <p className={styles.subtitle}>
          Complete immutable record of all wallet activities
        </p>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="filter">Filter by Type:</label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className={styles.filterSelect}
          >
            <option value="all">All Transactions</option>
            <option value="ESCROW_HOLD">Escrow Holds</option>
            <option value="ESCROW_RELEASE">Escrow Releases</option>
            <option value="ESCROW_REFUND">Refunds</option>
            <option value="DEPOSIT">Deposits</option>
            <option value="WITHDRAWAL">Withdrawals</option>
            <option value="TRANSFER_IN">Transfers In</option>
            <option value="TRANSFER_OUT">Transfers Out</option>
            <option value="CONVERSION">Currency Conversions</option>
          </select>
        </div>

        <div className={styles.stats}>
          <span className={styles.stat}>
            Total: {totalCount} transactions
          </span>
          <span className={styles.stat}>
            Page {page} of {totalPages}
          </span>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading transactions...</p>
        </div>
      ) : error ? (
        <div className={styles.error}>
          <h3>Transactions Temporarily Unavailable</h3>
          <p>{error}</p>
          <button onClick={loadTransactions} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      ) : (
        <>
          <TransactionTimeline transactions={transactions} />

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </button>

              <div className={styles.pageNumbers}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    className={`${styles.pageNumber} ${pageNum === page ? styles.active : ''}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                className={styles.pageButton}
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <div className={styles.footer}>
        <div className={styles.securityNote}>
          <span className={styles.securityIcon}>🔒</span>
          <span className={styles.securityText}>
            <strong>Read-Only Access:</strong> All transactions are immutable and system-verified
          </span>
        </div>
        
        <div className={styles.helpSection}>
          <h4>Need Help?</h4>
          <p>
            If you have questions about any transaction, please contact our support team with the transaction ID.
          </p>
          <button className={styles.supportButton}>
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
