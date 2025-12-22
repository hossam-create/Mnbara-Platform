import React from 'react';
import RiskIndicator from './RiskIndicator';

interface TrustScore {
  overall: number;
  seller: number;
  product: number;
  delivery: number;
}

interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'very_high';
  score: number;
}

interface TrustListingCardProps {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  condition: string;
  seller: string;
  rating: number;
  reviews: number;
  shipping: string;
  timeLeft: string;
  trustScore: TrustScore;
  riskAssessment: RiskAssessment;
  verifiedSeller?: boolean;
  className?: string;
  onClick?: () => void;
}

const TrustListingCard: React.FC<TrustListingCardProps> = ({
  id,
  title,
  price,
  originalPrice,
  image,
  condition,
  seller,
  rating,
  reviews,
  shipping,
  timeLeft,
  trustScore,
  riskAssessment,
  verifiedSeller = false,
  className = '',
  onClick,
}) => {
  const discount = originalPrice 
    ? Math.round(((originalPrice - price) / originalPrice) * 100) 
    : 0;

  const getTrustColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTrustIcon = (score: number) => {
    if (score >= 90) return '🛡️';
    if (score >= 70) return '✅';
    if (score >= 50) return '⚠️';
    return '❌';
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* Image with badges */}
      <div className="relative">
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover"
        />
        
        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            -{discount}%
          </div>
        )}
        
        {/* Time badge */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
          {timeLeft}
        </div>
        
        {/* Trust score overlay */}
        <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 rounded-lg px-2 py-1">
          <div className="flex items-center space-x-1">
            <span className="text-xs">{getTrustIcon(trustScore.overall)}</span>
            <span className={`text-xs font-bold ${getTrustColor(trustScore.overall)}`}>
              {trustScore.overall}%
            </span>
          </div>
        </div>
        
        {/* Risk indicator */}
        <div className="absolute bottom-2 right-2">
          <RiskIndicator
            level={riskAssessment.level}
            score={riskAssessment.score}
            size="sm"
            showLabel={false}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Price and trust */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-xl font-bold text-gray-900">
              ${price.toFixed(2)}
            </span>
            {originalPrice && (
              <span className="ml-2 text-sm text-gray-500 line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {verifiedSeller && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                ✅ Verified
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
          {title}
        </h3>

        {/* Condition and seller info */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {condition}
          </span>
          
          <div className="flex items-center">
            <span className="text-xs text-yellow-500">★</span>
            <span className="text-xs text-gray-600 ml-1">
              {rating} ({reviews})
            </span>
          </div>
        </div>

        {/* Seller info */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-xs text-gray-600">by </span>
            <span className="text-xs text-blue-600 ml-1">{seller}</span>
          </div>
          
          {/* Mini trust breakdown */}
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <span title="Seller trust">S: {trustScore.seller}%</span>
            <span title="Product trust">P: {trustScore.product}%</span>
            <span title="Delivery trust">D: {trustScore.delivery}%</span>
          </div>
        </div>

        {/* Shipping */}
        <div className="text-xs text-gray-600 mb-3">
          {shipping}
        </div>

        {/* Action Button */}
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium">
          Buy Now
        </button>

        {/* Trust summary */}
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Trust score: {trustScore.overall}%</span>
            <RiskIndicator
              level={riskAssessment.level}
              score={riskAssessment.score}
              size="sm"
              showLabel={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustListingCard;