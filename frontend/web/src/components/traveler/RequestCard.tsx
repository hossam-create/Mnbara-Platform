// ============================================
// 📦 Request Card - Delivery Opportunity Card
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import type { TravelerRequest } from '../../services/traveler.service';

interface RequestCardProps {
  request: TravelerRequest;
  onOfferSubmit: (requestId: string) => void;
  className?: string;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, onOfferSubmit, className = '' }) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrustColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDistance = (km: number) => {
    if (km < 1) return '<1 km';
    if (km < 1000) return `${km} km`;
    return `${(km / 1000).toFixed(1)}k km`;
  };

  const daysUntilExpiry = Math.ceil(
    (new Date(request.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow ${className}`}>
      {/* Header with urgency badge */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
            {request.urgency.toUpperCase()}
          </span>
          <span className="text-sm text-gray-500">
            Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-400">⭐</span>
          <span className={`text-sm font-medium ${getTrustColor(request.buyerTrustScore)}`}>
            {request.buyerTrustScore}%
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Product Info */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
            {request.productName}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {request.productDescription}
          </p>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Max budget:</span>
            <span className="font-semibold text-gray-900">${request.maxPrice}</span>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">From:</span>
            <span className="font-medium text-gray-900">{request.originCountry}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Distance:</span>
            <span className="font-medium text-gray-900">{formatDistance(request.distanceKm)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Reward:</span>
            <span className="font-bold text-green-600">${request.deliveryReward}</span>
          </div>
        </div>

        {/* Buyer Info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {request.buyer.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {request.buyer.fullName}
              </span>
              {request.buyer.kycVerified && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Verified
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>⭐ {request.buyer.rating}</span>
              <span>•</span>
              <span>{request.buyer.totalReviews} reviews</span>
            </div>
          </div>
        </div>

        {/* Match Score */}
        {request.matchScore && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Match score:</span>
              <span className="font-medium text-gray-900">{request.matchScore}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${request.matchScore}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link
            to={`/traveler/requests/${request.id}`}
            className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-center"
          >
            View Details
          </Link>
          
          <button
            onClick={() => onOfferSubmit(request.id)}
            className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            disabled={!request.buyer.kycVerified}
          >
            Submit Offer
          </button>
        </div>

        {/* Warning for unverified buyers */}
        {!request.buyer.kycVerified && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            ⚠️ Buyer not verified. Proceed with caution.
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestCard;