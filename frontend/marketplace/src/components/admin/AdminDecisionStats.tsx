/**
 * Admin Decision Statistics Component
 * Shows decision statistics and metrics
 */

import React from 'react';
import { DecisionStatus } from '../../types/decision.types';

interface DecisionStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  expired: number;
  averageDecisionTime: number; // in minutes
  approvalRate: number; // percentage
  rejectionRate: number; // percentage
}

export interface AdminDecisionStatsProps {
  stats: DecisionStats;
  isLoading?: boolean;
}

export const AdminDecisionStats: React.FC<AdminDecisionStatsProps> = ({
  stats,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse h-24"></div>
        ))}
      </div>
    );
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.round(minutes / 60);
    return `${hours}h`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total Decisions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-600">Total Decisions</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
      </div>

      {/* Approved */}
      <div className="bg-white rounded-lg border border-green-200 p-4">
        <p className="text-sm text-green-600">Approved</p>
        <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
        <p className="text-xs text-green-600 mt-2">{stats.approvalRate.toFixed(1)}% approval rate</p>
      </div>

      {/* Pending */}
      <div className="bg-white rounded-lg border border-yellow-200 p-4">
        <p className="text-sm text-yellow-600">Pending</p>
        <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
        <p className="text-xs text-yellow-600 mt-2">Awaiting decision</p>
      </div>

      {/* Rejected */}
      <div className="bg-white rounded-lg border border-red-200 p-4">
        <p className="text-sm text-red-600">Rejected</p>
        <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
        <p className="text-xs text-red-600 mt-2">{stats.rejectionRate.toFixed(1)}% rejection rate</p>
      </div>

      {/* Average Decision Time */}
      <div className="bg-white rounded-lg border border-blue-200 p-4">
        <p className="text-sm text-blue-600">Avg Decision Time</p>
        <p className="text-3xl font-bold text-blue-600 mt-2">{formatTime(stats.averageDecisionTime)}</p>
        <p className="text-xs text-blue-600 mt-2">Time to decide</p>
      </div>

      {/* Expired */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-600">Expired</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.expired}</p>
        <p className="text-xs text-gray-600 mt-2">No longer valid</p>
      </div>

      {/* Approval Rate Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-600 mb-3">Status Distribution</p>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-green-600">Approved</span>
              <span className="text-green-600">{stats.approvalRate.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${stats.approvalRate}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-red-600">Rejected</span>
              <span className="text-red-600">{stats.rejectionRate.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full"
                style={{ width: `${stats.rejectionRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Percentage */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-600 mb-3">Pending Percentage</p>
        <div className="flex items-center justify-center">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="8"
                strokeDasharray={`${(stats.pending / stats.total) * 282.7} 282.7`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-900">
                {((stats.pending / stats.total) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDecisionStats;
