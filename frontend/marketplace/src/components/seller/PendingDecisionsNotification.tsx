/**
 * Pending Decisions Notification Component
 * Shows notification for pending listing decisions
 */

import React from 'react';

interface PendingDecision {
  id: string;
  listingTitle: string;
  requestedAt: string;
}

export interface PendingDecisionsNotificationProps {
  pendingDecisions: PendingDecision[];
  onDismiss?: () => void;
  onViewDetails?: (id: string) => void;
}

export const PendingDecisionsNotification: React.FC<PendingDecisionsNotificationProps> = ({
  pendingDecisions,
  onDismiss,
  onViewDetails
}) => {
  if (pendingDecisions.length === 0) {
    return null;
  }

  const getTimeAgo = (date: string): string => {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-blue-600 text-xl mt-1">⏳</div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">
              {pendingDecisions.length} Listing{pendingDecisions.length !== 1 ? 's' : ''} Under Review
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              Your listings are being reviewed. This typically takes a few minutes.
            </p>
            <div className="space-y-2">
              {pendingDecisions.slice(0, 3).map((decision) => (
                <div key={decision.id} className="flex items-center justify-between text-sm">
                  <span className="text-blue-700">{decision.listingTitle}</span>
                  <span className="text-blue-600 text-xs">{getTimeAgo(decision.requestedAt)}</span>
                </div>
              ))}
              {pendingDecisions.length > 3 && (
                <p className="text-sm text-blue-600 pt-2">
                  +{pendingDecisions.length - 3} more pending
                </p>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-blue-600 hover:text-blue-800 text-xl leading-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default PendingDecisionsNotification;
