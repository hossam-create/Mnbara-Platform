/**
 * Seller Dashboard Component
 * Main dashboard for sellers with decision status management
 */

import React, { useState } from 'react';
import { DecisionStatus } from '../../types/decision.types';
import { DecisionFilter } from '../decision/DecisionFilter';
import { SellerListingsTable } from './SellerListingsTable';
import { PendingDecisionsNotification } from './PendingDecisionsNotification';
import { DecisionHistoryView } from './DecisionHistoryView';

interface Listing {
  id: string;
  title: string;
  price: number;
  status: string;
  decisionStatus: DecisionStatus;
  createdAt: string;
  views: number;
}

interface PendingDecision {
  id: string;
  listingTitle: string;
  requestedAt: string;
}

export interface SellerDashboardProps {
  listings: Listing[];
  pendingDecisions: PendingDecision[];
  isLoading?: boolean;
  onListingClick?: (id: string) => void;
  onRefresh?: () => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  listings,
  pendingDecisions,
  isLoading = false,
  onListingClick,
  onRefresh
}) => {
  const [statusFilter, setStatusFilter] = useState<DecisionStatus | 'ALL'>('ALL');
  const [showNotification, setShowNotification] = useState(true);
  const [selectedListingForHistory, setSelectedListingForHistory] = useState<string | null>(null);

  const filteredListings = statusFilter === 'ALL'
    ? listings
    : listings.filter(l => l.decisionStatus === statusFilter);

  const stats = {
    total: listings.length,
    approved: listings.filter(l => l.decisionStatus === DecisionStatus.APPROVED).length,
    pending: listings.filter(l => l.decisionStatus === DecisionStatus.PENDING).length,
    rejected: listings.filter(l => l.decisionStatus === DecisionStatus.REJECTED).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
          <p className="text-gray-600 mt-1">Manage your listings and track decision status</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Listings</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-green-200 p-4">
          <p className="text-sm text-green-600">Approved</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-lg border border-yellow-200 p-4">
          <p className="text-sm text-yellow-600">Pending</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-4">
          <p className="text-sm text-red-600">Rejected</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
        </div>
      </div>

      {/* Pending Decisions Notification */}
      {showNotification && (
        <PendingDecisionsNotification
          pendingDecisions={pendingDecisions}
          onDismiss={() => setShowNotification(false)}
          onViewDetails={(id) => setSelectedListingForHistory(id)}
        />
      )}

      {/* Decision History Modal */}
      {selectedListingForHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <DecisionHistoryView
              listingId={selectedListingForHistory}
              listingTitle={listings.find(l => l.id === selectedListingForHistory)?.title || ''}
              history={[]}
              onClose={() => setSelectedListingForHistory(null)}
            />
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <DecisionFilter
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
          showLabel={true}
          compact={false}
        />
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <SellerListingsTable
          listings={filteredListings}
          isLoading={isLoading}
          onListingClick={(id) => {
            onListingClick?.(id);
            setSelectedListingForHistory(id);
          }}
          selectedStatusFilter={statusFilter}
        />
      </div>
    </div>
  );
};

export default SellerDashboard;
