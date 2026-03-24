/**
 * Auction Bidding Guard Component
 * Prevents bidding on non-approved auctions
 */

import React from 'react';
import { DecisionStatus } from '../../types/decision.types';

export interface AuctionBiddingGuardProps {
  status: DecisionStatus;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuctionBiddingGuard: React.FC<AuctionBiddingGuardProps> = ({
  status,
  children,
  fallback
}) => {
  const isApproved = status === DecisionStatus.APPROVED;

  if (!isApproved) {
    return (
      <>
        {fallback || (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Bidding Unavailable:</span> This auction is not yet approved for bidding.
            </p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
};

export default AuctionBiddingGuard;
