// ============================================================
// P2P Exchange - MatchDetails Component
// Display detailed information about a match
// ============================================================

import React from 'react';
import { useMatch, useMatchTimeline } from '../../hooks/useMatch';
import { MatchStatus, SettlementMethod } from '../../types/p2p-exchange.types';

// ============================================================
// TYPES
// ============================================================

interface MatchDetailsProps {
  matchId: number;
  onInitiatePayment?: () => void;
  onUploadProof?: () => void;
  onConfirmReceipt?: () => void;
  onCancel?: () => void;
  onDispute?: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

export const MatchDetails: React.FC<MatchDetailsProps> = ({
  matchId,
  onInitiatePayment,
  onUploadProof,
  onConfirmReceipt,
  onCancel,
  onDispute,
}) => {
  const { data: matchData, isLoading, isError, error } = useMatch(matchId);
  const { data: timelineData } = useMatchTimeline(matchId);

  // ============================================================
  // LOADING & ERROR STATES
  // ============================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="match-details-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="match-details-error">
        <p className="text-red-800">
          Error loading match: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!matchData?.data) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4" data-testid="match-not-found">
        <p className="text-yellow-800">Match not found</p>
      </div>
    );
  }

  const match = matchData.data;

  // ============================================================
  // HELPERS
  // ============================================================

  const getStatusColor = (status: MatchStatus) => {
    switch (status) {
      case MatchStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case MatchStatus.ESCROWED:
        return 'bg-blue-100 text-blue-800';
      case MatchStatus.SETTLING:
        return 'bg-purple-100 text-purple-800';
      case MatchStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case MatchStatus.FAILED:
        return 'bg-red-100 text-red-800';
      case MatchStatus.DISPUTED:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSettlementMethodLabel = (method: SettlementMethod) => {
    switch (method) {
      case SettlementMethod.INTERNAL:
        return 'Internal Settlement';
      case SettlementMethod.EXTERNAL_OPTIONAL:
        return 'External Escrow (Optional)';
      case SettlementMethod.EXTERNAL_MANDATORY:
        return 'External Escrow (Mandatory)';
      default:
        return method;
    }
  };

  const canInitiatePayment = match.status === MatchStatus.ESCROWED;
  const canUploadProof = match.status === MatchStatus.ESCROWED;
  const canConfirmReceipt = match.status === MatchStatus.SETTLING;
  const canCancel = [MatchStatus.PENDING, MatchStatus.ESCROWED].includes(match.status);
  const canDispute = [MatchStatus.ESCROWED, MatchStatus.SETTLING].includes(match.status);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6" data-testid="match-details">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-testid="match-header">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Match #{match.id}</h2>
          <span 
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}
            data-testid="match-status-badge"
          >
            {match.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="match-info-grid">
          <div data-testid="match-type-section">
            <p className="text-sm text-gray-500">Match Type</p>
            <p className="text-lg font-medium text-gray-900">{match.matchType}</p>
          </div>
          <div data-testid="match-score-section">
            <p className="text-sm text-gray-500">Match Score</p>
            <p className="text-lg font-medium text-gray-900">{match.matchScore}</p>
          </div>
          <div data-testid="settlement-method-section">
            <p className="text-sm text-gray-500">Settlement Method</p>
            <p className="text-lg font-medium text-gray-900">
              {getSettlementMethodLabel(match.settlementMethod)}
            </p>
          </div>
          <div data-testid="created-at-section">
            <p className="text-sm text-gray-500">Created At</p>
            <p className="text-lg font-medium text-gray-900">
              {new Date(match.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Exchange Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="exchange-details">
        {/* Your Request */}
        {match.request && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-testid="your-request-section">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Request</h3>
            <div className="space-y-3">
              <div data-testid="your-request-from">
                <p className="text-sm text-gray-500">From</p>
                <p className="text-lg font-medium text-gray-900">
                  {match.request.fromAmount} {match.request.fromCurrency}
                </p>
              </div>
              <div data-testid="your-request-to">
                <p className="text-sm text-gray-500">To</p>
                <p className="text-lg font-medium text-gray-900">
                  {match.request.toAmount} {match.request.toCurrency}
                </p>
              </div>
              <div data-testid="your-request-rate">
                <p className="text-sm text-gray-500">Rate</p>
                <p className="text-lg font-medium text-gray-900">{match.request.actualRate || match.request.desiredRate}</p>
              </div>
              <div data-testid="your-request-trust-level">
                <p className="text-sm text-gray-500">Trust Level</p>
                <p className="text-lg font-medium text-gray-900">{match.request.trustLevel}</p>
              </div>
            </div>
          </div>
        )}

        {/* Counter Request */}
        {match.counterRequest && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-testid="counter-request-section">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Counter Party Request</h3>
            <div className="space-y-3">
              <div data-testid="counter-request-from">
                <p className="text-sm text-gray-500">From</p>
                <p className="text-lg font-medium text-gray-900">
                  {match.counterRequest.fromAmount} {match.counterRequest.fromCurrency}
                </p>
              </div>
              <div data-testid="counter-request-to">
                <p className="text-sm text-gray-500">To</p>
                <p className="text-lg font-medium text-gray-900">
                  {match.counterRequest.toAmount} {match.counterRequest.toCurrency}
                </p>
              </div>
              <div data-testid="counter-request-rate">
                <p className="text-sm text-gray-500">Rate</p>
                <p className="text-lg font-medium text-gray-900">
                  {match.counterRequest.actualRate || match.counterRequest.desiredRate}
                </p>
              </div>
              <div data-testid="counter-request-trust-level">
                <p className="text-sm text-gray-500">Trust Level</p>
                <p className="text-lg font-medium text-gray-900">{match.counterRequest.trustLevel}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settlement Information */}
      {match.settlement && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-testid="settlement-info-section">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Settlement Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="settlement-info-grid">
            <div data-testid="settlement-status">
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-lg font-medium text-gray-900">{match.settlement.status}</p>
            </div>
            {match.settlement.pspProvider && (
              <div data-testid="psp-provider">
                <p className="text-sm text-gray-500">PSP Provider</p>
                <p className="text-lg font-medium text-gray-900">{match.settlement.pspProvider}</p>
              </div>
            )}
            {match.settlement.externalEscrowProvider && (
              <div data-testid="escrow-provider">
                <p className="text-sm text-gray-500">Escrow Provider</p>
                <p className="text-lg font-medium text-gray-900">{match.settlement.externalEscrowProvider}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      {timelineData?.data && timelineData.data.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-testid="timeline-section">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
          <div className="space-y-4" data-testid="timeline-events">
            {timelineData.data.map((event, index) => (
              <div key={index} className="flex items-start space-x-3" data-testid={`timeline-event-${index}`}>
                <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{event.event}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                  {event.details && (
                    <p className="text-sm text-gray-600 mt-1">
                      {JSON.stringify(event.details)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-testid="actions-section">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
        <div className="flex flex-wrap gap-3" data-testid="action-buttons">
          {canInitiatePayment && onInitiatePayment && (
            <button
              onClick={onInitiatePayment}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              data-testid="initiate-payment-button"
            >
              Initiate Payment
            </button>
          )}
          {canUploadProof && onUploadProof && (
            <button
              onClick={onUploadProof}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              data-testid="upload-proof-button"
            >
              Upload Proof
            </button>
          )}
          {canConfirmReceipt && onConfirmReceipt && (
            <button
              onClick={onConfirmReceipt}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              data-testid="confirm-receipt-button"
            >
              Confirm Receipt
            </button>
          )}
          {canCancel && onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              data-testid="cancel-match-button"
            >
              Cancel Match
            </button>
          )}
          {canDispute && onDispute && (
            <button
              onClick={onDispute}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              data-testid="dispute-match-button"
            >
              Dispute Match
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
