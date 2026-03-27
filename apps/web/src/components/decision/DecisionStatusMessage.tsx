/**
 * Decision Status Message Component
 * Displays decision status with explanation and actions
 */

import React from 'react';
import { DecisionStatus, AssetType } from '../../types/decision.types';
import { getDecisionStatusDisplay } from '../../types/decision.types';

export interface DecisionStatusMessageProps {
  status: DecisionStatus;
  assetType?: AssetType;
  reason?: string | null;
  decidedAt?: string | null;
  expiresAt?: string | null;
  onRetry?: () => void;
  isLoading?: boolean;
}

export const DecisionStatusMessage: React.FC<DecisionStatusMessageProps> = ({
  status,
  assetType,
  reason,
  decidedAt,
  expiresAt,
  onRetry,
  isLoading = false
}) => {
  const display = getDecisionStatusDisplay(status);

  const getDetailedMessage = (): string => {
    switch (status) {
      case DecisionStatus.PENDING:
        return 'Your listing is being reviewed. This typically takes a few minutes.';
      case DecisionStatus.APPROVED:
        return 'Your listing has been approved and is now active.';
      case DecisionStatus.REJECTED:
        return reason || 'Your listing was rejected. Please review the reason and try again.';
      case DecisionStatus.EXPIRED:
        return 'Your decision has expired. Please resubmit your listing.';
      default:
        return 'Unknown status';
    }
  };

  const bgColorClasses: Record<string, string> = {
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  };

  const textColorClasses: Record<string, string> = {
    success: 'text-green-800',
    warning: 'text-yellow-800',
    error: 'text-red-800',
    info: 'text-blue-800'
  };

  return (
    <div className={`border rounded-lg p-4 ${bgColorClasses[display.color]}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-1">{display.icon}</span>
        <div className="flex-1">
          <h3 className={`font-semibold ${textColorClasses[display.color]}`}>
            {display.label}
          </h3>
          <p className={`text-sm mt-1 ${textColorClasses[display.color]}`}>
            {getDetailedMessage()}
          </p>

          {decidedAt && (
            <p className="text-xs text-gray-600 mt-2">
              Decided: {new Date(decidedAt).toLocaleString()}
            </p>
          )}

          {expiresAt && status === DecisionStatus.APPROVED && (
            <p className="text-xs text-gray-600 mt-1">
              Expires: {new Date(expiresAt).toLocaleString()}
            </p>
          )}

          {status === DecisionStatus.PENDING && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-xs text-gray-600">Reviewing...</span>
            </div>
          )}

          {(status === DecisionStatus.REJECTED || status === DecisionStatus.EXPIRED) && onRetry && (
            <button
              onClick={onRetry}
              disabled={isLoading}
              className="mt-3 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Retrying...' : 'Try Again'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DecisionStatusMessage;
