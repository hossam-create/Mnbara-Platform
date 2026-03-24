/**
 * Admin Decision Management Dashboard
 * Main dashboard for admins to manage decisions
 */

import React, { useState } from 'react';
import { DecisionStatus, DecisionSource } from '../../types/decision.types';
import { AdminDecisionList } from './AdminDecisionList';
import { AdminDecisionDetailModal } from './AdminDecisionDetailModal';
import { AdminDecisionStats } from './AdminDecisionStats';

interface Decision {
  id: string;
  assetId: string;
  assetTitle: string;
  status: DecisionStatus;
  source: DecisionSource;
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  reason?: string;
}

interface DecisionDetail extends Decision {
  metadata?: Record<string, any>;
}

interface DecisionStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  expired: number;
  averageDecisionTime: number;
  approvalRate: number;
  rejectionRate: number;
}

export interface AdminDecisionDashboardProps {
  decisions: Decision[];
  stats: DecisionStats;
  isLoading?: boolean;
  onDecisionOverride?: (decisionId: string, newStatus: DecisionStatus, reason: string) => void;
  onRefresh?: () => void;
}

export const AdminDecisionDashboard: React.FC<AdminDecisionDashboardProps> = ({
  decisions,
  stats,
  isLoading = false,
  onDecisionOverride,
  onRefresh
}) => {
  const [statusFilter, setStatusFilter] = useState<DecisionStatus | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<DecisionSource | 'ALL'>('ALL');
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredDecisions = decisions.filter((d) => {
    const statusMatch = statusFilter === 'ALL' || d.status === statusFilter;
    const sourceMatch = sourceFilter === 'ALL' || d.source === sourceFilter;
    return statusMatch && sourceMatch;
  });

  const selectedDecision = selectedDecisionId
    ? decisions.find((d) => d.id === selectedDecisionId)
    : null;

  const handleDecisionClick = (id: string) => {
    setSelectedDecisionId(id);
    setShowDetailModal(true);
  };

  const handleOverride = (newStatus: DecisionStatus, reason: string) => {
    if (selectedDecisionId) {
      onDecisionOverride?.(selectedDecisionId, newStatus, reason);
      setShowDetailModal(false);
      setSelectedDecisionId(null);
    }
  };

  return (
    <div 
      className="space-y-6"
      data-testid="admin-decision-dashboard"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Decision Management</h1>
          <p className="text-gray-600 mt-1">Manage and override asset decisions</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          data-testid="refresh-button"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Statistics */}
      <div data-testid="statistics-section">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
        <AdminDecisionStats stats={stats} isLoading={isLoading} />
      </div>

      {/* Decision List */}
      <div data-testid="decision-list-section">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Decisions</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <AdminDecisionList
            decisions={filteredDecisions}
            isLoading={isLoading}
            onDecisionClick={handleDecisionClick}
            onStatusFilterChange={setStatusFilter}
            onSourceFilterChange={setSourceFilter}
            selectedStatusFilter={statusFilter}
            selectedSourceFilter={sourceFilter}
          />
        </div>
      </div>

      {/* Detail Modal */}
      <AdminDecisionDetailModal
        decision={selectedDecision as DecisionDetail | null}
        isOpen={showDetailModal}
        isLoading={isLoading}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedDecisionId(null);
        }}
        onOverride={handleOverride}
      />
    </div>
  );
};

export default AdminDecisionDashboard;
