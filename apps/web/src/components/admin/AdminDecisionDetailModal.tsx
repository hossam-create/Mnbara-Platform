/**
 * Admin Decision Detail Modal Component
 * Shows detailed information about a decision
 */

import React from 'react';
import { DecisionStatus, DecisionSource } from '../../types/decision.types';

interface DecisionDetail {
  id: string;
  assetId: string;
  assetTitle: string;
  status: DecisionStatus;
  source: DecisionSource;
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface AdminDecisionDetailModalProps {
  decision: DecisionDetail | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onOverride?: (newStatus: DecisionStatus, reason: string) => void;
}

export const AdminDecisionDetailModal: React.FC<AdminDecisionDetailModalProps> = ({
  decision,
  isOpen,
  isLoading = false,
  onClose,
  onOverride
}) => {
  const [overrideStatus, setOverrideStatus] = React.useState<DecisionStatus | ''>('');
  const [overrideReason, setOverrideReason] = React.useState('');
  const [showOverrideForm, setShowOverrideForm] = React.useState(false);

  if (!isOpen || !decision) {
    return null;
  }

  const handleOverride = () => {
    if (overrideStatus && overrideReason.trim()) {
      onOverride?.(overrideStatus as DecisionStatus, overrideReason);
      setOverrideStatus('');
      setOverrideReason('');
      setShowOverrideForm(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: DecisionStatus) => {
    switch (status) {
      case DecisionStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case DecisionStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case DecisionStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case DecisionStatus.EXPIRED:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Decision Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ✕
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Asset Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Asset Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <p className="text-xs text-gray-600">Asset ID</p>
                    <p className="text-sm font-medium text-gray-900">{decision.assetId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Asset Title</p>
                    <p className="text-sm font-medium text-gray-900">{decision.assetTitle}</p>
                  </div>
                </div>
              </div>

              {/* Decision Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Decision Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600">Status</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(decision.status)}`}>
                      {decision.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Source</p>
                    <p className="text-sm font-medium text-gray-900">{decision.source}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Requested At</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(decision.requestedAt)}</p>
                  </div>
                  {decision.decidedAt && (
                    <div>
                      <p className="text-xs text-gray-600">Decided At</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(decision.decidedAt)}</p>
                    </div>
                  )}
                  {decision.decidedBy && (
                    <div>
                      <p className="text-xs text-gray-600">Decided By</p>
                      <p className="text-sm font-medium text-gray-900">{decision.decidedBy}</p>
                    </div>
                  )}
                  {decision.reason && (
                    <div>
                      <p className="text-xs text-gray-600">Reason</p>
                      <p className="text-sm font-medium text-gray-900">{decision.reason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Override Section */}
              {!showOverrideForm ? (
                <button
                  onClick={() => setShowOverrideForm(true)}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Override Decision
                </button>
              ) : (
                <div className="bg-orange-50 p-4 rounded-lg space-y-4 border border-orange-200">
                  <h4 className="font-semibold text-orange-900">Override Decision</h4>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">New Status</label>
                    <select
                      value={overrideStatus}
                      onChange={(e) => setOverrideStatus(e.target.value as DecisionStatus)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select status...</option>
                      <option value={DecisionStatus.APPROVED}>Approved</option>
                      <option value={DecisionStatus.REJECTED}>Rejected</option>
                      <option value={DecisionStatus.EXPIRED}>Expired</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Reason</label>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Explain why you're overriding this decision..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleOverride}
                      disabled={!overrideStatus || !overrideReason.trim()}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      Confirm Override
                    </button>
                    <button
                      onClick={() => {
                        setShowOverrideForm(false);
                        setOverrideStatus('');
                        setOverrideReason('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDecisionDetailModal;
