// ============================================================
// P2P Exchange - Exchange Request List Component
// Display list of user's exchange requests with filtering
// ============================================================

import React from 'react';
import { useExchangeRequests } from '../../hooks/useExchangeRequest';
import { ExchangeStatus } from '../../types/p2p-exchange.types';
import type { ExchangeRequest } from '../../types/p2p-exchange.types';

// ============================================================
// COMPONENT PROPS
// ============================================================

interface ExchangeRequestListProps {
  onSelectRequest?: (request: ExchangeRequest) => void;
  statusFilter?: ExchangeStatus;
}

// ============================================================
// STATUS BADGE COMPONENT
// ============================================================

const StatusBadge: React.FC<{ status: ExchangeStatus }> = ({ status }) => {
  const getStatusColor = (status: ExchangeStatus) => {
    switch (status) {
      case ExchangeStatus.OPEN:
        return 'bg-blue-100 text-blue-800';
      case ExchangeStatus.MATCHED:
        return 'bg-purple-100 text-purple-800';
      case ExchangeStatus.PAYMENT_INITIATED:
        return 'bg-yellow-100 text-yellow-800';
      case ExchangeStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case ExchangeStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      case ExchangeStatus.EXPIRED:
        return 'bg-red-100 text-red-800';
      case ExchangeStatus.DISPUTED:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
        status
      )}`}
      data-testid={`status-badge-${status}`}
    >
      {status}
    </span>
  );
};

// ============================================================
// REQUEST CARD COMPONENT
// ============================================================

const RequestCard: React.FC<{
  request: ExchangeRequest;
  onClick?: () => void;
}> = ({ request, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
      data-testid={`request-card-${request.id}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {request.fromCurrency} → {request.toCurrency}
          </h3>
          <p className="text-sm text-gray-500" data-testid={`request-id-${request.id}`}>
            Request #{request.id}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-2 gap-4 mb-4" data-testid={`amounts-${request.id}`}>
        <div data-testid={`from-amount-${request.id}`}>
          <p className="text-sm text-gray-500">From Amount</p>
          <p className="text-lg font-semibold text-gray-900">
            {parseFloat(request.fromAmount).toFixed(2)} {request.fromCurrency}
          </p>
        </div>
        <div data-testid={`to-amount-${request.id}`}>
          <p className="text-sm text-gray-500">To Amount</p>
          <p className="text-lg font-semibold text-gray-900">
            {parseFloat(request.toAmount).toFixed(2)} {request.toCurrency}
          </p>
        </div>
      </div>

      {/* Rate & Trust */}
      <div className="grid grid-cols-2 gap-4 mb-4" data-testid={`rate-trust-${request.id}`}>
        <div data-testid={`rate-${request.id}`}>
          <p className="text-sm text-gray-500">Exchange Rate</p>
          <p className="text-sm font-medium text-gray-900">
            {parseFloat(request.desiredRate).toFixed(4)}
          </p>
        </div>
        <div data-testid={`trust-level-${request.id}`}>
          <p className="text-sm text-gray-500">Trust Level</p>
          <p className="text-sm font-medium text-gray-900">
            Level {request.trustLevel}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200" data-testid={`footer-${request.id}`}>
        <div className="text-sm text-gray-500">
          Created {new Date(request.createdAt).toLocaleDateString()}
        </div>
        {request.useExternalEscrow && (
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded" data-testid={`escrow-badge-${request.id}`}>
            External Escrow
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export const ExchangeRequestList: React.FC<ExchangeRequestListProps> = ({
  onSelectRequest,
  statusFilter,
}) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedStatus, setSelectedStatus] = React.useState<string | undefined>(
    statusFilter
  );

  const { data, isLoading, isError, error } = useExchangeRequests({
    status: selectedStatus,
    page: currentPage,
    limit: 10,
  });

  // Handle status filter change
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status === 'ALL' ? undefined : status);
    setCurrentPage(1);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12" data-testid="exchange-request-list-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg" data-testid="exchange-request-list-error">
        <p className="text-red-600">
          Failed to load exchange requests. Please try again.
        </p>
      </div>
    );
  }

  const requests = data?.data || [];

  return (
    <div className="space-y-6" data-testid="exchange-request-list">
      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2" data-testid="status-filter">
        {['ALL', ...Object.values(ExchangeStatus)].map((status) => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              (status === 'ALL' && !selectedStatus) || selectedStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            data-testid={`filter-button-${status}`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Request List */}
      {requests.length === 0 ? (
        <div className="text-center py-12" data-testid="empty-state">
          <p className="text-gray-500">No exchange requests found.</p>
        </div>
      ) : (
        <div className="grid gap-4" data-testid="request-cards-container">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onClick={() => onSelectRequest?.(request)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {requests.length > 0 && (
        <div className="flex justify-center gap-2" data-testid="pagination">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="pagination-prev"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700" data-testid="pagination-info">
            Page {currentPage}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={requests.length < 10}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="pagination-next"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ExchangeRequestList;
