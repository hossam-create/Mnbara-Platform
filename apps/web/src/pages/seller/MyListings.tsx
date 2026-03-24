/**
 * MyListings Page - منصة منبرة
 * 
 * Seller's listing management page
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useListing } from '../../hooks/useListing';
import { ListingStatus, type ListingFilters } from '../../types/listing.types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';

export const MyListings: React.FC = () => {
  const { t } = useTranslation();
  const { useListings, deleteListing, markAsSold } = useListing();

  const [filters, setFilters] = useState<ListingFilters>({
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ListingStatus | 'ALL'>('ALL');

  // Fetch listings
  const { data, isLoading, refetch } = useListings({
    ...filters,
    search: searchQuery,
    status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
    // sellerId will be added by backend from JWT token
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    refetch();
  };

  const handleStatusFilter = (status: ListingStatus | 'ALL') => {
    setSelectedStatus(status);
    setFilters({ ...filters, page: 1 });
  };

  const handleDelete = async (listingId: number) => {
    if (window.confirm(t('listing.confirmDelete'))) {
      try {
        await deleteListing(listingId);
        refetch();
      } catch (error) {
        console.error('Failed to delete listing:', error);
      }
    }
  };

  const handleMarkAsSold = async (listingId: number) => {
    try {
      await markAsSold(listingId);
      refetch();
    } catch (error) {
      console.error('Failed to mark as sold:', error);
    }
  };

  const getStatusBadgeColor = (status: ListingStatus) => {
    switch (status) {
      case ListingStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case ListingStatus.SOLD:
        return 'bg-red-100 text-red-800';
      case ListingStatus.PENDING_REVIEW:
        return 'bg-yellow-100 text-yellow-800';
      case ListingStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case ListingStatus.EXPIRED:
        return 'bg-orange-100 text-orange-800';
      case ListingStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case ListingStatus.SUSPENDED:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('seller.myListings.title')}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('seller.myListings.subtitle')}
          </p>
        </div>
        <Link to="/seller/listings/create">
          <Button>
            <PlusIcon className="h-5 w-5 mr-2" />
            {t('seller.myListings.createNew')}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('seller.myListings.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </form>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusFilter('ALL')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('seller.myListings.filters.all')}
          </button>
          {Object.values(ListingStatus).map((status) => (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t(`listing.status.${status.toLowerCase()}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Table */}
      {data && data.listings.length > 0 ? (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('seller.myListings.table.listing')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('seller.myListings.table.price')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('seller.myListings.table.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('seller.myListings.table.views')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('seller.myListings.table.created')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('seller.myListings.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={listing.images[0]?.url || '/placeholder-image.png'}
                          alt={listing.title}
                          className="h-12 w-12 rounded object-cover"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {listing.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {listing.category?.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {listing.price} {listing.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                          listing.status
                        )}`}
                      >
                        {t(`listing.status.${listing.status.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        {listing.views}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/product/${listing.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title={t('seller.myListings.actions.view')}
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/seller/listings/edit/${listing.id}`}
                          className="text-green-600 hover:text-green-900"
                          title={t('seller.myListings.actions.edit')}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        {listing.status === ListingStatus.ACTIVE && (
                          <button
                            onClick={() => handleMarkAsSold(listing.id)}
                            className="text-orange-600 hover:text-orange-900"
                            title={t('seller.myListings.actions.markSold')}
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(listing.id)}
                          className="text-red-600 hover:text-red-900"
                          title={t('seller.myListings.actions.delete')}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.pagination && (
            <div className="mt-6">
              <Pagination
                currentPage={data.pagination.page}
                totalPages={data.pagination.totalPages}
                onPageChange={(page) => setFilters({ ...filters, page })}
              />
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 mb-4">{t('seller.myListings.noListings')}</p>
          <Link to="/seller/listings/create">
            <Button>
              <PlusIcon className="h-5 w-5 mr-2" />
              {t('seller.myListings.createFirst')}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyListings;
