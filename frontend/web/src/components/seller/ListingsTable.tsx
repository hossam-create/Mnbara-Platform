// ============================================
// 📋 Listings Table for Seller Dashboard
// ============================================

import { useState } from 'react';
import type { SellerListing } from '../../services/seller.service';

interface ListingsTableProps {
  listings: SellerListing[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onEdit: (listing: SellerListing) => void;
  onDelete: (listingId: string) => void;
  onPause: (listingId: string) => void;
  onActivate: (listingId: string) => void;
  onSearch: (query: string) => void;
  onStatusFilter: (status: string) => void;
}

const getStatusColor = (status: SellerListing['status']) => {
  const colors: Record<SellerListing['status'], string> = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    sold: 'bg-blue-100 text-blue-700',
    expired: 'bg-red-100 text-red-700',
  };
  return colors[status];
};

const getListingTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    buy_now: '🛒',
    auction: '🔨',
    make_offer: '💬',
  };
  return icons[type] || '📦';
};

export function ListingsTable({
  listings,
  totalCount,
  currentPage,
  pageSize,
  isLoading,
  onPageChange,
  onEdit,
  onDelete,
  onPause,
  onActivate,
  onSearch,
  onStatusFilter,
}: ListingsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set());

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    onStatusFilter(status);
  };

  const toggleSelectAll = () => {
    if (selectedListings.size === listings.length) {
      setSelectedListings(new Set());
    } else {
      setSelectedListings(new Set(listings.map(l => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedListings);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedListings(newSelected);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">My Listings ({totalCount})</h2>
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search listings..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent w-64"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </form>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
              <option value="sold">Sold</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedListings.size > 0 && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
            <span className="text-sm text-pink-700 font-medium">
              {selectedListings.size} selected
            </span>
            <button className="px-3 py-1 text-sm bg-white border border-pink-200 rounded-lg hover:bg-pink-100">
              Pause Selected
            </button>
            <button className="px-3 py-1 text-sm bg-white border border-pink-200 rounded-lg hover:bg-pink-100">
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedListings(new Set())}
              className="ml-auto text-sm text-pink-600 hover:underline"
            >
              Clear selection
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading listings...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <span className="text-5xl block mb-4">📦</span>
          <p className="text-lg font-medium mb-2">No listings found</p>
          <p className="text-sm">Create your first listing to start selling</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
                <th className="p-4 font-medium">
                  <input
                    type="checkbox"
                    checked={selectedListings.size === listings.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                  />
                </th>
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Stock</th>
                <th className="p-4 font-medium">Views</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Created</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedListings.has(listing.id)}
                      onChange={() => toggleSelect(listing.id)}
                      className="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {listing.images[0] ? (
                          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate max-w-[200px]">{listing.title}</div>
                        <div className="text-sm text-gray-500">{listing.condition}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1">
                      <span>{getListingTypeIcon(listing.listingType)}</span>
                      <span className="text-sm text-gray-600 capitalize">{listing.listingType.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-gray-900">
                      {listing.currency} {listing.price.toLocaleString()}
                    </div>
                    {listing.listingType === 'auction' && listing.currentBid && (
                      <div className="text-xs text-green-600">
                        Current: {listing.currency} {listing.currentBid.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`font-medium ${listing.stock === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {listing.stock}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">{listing.views}</span>
                      {listing.watchers > 0 && (
                        <span className="text-xs text-gray-500">({listing.watchers} watching)</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(listing.status)}`}>
                      {listing.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {formatDate(listing.createdAt)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit(listing)}
                        className="p-2 text-gray-500 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {listing.status === 'active' ? (
                        <button
                          onClick={() => onPause(listing.id)}
                          className="p-2 text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Pause"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      ) : listing.status === 'paused' || listing.status === 'draft' ? (
                        <button
                          onClick={() => onActivate(listing.id)}
                          className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                          title="Activate"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      ) : null}
                      <button
                        onClick={() => onDelete(listing.id)}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    currentPage === page
                      ? 'bg-pink-500 text-white'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListingsTable;
