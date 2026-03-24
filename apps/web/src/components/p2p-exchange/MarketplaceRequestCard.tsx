// ============================================================
// P2P Exchange - Marketplace Request Card Component
// Card component for displaying marketplace requests
// ============================================================

import { FC } from 'react';
import type { ExchangeRequest } from '../../types/p2p-exchange.types';

// ============================================================
// COMPONENT PROPS
// ============================================================

interface MarketplaceRequestCardProps {
  request: ExchangeRequest;
  onAccept?: (requestId: number) => void;
  onViewDetails?: (request: ExchangeRequest) => void;
  isAccepting?: boolean;
}

// ============================================================
// COMPONENT
// ============================================================

export const MarketplaceRequestCard: FC<MarketplaceRequestCardProps> = ({
  request,
  onAccept,
  onViewDetails,
  isAccepting = false,
}) => {
  return (
    <div 
      className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
      data-testid="marketplace-request-card"
    >
      {/* Header */}
      <div 
        className="flex justify-between items-start mb-4"
        data-testid="card-header"
      >
        <div>
          <h3 
            className="text-xl font-bold text-gray-900"
            data-testid="currency-pair"
          >
            {request.fromCurrency} → {request.toCurrency}
          </h3>
          <p 
            className="text-sm text-gray-500 mt-1"
            data-testid="request-id"
          >
            Request #{request.id}
          </p>
        </div>
        <div 
          className="flex items-center gap-2"
          data-testid="badges-container"
        >
          {/* Trust Level Badge */}
          <div 
            className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
            data-testid="trust-level-badge"
          >
            Trust Level {request.trustLevel}
          </div>
          {/* External Escrow Badge */}
          {request.useExternalEscrow && (
            <div 
              className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full"
              data-testid="external-escrow-badge"
            >
              External Escrow
            </div>
          )}
        </div>
      </div>

      {/* Exchange Details */}
      <div 
        className="grid grid-cols-2 gap-4 mb-4"
        data-testid="exchange-details"
      >
        <div 
          className="p-4 bg-gray-50 rounded-lg"
          data-testid="offering-section"
        >
          <p className="text-sm text-gray-500 mb-1">Offering</p>
          <p 
            className="text-2xl font-bold text-gray-900"
            data-testid="offering-amount"
          >
            {parseFloat(request.fromAmount).toFixed(2)}
          </p>
          <p 
            className="text-sm text-gray-600"
            data-testid="offering-currency"
          >
            {request.fromCurrency}
          </p>
        </div>

        <div 
          className="p-4 bg-gray-50 rounded-lg"
          data-testid="requesting-section"
        >
          <p className="text-sm text-gray-500 mb-1">Requesting</p>
          <p 
            className="text-2xl font-bold text-gray-900"
            data-testid="requesting-amount"
          >
            {parseFloat(request.toAmount).toFixed(2)}
          </p>
          <p 
            className="text-sm text-gray-600"
            data-testid="requesting-currency"
          >
            {request.toCurrency}
          </p>
        </div>
      </div>

      {/* Rate */}
      <div 
        className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"
        data-testid="rate-section"
      >
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-green-800">Exchange Rate</span>
          <span 
            className="text-lg font-bold text-green-900"
            data-testid="exchange-rate"
          >
            {parseFloat(request.desiredRate).toFixed(4)}
          </span>
        </div>
      </div>

      {/* Fees */}
      <div 
        className="grid grid-cols-2 gap-4 mb-4 text-sm"
        data-testid="fees-section"
      >
        <div data-testid="platform-fee">
          <span className="text-gray-500">Platform Fee:</span>
          <span className="ml-2 font-medium text-gray-900">
            {parseFloat(request.platformFee).toFixed(2)} {request.fromCurrency}
          </span>
        </div>
        <div data-testid="security-deposit">
          <span className="text-gray-500">Security Deposit:</span>
          <span className="ml-2 font-medium text-gray-900">
            {parseFloat(request.securityDeposit).toFixed(2)} {request.fromCurrency}
          </span>
        </div>
      </div>

      {/* Expiration */}
      <div 
        className="mb-4 text-sm text-gray-500"
        data-testid="expiration-section"
      >
        <span>Expires: </span>
        <span 
          className="font-medium text-gray-700"
          data-testid="expiration-date"
        >
          {new Date(request.expiresAt).toLocaleString()}
        </span>
      </div>

      {/* Actions */}
      <div 
        className="flex gap-3"
        data-testid="actions-section"
      >
        <button
          onClick={() => onAccept?.(request.id)}
          disabled={isAccepting}
          className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          data-testid="accept-button"
        >
          {isAccepting ? 'Accepting...' : 'Accept Request'}
        </button>

        <button
          onClick={() => onViewDetails?.(request)}
          className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          data-testid="view-details-button"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default MarketplaceRequestCard;
