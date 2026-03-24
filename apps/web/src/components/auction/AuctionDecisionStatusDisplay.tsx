/**
 * Auction Decision Status Display Component
 * Shows auction decision status with bidding restrictions
 */

import React from 'react';
import { DecisionStatus } from '../../types/decision.types';
import { DecisionStatusMessage } from '../decision/DecisionStatusMessage';

export interface AuctionDecisionStatusDisplayProps {
  status: DecisionStatus;
  reason?: string | null;
  decidedAt?: string | null;
  expiresAt?: string | null;
  canBid?: boolean;
  onRetry?: () => void;
  isLoading?: boolean;
}

export const AuctionDecisionStatusDisplay: React.FC<AuctionDecisionStatusDisplayProps> = ({
  status,
  reason,
  decidedAt,
  expiresAt,
  canBid = false,
  onRetry,
  isLoading = false
}) => {
  const getBiddingMessage = (): string => {
    if (status === DecisionStatus.APPROVED) {
      return 'Bidding is enabled for this auction.';
    }
    if (status === DecisionStatus.PENDING) {
      return 'Bidding is disabled while the auction is under review.';
    }
    if (status === DecisionStatus.REJECTED) {
      return 'Bidding is disabled. This auction was rejected.';
    }
    if (status === DecisionStatus.EXPIRED) {
      return 'Bidding is disabled. The auction decision has expired.';
    }
    return '';
  };

  return (
    <div className="space-y-3">
      <DecisionStatusMessage
        status={status}
        reason={reason}
        decidedAt={decidedAt}
        expiresAt={expiresAt}
        onRetry={onRetry}
        isLoading={isLoading}
      />

      {/* Bidding Status Indicator */}
      <div className={`p-3 rounded-lg border ${
        canBid
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`text-lg ${canBid ? 'text-green-600' : 'text-red-600'}`}>
            {canBid ? '✓' : '✕'}
          </span>
          <span className={`text-sm font-medium ${
            canBid ? 'text-green-800' : 'text-red-800'
          }`}>
            {canBid ? 'Bidding Enabled' : 'Bidding Disabled'}
          </span>
        </div>
        <p className={`text-xs mt-1 ${
          canBid ? 'text-green-700' : 'text-red-700'
        }`}>
          {getBiddingMessage()}
        </p>
      </div>
    </div>
  );
};

export default AuctionDecisionStatusDisplay;
