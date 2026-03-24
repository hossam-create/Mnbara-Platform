/**
 * Seller Listings Table Component
 * Displays seller's listings with decision status column
 */

import React, { useState } from 'react';
import { DecisionStatus } from '../../types/decision.types';
import { DecisionStatusBadge } from '../decision/DecisionStatusBadge';

interface Listing {
  id: string;
  title: string;
  price: number;
  status: string;
  decisionStatus: DecisionStatus;
  createdAt: string;
  views: number;
}

export interface SellerListingsTableProps {
  listings: Listing[];
  isLoading?: boolean;
  onListingClick?: (id: string) => void;
  onStatusFilterChange?: (status: DecisionStatus | 'ALL') => void;
  selectedStatusFilter?: DecisionStatus | 'ALL';
}

export const SellerListingsTable: React.FC<SellerListingsTableProps> = ({
  listings,
  isLoading = false,
  onListingClick,
  onStatusFilterChange,
  selectedStatusFilter = 'ALL'
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No listings found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Decision</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Views</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => (
            <tr
              key={listing.id}
              className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onListingClick?.(listing.id)}
            >
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">{listing.title}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{formatPrice(listing.price)}</td>
              <td className="px-6 py-4 text-sm">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {listing.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm">
                <DecisionStatusBadge status={listing.decisionStatus} size="small" />
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">{listing.views}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{formatDate(listing.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SellerListingsTable;
