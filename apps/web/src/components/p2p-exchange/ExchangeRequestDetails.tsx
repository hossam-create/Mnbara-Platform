// ============================================================
// P2P Exchange - Exchange Request Details Component
// Detailed view of a single exchange request
// ============================================================

import React from 'react';
import {
  useExchangeRequest,
  useCancelExchangeRequest,
} from '../../hooks/useExchangeRequest';
import { ExchangeStatus } from '../../types/p2p-exchange.types';

// ============================================================
// COMPONENT PROPS
// ============================================================

interface ExchangeRequestDetailsProps {
  requestId: number;
  onClose?: () => void;
  onCancel?: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

export const ExchangeRequestDetails: React.FC<ExchangeRequestDetailsProps> = ({
  requestId,
  onClose,
  onCancel,
}) => {
  const { data, isLoading, isError } = useExchangeRequest(requestId);
  const cancelRequest = useCancelExchangeRequest();

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this request?')) {
      return;
    }

    try {
      await cancelRequest.mutateAsync(requestId);
      onCancel?.();
    } catch (error) {
      console.error('Failed to cancel request:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12" data-testid="exchange-request-details-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (isError || !data?.data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg" data-testid="exchange-request-details-error">
        <p className="text-red-600">Failed to load request details.</p>
      </div>
    );
  }

  const request = data.data;
  const canCancel = request.status === ExchangeStatus.OPEN;

  return (
    <div className="bg-white rounded-lg shadow-lg" data-testid="exchange-request-details">
      {/* Header */}
      <div className="p-6 border-b border-gray-200" data-testid="details-header">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Exchange Request #{request.id}
            </h2>
            <p className="text-sm text-gray-500 mt-1" data-testid="created-at">
              Created {new Date(request.createdAt).toLocaleString()}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              data-testid="close-button"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6" data-testid="details-content">
        {/* Status */}
        <div data-testid="status-section">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <span
            className={`inline-block px-4 py-2 text-sm font-medium rounded-lg ${
              request.status === ExchangeStatus.COMPLETED
                ? 'bg-green-100 text-green-800'
                : request.status === ExchangeStatus.CANCELLED
                ? 'bg-gray-100 text-gray-800'
                : 'bg-blue-100 text-blue-800'
            }`}
            data-testid="status-badge"
          >
            {request.status}
          </span>
        </div>

        {/* Exchange Details */}
        <div className="grid grid-cols-2 gap-6" data-testid="exchange-details">
          <div data-testid="from-section">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From
            </label>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {parseFloat(request.fromAmount).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">{request.fromCurrency}</p>
            </div>
          </div>

          <div data-testid="to-section">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To
            </label>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {parseFloat(request.toAmount).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">{request.toCurrency}</p>
            </div>
          </div>
        </div>

        {/* Rate & Fees */}
        <div className="grid grid-cols-2 gap-6" data-testid="rate-fees-section">
          <div data-testid="rate-section">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exchange Rate
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {parseFloat(request.desiredRate).toFixed(4)}
            </p>
          </div>

          <div data-testid="fee-section">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform Fee
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {parseFloat(request.platformFee).toFixed(2)} {request.fromCurrency}
            </p>
          </div>
        </div>

        {/* Security & Trust */}
        <div className="grid grid-cols-2 gap-6" data-testid="security-trust-section">
          <div data-testid="deposit-section">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Security Deposit
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {parseFloat(request.securityDeposit).toFixed(2)} {request.fromCurrency}
            </p>
          </div>

          <div data-testid="trust-level-section">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trust Level
            </label>
            <p className="text-lg font-semibold text-gray-900">
              Level {request.trustLevel}
            </p>
          </div>
        </div>

        {/* Escrow Type */}
        <div data-testid="escrow-section">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Escrow Type
          </label>
          <p className="text-sm text-gray-900">
            {request.useExternalEscrow ? 'External Escrow' : 'Internal Escrow'}
          </p>
        </div>

        {/* Expiration */}
        <div data-testid="expiration-section">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expires At
          </label>
          <p className="text-sm text-gray-900">
            {new Date(request.expiresAt).toLocaleString()}
          </p>
        </div>

        {/* Matched/Completed Timestamps */}
        {request.matchedAt && (
          <div data-testid="matched-at-section">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Matched At
            </label>
            <p className="text-sm text-gray-900">
              {new Date(request.matchedAt).toLocaleString()}
            </p>
          </div>
        )}

        {request.completedAt && (
          <div data-testid="completed-at-section">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Completed At
            </label>
            <p className="text-sm text-gray-900">
              {new Date(request.completedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {canCancel && (
        <div className="p-6 border-t border-gray-200" data-testid="actions-section">
          <button
            onClick={handleCancel}
            disabled={cancelRequest.isPending}
            className="w-full px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="cancel-request-button"
          >
            {cancelRequest.isPending ? 'Cancelling...' : 'Cancel Request'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ExchangeRequestDetails;
