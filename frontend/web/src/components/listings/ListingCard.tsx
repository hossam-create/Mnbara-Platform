import React from 'react';
import { Link } from 'react-router-dom';

export interface ListingCardProps {
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
}

const ListingCard: React.FC<ListingCardProps> = ({
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
}) => {
  const discount = originalPrice 
    ? Math.round(((originalPrice - price) / originalPrice) * 100) 
    : 0;

  return (
    <Link to={`/listing/${id}`}>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        {/* Image */}
        <div className="relative">
          <img
            src={image}
            alt={title}
            className="w-full h-48 object-cover"
          />
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
              -{discount}%
            </div>
          )}
          <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
            {timeLeft}
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          {/* Price */}
          <div className="flex items-center mb-2">
            <span className="text-lg sm:text-xl font-bold text-gray-900">
              ${price.toFixed(2)}
            </span>
            {originalPrice && (
              <span className="ml-2 text-xs sm:text-sm text-gray-500 line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 line-clamp-2">
            {title}
          </h3>

          {/* Condition */}
          <div className="flex items-center mb-2">
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {condition}
            </span>
          </div>

          {/* Seller Info */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-xs text-gray-600">by </span>
              <span className="text-xs text-blue-600 ml-1">{seller}</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-yellow-500">★</span>
              <span className="text-xs text-gray-600 ml-1">
                {rating} ({reviews})
              </span>
            </div>
          </div>

          {/* Shipping */}
          <div className="text-xs text-gray-600">
            {shipping}
          </div>

          {/* Action Button */}
          <button className="w-full mt-3 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium">
            Buy Now
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;