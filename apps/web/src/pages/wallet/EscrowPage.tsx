import React, { useState, useEffect } from 'react';
import EscrowBreakdownTable from '../../components/wallet/EscrowBreakdownTable';
import styles from './EscrowPage.module.css';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api.service';

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
  order?: {
    id: number;
    status: string;
    createdAt: string;
    items?: any[];
  };
  statusLabel: string;
  actionContext: string;
  metadata?: any;
}

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

export default function EscrowPage() {
  const { user } = useAuth();
  const [escrows, setEscrows] = useState<EscrowHold[]>([]);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadWalletData();
  }, [statusFilter, page]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load wallet summary first
      const summaryResponse = await fetch('/api/v1/wallet/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setWalletSummary(summaryData.data);
      }

      // Load escrow holds from escrow service API
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const role = walletSummary?.walletType === 'buyer' ? 'buyer' : 
                   walletSummary?.walletType === 'seller' ? 'seller' : 
                   walletSummary?.walletType === 'traveler' ? 'traveler' : 'all';

      const params = {
        role,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 20,
        offset: (page - 1) * 20
      };

      // Use the escrow service API client
      const escrowResponse = await apiService.escrow.getUserEscrows(String(user.id), params);
      
      const mappedEscrows = escrowResponse.data.data.escrows.map((e: any) => ({
        id: e.id,
        orderId: e.orderId,
        amount: e.amount,
        currency: e.currency,
        status: e.status,
        userRole: role === 'all' ? (e.buyerId === user.id ? 'buyer' : 'seller') : role,
        description: e.description || '',
        createdAt: e.createdAt,
        expiresAt: e.inspectionEndsAt,
        releasedAt: e.releasedAt,
        order: {
          id: e.orderId,
          status: e.order?.status || 'unknown',
          createdAt: e.order?.createdAt || e.createdAt
        },
        statusLabel: getEscrowStatusLabel(e.status, role),
        actionContext: getEscrowActionContext(e.status, role),
        metadata: e.metadata
      }));

      setEscrows(mappedEscrows);
      setTotalCount(escrowResponse.data.data.pagination?.total || 0);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load escrow data');
      console.error('Escrow data loading error:', err);
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

  const totalPages = Math.ceil(totalCount / 20);

  const getRoleSpecificContent = () => {
    if (!walletSummary) return null;

    switch (walletSummary.walletType) {
      case 'buyer':
        return {
          title: 'Buyer Escrow Holds',
          description: 'Payments held securely until order completion',
          icon: '🛡️'
        };
      case 'seller':
        return {
          title: 'Seller Escrow Holds',
          description: 'Earnings held in escrow until release',
          icon: '💰'
        };
      case 'traveler':
        return {
          title: 'Traveler Escrow Holds',
          description: 'Mission payments held in escrow',
          icon: '✈️'
        };
      default:
        return {
          title: 'Escrow Holds',
          description: 'Funds held in escrow',
          icon: '🔒'
        };
    }
  };

  const getEscrowStatusLabel = (status: string, role: string) => {
    const statusLabels: Record<string, Record<string, string>> = {
      'HELD': {
        'buyer': 'Payment Held in Escrow',
        'seller': 'Payment Held in Escrow',
        'traveler': 'Payment Held in Escrow'
      },
      'RELEASED': {
        'buyer': 'Order Completed',
        'seller': 'Payment Released',
        'traveler': 'Mission Completed'
      },
      'REFUNDED': {
        'buyer': 'Refund Processed',
        'seller': 'Refund Processed',
        'traveler': 'Refund Processed'
      },
      'DISPUTED': {
        'buyer': 'Dispute in Progress',
        'seller': 'Dispute in Progress',
        'traveler': 'Dispute in Progress'
      }
    };

    return statusLabels[status]?.[role] || status;
  };

  const getEscrowActionContext = (status: string, role: string) => {
    const contexts: Record<string, Record<string, string>> = {
      'HELD': {
        'buyer': 'Funds secured until order completion',
        'seller': 'Payment secured, awaiting completion',
        'traveler': 'Payment secured, awaiting mission completion'
      },
      'RELEASED': {
        'buyer': 'Order completed successfully',
        'seller': 'Payment released to your wallet',
        'traveler': 'Mission completed, payment released'
      },
      'REFUNDED': {
        'buyer': 'Refund processed to your wallet',
        'seller': 'Refund processed to buyer',
        'traveler': 'Refund processed to buyer'
      },
      'DISPUTED': {
        'buyer': 'Dispute opened, funds frozen',
        'seller': 'Dispute opened, funds frozen',
        'traveler': 'Dispute opened, funds frozen'
      }
    };

    return contexts[status]?.[role] || 'Processing';
  };

  const roleContent = getRoleSpecificContent();

  return (
    <div className={styles.escrowPage}>
      <div className={styles.header}>
        <h1>
          {roleContent?.icon} {roleContent?.title}
        </h1>
        <p className={styles.subtitle}>
          {roleContent?.description}
        </p>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="statusFilter">Filter by Status:</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="HELD">Held in Escrow</option>
            <option value="RELEASED">Released</option>
            <option value="REFUNDED">Refunded</option>
            <option value="DISPUTED">Disputed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className={styles.stats}>
          <span className={styles.stat}>
            Total: {totalCount} escrow{totalCount !== 1 ? 's' : ''}
          </span>
          <span className={styles.stat}>
            Page {page} of {totalPages}
          </span>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading escrow details...</p>
        </div>
      ) : error ? (
        <div className={styles.error}>
          <h3>Escrow Data Temporarily Unavailable</h3>
          <p>{error}</p>
          <button onClick={loadWalletData} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      ) : (
        <>
          <EscrowBreakdownTable 
            escrows={escrows} 
            userRole={walletSummary?.walletType || 'buyer'}
          />

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
        <div className={styles.infoCards}>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>🔒</div>
            <div className={styles.infoContent}>
              <h4>Secure Escrow System</h4>
              <p>All funds are held securely in escrow until order completion or dispute resolution.</p>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>⚖️</div>
            <div className={styles.infoContent}>
              <h4>Fair Dispute Process</h4>
              <p>If disputes arise, funds are frozen until resolved by Control Center.</p>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>📋</div>
            <div className={styles.infoContent}>
              <h4>Complete Transparency</h4>
              <p>Every escrow transaction is permanently recorded and immutable.</p>
            </div>
          </div>
        </div>

        <div className={styles.securityNote}>
          <span className={styles.securityIcon}>🔒</span>
          <span className={styles.securityText}>
            <strong>Read-Only Access:</strong> Escrow operations are processed automatically by system rules and guarantees
          </span>
        </div>
      </div>
    </div>
  );
}