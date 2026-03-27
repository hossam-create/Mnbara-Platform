/**
 * ListingCard - منصة منبرة
 * 
 * Card component for displaying listing in grid/list view
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HeartIcon,
  EyeIcon,
  MapPinIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import type { Listing } from '../../types/listing.types';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface ListingCardProps {
  listing: Listing;
  onFavoriteToggle?: (listingId: number) => void;
  isFavorited?: boolean;
  variant?: 'grid' | 'list';
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onFavoriteToggle,
  isFavorited = false,
  variant = 'grid',
}) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? ar : enUS;

  const primaryImage = listing.images[0]?.url || '/placeholder-image.png';
  const title = i18n.language === 'ar' && listing.titleAr ? listing.titleAr : listing.title;

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getConditionBadgeColor = (condition: string) => {
    switch (condition) {
      case 'NEW':
        return 'bg-green-100 text-green-800';
      case 'LIKE_NEW':
        return 'bg-blue-100 text-blue-800';
      case 'EXCELLENT':
        return 'bg-purple-100 text-purple-800';
      case 'GOOD':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'SOLD':
        return 'bg-red-100 text-red-800';
      case 'PENDING_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (variant === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
        <div className="flex">
          {/* Image */}
          <Link to={`/product/${listing.id}`} className="flex-shrink-0">
            <img
              src={primaryImage}
              alt={title}
              className="w-48 h-48 object-cover"
            />
          </Link>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start mb-2">
              <Link to={`/product/${listing.id}`}>
                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-2">
                  {title}
                </h3>
              </Link>
              
              {/* Favorite Button */}
              {onFavoriteToggle && (
                <button
                  onClick={() => onFavoriteToggle(listing.id)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  {isFavorited ? (
                    <HeartIconSolid className="h-6 w-6 text-red-500" />
                  ) : (
                    <HeartIcon className="h-6 w-6 text-gray-400" />
                  )}
                </button>
              )}
            </div>

            {/* Price */}
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {formatPrice(listing.price, listing.currency)}
              {listing.isNegotiable && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  {t('listing.negotiable')}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
              {listing.description}
            </p>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {listing.location && (
                <div className="flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{listing.location.city}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                <span>
                  {formatDistanceToNow(new Date(listing.createdAt), {
                    addSuffix: true,
                    locale,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <EyeIcon className="h-4 w-4" />
                <span>{listing.views}</span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex gap-2 mt-3">
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${getConditionBadgeColor(
                  listing.condition
                )}`}
              >
                {t(`listing.conditions.${listing.condition.toLowerCase()}`)}
              </span>
              {listing.isFeatured && (
                <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                  {t('listing.featured')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid variant
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden group">
      {/* Image */}
      <Link to={`/product/${listing.id}`} className="relative block">
        <img
          src={primaryImage}
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
        />
        
        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {listing.isFeatured && (
            <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-400 text-yellow-900">
              {t('listing.featured')}
            </span>
          )}
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeColor(
              listing.status
            )}`}
          >
            {t(`listing.status.${listing.status.toLowerCase()}`)}
          </span>
        </div>

        {/* Favorite Button */}
        {onFavoriteToggle && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onFavoriteToggle(listing.id);
            }}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
          >
            {isFavorited ? (
              <HeartIconSolid className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link to={`/product/${listing.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 mb-2">
            {title}
          </h3>
        </Link>

        {/* Price */}
        <div className="text-xl font-bold text-blue-600 mb-2">
          {formatPrice(listing.price, listing.currency)}
        </div>

        {/* Condition */}
        <span
          className={`inline-block px-2 py-1 text-xs font-medium rounded ${getConditionBadgeColor(
            listing.condition
          )}`}
        >
          {t(`listing.conditions.${listing.condition.toLowerCase()}`)}
        </span>

        {/* Meta Info */}
        <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
          {listing.location && (
            <div className="flex items-center gap-1">
              <MapPinIcon className="h-4 w-4" />
              <span className="truncate">{listing.location.city}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <EyeIcon className="h-4 w-4" />
              <span>{listing.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <HeartIcon className="h-4 w-4" />
              <span>{listing.favorites}</span>
            </div>
          </div>
        </div>

        {/* Time */}
        <div className="mt-2 text-xs text-gray-400">
          {formatDistanceToNow(new Date(listing.createdAt), {
            addSuffix: true,
            locale,
          })}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
