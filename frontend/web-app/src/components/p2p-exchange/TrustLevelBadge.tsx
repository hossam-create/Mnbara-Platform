// ============================================================
// P2P Exchange - TrustLevelBadge Component
// Display user's trust level with visual indicator
// ============================================================

import React from 'react';
import type { TrustLevel } from '../../types/p2p-exchange.types';

// ============================================================
// TYPES
// ============================================================

interface TrustLevelBadgeProps {
  trustLevel?: TrustLevel;
  level?: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

// ============================================================
// COMPONENT
// ============================================================

export const TrustLevelBadge: React.FC<TrustLevelBadgeProps> = ({
  trustLevel,
  level,
  size = 'md',
  showDetails = false,
}) => {
  const displayLevel = trustLevel?.level ?? level ?? 0;

  // ============================================================
  // HELPERS
  // ============================================================

  const getLevelColor = (lvl: number) => {
    if (lvl >= 5) return 'bg-purple-100 text-purple-800 border-purple-300';
    if (lvl >= 4) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (lvl >= 3) return 'bg-green-100 text-green-800 border-green-300';
    if (lvl >= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (lvl >= 1) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getLevelLabel = (lvl: number) => {
    if (lvl >= 5) return 'Elite';
    if (lvl >= 4) return 'Expert';
    if (lvl >= 3) return 'Advanced';
    if (lvl >= 2) return 'Intermediate';
    if (lvl >= 1) return 'Beginner';
    return 'New';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="inline-flex flex-col items-start">
      <div
        className={`inline-flex items-center space-x-2 rounded-full border-2 font-semibold ${getLevelColor(
          displayLevel
        )} ${getSizeClasses()}`}
      >
        <svg
          className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span>
          Level {displayLevel} - {getLevelLabel(displayLevel)}
        </span>
      </div>

      {showDetails && trustLevel && (
        <div className="mt-2 text-xs text-gray-600 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Max Transaction:</span>
            <span>{trustLevel.maxTransactionAmount}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">Successful Exchanges:</span>
            <span>{trustLevel.successfulExchanges}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">Total Volume:</span>
            <span>{trustLevel.totalVolume}</span>
          </div>
          {trustLevel.disputeCount > 0 && (
            <div className="flex items-center space-x-2 text-red-600">
              <span className="font-medium">Disputes:</span>
              <span>{trustLevel.disputeCount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
