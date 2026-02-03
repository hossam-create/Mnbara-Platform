// ============================================================
// P2P Exchange - Marketplace Browser Component
// Main marketplace browsing interface with filters and pagination
// ============================================================

import React from 'react';
import { useMarketplace, useAcceptRequest } from '../../hooks/useMarketplace';
import { MarketplaceFilters } from './MarketplaceFilters';
import { MarketplaceRequestCard } from './MarketplaceRequestCard';
import type { MarketplaceFilters as Filters, ExchangeRequest } from '../../types/p2p-exchange.types';

// ============================================================
// COMPONENT PROPS
// ============================================================

interface MarketplaceBrowserProps {
  onRequestAccepted?: (matchId: number) => void;
  onViewDetails?: (request: ExchangeRequest) => void;
}

// ============================================================
// COMPONENT
// ============================================================

export const MarketplaceBrowser: React.FC<MarketplaceBrowserProps> = ({
  onRequestAccepted,
  onViewDetails,
}) => {
  const [filters, setFilters] = React.useState<Filters>({
    page: 1,
    limit: 10,
    sortBy: 'time',
    sortOrder: 'desc',
  });

  const { data, isLoading, isError } = useMarketplace(filters);
  const acceptRequest = useAcceptRequest();

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters({
      ...newFilters,
      page: 1, // Reset to first page when filters change
    });
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sortBy: 'time',
      sortOrder: 'desc',
    });
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      const result = await acceptRequest.mutateAsync(requestId);
      onRequestAccepted?.(result.data.matchId);
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters({
      ...filters,
      page: newPage,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12" data-testid="marketplace-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg" data-testid="marketplace-error">
        <p className="text-red-600">
          Failed to load marketplace. Please try again.
        </p>
      </div>
    );
  }

  const requests = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6" data-testid="marketplace-browser">
      {/* Header */}
      <div className="flex justify-between items-center" data-testid="marketplace-header">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Marketplace</h2>
          <p className="text-sm text-gray-500 mt-1">
            Browse and accept exchange requests
          </p>
        </div>
        {pagination && (
          <div className="text-sm text-gray-500" data-testid="pagination-info">
            Showing {requests.length} of {pagination.total} requests
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" data-testid="marketplace-content">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1" data-testid="filters-sidebar">
          <MarketplaceFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
          />
        </div>

        {/* Request List */}
        <div className="lg:col-span-3 space-y-6" data-testid="request-list-container">
          {/* Empty State */}
          {requests.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-lg" data-testid="empty-state">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No requests found
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Try adjusting your filters to see more results.
              </p>
            </div>
          ) : (
            <>
              {/* Request Cards */}
              <div className="space-y-4" data-testid="request-cards">
                {requests.map((request) => (
                  <MarketplaceRequestCard
                    key={request.id}
                    request={request}
                    onAccept={handleAcceptRequest}
                    onViewDetails={onViewDetails}
                    isAccepting={acceptRequest.isPending}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2" data-testid="pagination-controls">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    data-testid="pagination-prev-button"
                  >
                    Previous
                  </button>

                  <div className="flex gap-2" data-testid="pagination-pages">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            pagination.page === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          data-testid={`pagination-page-${page}`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    data-testid="pagination-next-button"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Accept Request Error */}
      {acceptRequest.isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="accept-error-message">
          <p className="text-sm text-red-600">
            Failed to accept request. Please try again.
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketplaceBrowser;
