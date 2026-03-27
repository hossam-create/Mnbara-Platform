/**
 * Admin Decision List Component
 * Displays all decisions with filtering and sorting
 */

import React, { useState } from 'react';
import { DecisionStatus, DecisionSource } from '../../types/decision.types';

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

export interface AdminDecisionListProps {
  decisions: Decision[];
  isLoading?: boolean;
  onDecisionClick?: (id: string) => void;
  onStatusFilterChange?: (status: DecisionStatus | 'ALL') => void;
  onSourceFilterChange?: (source: DecisionSource | 'ALL') => void;
  selectedStatusFilter?: DecisionStatus | 'ALL';
  selectedSourceFilter?: DecisionSource | 'ALL';
}

export const AdminDecisionList: React.FC<AdminDecisionListProps> = ({
  decisions,
  isLoading = false,
  onDecisionClick,
  onStatusFilterChange,
  onSourceFilterChange,
  selectedStatusFilter = 'ALL',
  selectedSourceFilter = 'ALL'
}) => {
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

  const getSourceColor = (source: DecisionSource) => {
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No decisions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Status</label>
          <select
            value={selectedStatusFilter}
            onChange={(e) => onStatusFilterChange?.(e.target.value as DecisionStatus | 'ALL')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value={DecisionStatus.APPROVED}>Approved</option>
            <option value={DecisionStatus.PENDING}>Pending</option>
            <option value={DecisionStatus.REJECTED}>Rejected</option>
            <option value={DecisionStatus.EXPIRED}>Expired</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Source</label>
          <select
            value={selectedSourceFilter}
            onChange={(e) => onSourceFilterChange?.(e.target.value as DecisionSource | 'ALL')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Sources</option>
            <option value={DecisionSource.INTERNAL}>Internal</option>
            <option value={DecisionSource.EXTERNAL}>External</option>
            <option value={DecisionSource.OVERRIDE}>Override</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Asset</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Source</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Requested</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Decided</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Decided By</th>
            </tr>
          </thead>
          <tbody>
            {decisions.map((decision) => (
              <tr
                key={decision.id}
                className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onDecisionClick?.(decision.id)}
              >
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{decision.assetTitle}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(decision.status)}`}>
                    {decision.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSourceColor(decision.source)}`}>
                    {decision.source}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(decision.requestedAt)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {decision.decidedAt ? formatDate(decision.decidedAt) : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{decision.decidedBy || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDecisionList;
