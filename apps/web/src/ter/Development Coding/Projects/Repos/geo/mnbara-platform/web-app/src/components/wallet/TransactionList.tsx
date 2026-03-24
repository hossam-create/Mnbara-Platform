import React, { useState } from 'react';
import type { Transaction, TransactionFilters, TransactionType, TransactionStatus } from '../../types/wallet';
import './TransactionList.css';

interface TransactionListProps {
  transactions: Transaction[];
  showHeader?: boolean;
  compact?: boolean;
  paginated?: boolean;
  onViewDetails?: (transaction: Transaction) => void;
}

const typeLabels: Record<TransactionType, string> = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  purchase: 'Purchase',
  sale: 'Sale',
  refund: 'Refund',
  escrow_release: 'Escrow Release',
  escrow_hold: 'Escrow Hold',
  dispute_refund: 'Dispute Refund',
  fee: 'Fee',
  transfer_in: 'Transfer In',
  transfer_out: 'Transfer Out',
};

const statusColors: Record<TransactionStatus, string> = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error',
  cancelled: 'default',
};

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  showHeader = true,
  compact = false,
  paginated = false,
  onViewDetails,
}) => {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatCurrency = (amount: number, currency: string) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
    return amount < 0 ? `-${formatted}` : formatted;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeIcon = (type: TransactionType) => {
    const icons: Record<TransactionType, string> = {
      deposit: '↓',
      withdrawal: '↑',
      purchase: '🛒',
      sale: '💰',
      refund: '↩',
      escrow_release: '🔓',
      escrow_hold: '🔒',
      dispute_refund: '⚠',
      fee: '💳',
      transfer_in: '←',
      transfer_out: '→',
    };
    return icons[type];
  };

  const filteredTransactions = transactions.filter((txn) => {
    if (filters.types && filters.types.length > 0 && !filters.types.includes(txn.type)) {
      return false;
    }
    if (filters.status && filters.status.length > 0 && !filters.status.includes(txn.status)) {
      return false;
    }
    if (filters.startDate && new Date(txn.createdAt) < new Date(filters.startDate)) {
      return false;
    }
    if (filters.endDate && new Date(txn.createdAt) > new Date(filters.endDate)) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const displayedTransactions = paginated
    ? filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredTransactions;

  return (
    <div className={`mnbara-transaction-list ${compact ? 'compact' : ''}`}>
      {showHeader && (
        <div className="mnbara-transaction-list__header">
          <h3 className="mnbara-transaction-list__title">Transaction History</h3>
          <div className="mnbara-transaction-list__filters">
            <select
              className="mnbara-transaction-list__filter"
              onChange={(e) => setFilters({
                ...filters,
                types: e.target.value ? [e.target.value as TransactionType] : undefined,
              })}
            >
              <option value="">All Types</option>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              className="mnbara-transaction-list__filter"
              onChange={(e) => setFilters({
                ...filters,
                status: e.target.value ? [e.target.value as TransactionStatus] : undefined,
              })}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      )}

      {filteredTransactions.length === 0 ? (
        <div className="mnbara-transaction-list__empty">
          <p>No transactions found</p>
        </div>
      ) : (
        <>
          <div className="mnbara-transaction-list__items">
            {displayedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`mnbara-transaction-list__item status-${statusColors[transaction.status]}`}
                onClick={() => onViewDetails?.(transaction)}
              >
                <div className="mnbara-transaction-list__icon">
                  {getTypeIcon(transaction.type)}
                </div>
                <div className="mnbara-transaction-list__details">
                  <span className="mnbara-transaction-list__type">
                    {typeLabels[transaction.type]}
                  </span>
                  <span className="mnbara-transaction-list__description">
                    {transaction.description}
                  </span>
                  <span className="mnbara-transaction-list__date">
                    {formatDate(transaction.createdAt)}
                  </span>
                </div>
                <div className="mnbara-transaction-list__amount-section">
                  <span className={`mnbara-transaction-list__amount ${transaction.amount < 0 ? 'negative' : 'positive'}`}>
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </span>
                  <span className={`mnbara-transaction-list__status status-${statusColors[transaction.status]}`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {paginated && totalPages > 1 && (
            <div className="mnbara-transaction-list__pagination">
              <button
                className="mnbara-transaction-list__page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="mnbara-transaction-list__page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="mnbara-transaction-list__page-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionList;
