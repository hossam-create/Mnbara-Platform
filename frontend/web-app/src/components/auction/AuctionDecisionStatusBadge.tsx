/**
 * Auction Decision Status Badge Component
 * Displays auction decision status with color-coded badge
 * Extends DecisionStatusBadge with auction-specific styling
 */

import React from 'react';
import { DecisionStatus } from '../../types/decision.types';
import { DecisionStatusBadge } from '../decision/DecisionStatusBadge';

export interface AuctionDecisionStatusBadgeProps {
  status: DecisionStatus;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  disabled?: boolean;
}

export const AuctionDecisionStatusBadge: React.FC<AuctionDecisionStatusBadgeProps> = ({
  status,
  size = 'medium',
  showLabel = true,
  disabled = false
}) => {
  return (
    <div className={disabled ? 'opacity-50 cursor-not-allowed' : ''}>
      <DecisionStatusBadge
        status={status}
        size={size}
        showLabel={showLabel}
      />
    </div>
  );
};

export default AuctionDecisionStatusBadge;
