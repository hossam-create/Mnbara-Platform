import React from 'react';
import { AuctionStatus } from '../../types/product';
import './AuctionStatusBadge.css';

export interface AuctionStatusBadgeProps {
  status: AuctionStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const AuctionStatusBadge: React.FC<AuctionStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const statusConfig: Record<AuctionStatus, { label: string; className: string; icon?: React.ReactNode }> = {
    [AuctionStatus.UPCOMING]: {
      label: 'Starting Soon',
      className: 'upcoming',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
    },
    [AuctionStatus.ACTIVE]: {
      label: 'Live Now',
      className: 'active',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="6" />
        </svg>
      ),
    },
    [AuctionStatus.ENDED]: {
      label: 'Ended',
      className: 'ended',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
          <path d="M14.5 9.5L9.5 14.5M9.5 9.5l5 5" />
        </svg>
      ),
    },
    [AuctionStatus.CANCELLED]: {
      label: 'Cancelled',
      className: 'cancelled',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      ),
    },
    [AuctionStatus.RESERVE_NOT_MET]: {
      label: 'Reserve Not Met',
      className: 'reserve-not-met',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  };

  const config = statusConfig[status] || statusConfig[AuctionStatus.ACTIVE];

  return (
    <div className={`mnbara-auction-status-badge mnbara-auction-status-badge--${config.className} mnbara-auction-status-badge--${size}`}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
};

export default AuctionStatusBadge;
