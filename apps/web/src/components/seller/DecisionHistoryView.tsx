/**
 * Decision History View Component
 * Shows history of decisions for a listing
 */

import React from 'react';
import { DecisionStatus, DecisionSource } from '../../types/decision.types';
import { getDecisionStatusDisplay } from '../../types/decision.types';

interface DecisionHistoryEntry {
  id: string;
  status: DecisionStatus;
  source: DecisionSource;
  reason?: string | null;
  decidedAt: string;
  decidedBy?: string;
}

export interface DecisionHistoryViewProps {
  listingId: string;
  listingTitle: string;
  history: DecisionHistoryEntry[];
  isLoading?: boolean;
  onClose?: () => void;
}

export const DecisionHistoryView: React.FC<DecisionHistoryViewProps> = ({
  listingId,
  listingTitle,
  history,
  isLoading = false,
  onClose
}) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSourceBadgeColor = (source: DecisionSource) => {
    switch (source) {
      case DecisionSource.INTERNAL:
        return 'bg-gray-100 text-gray-800';
      case DecisionSource.EXTERNAL:
        return 'bg-purple-100 text-purple-800';
      case DecisionSource.OVERRIDE:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Decision History</h2>
          <p className="text-sm text-gray-600 mt-1">{listingTitle}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ✕
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : history.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No decision history available</p>
      ) : (
        <div className="space-y-4">
          {history.map((entry, index) => {
            const display = getDecisionStatusDisplay(entry.status);
            return (
              <div key={entry.id} className="border-l-4 border-gray-200 pl-4 py-2">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{display.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{display.label}</p>
                      <p className="text-sm text-gray-600">{formatDate(entry.decidedAt)}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSourceBadgeColor(entry.source)}`}>
                    {entry.source}
                  </span>
                </div>

                {entry.reason && (
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-2">
                    {entry.reason}
                  </p>
                )}

                {entry.decidedBy && (
                  <p className="text-xs text-gray-500 mt-2">
                    Decided by: {entry.decidedBy}
                  </p>
                )}

                {index < history.length - 1 && (
                  <div className="mt-4 border-t border-gray-100"></div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DecisionHistoryView;
