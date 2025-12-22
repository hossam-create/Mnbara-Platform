// ============================================
// 🛍️ ProductCard Component - Premium Design
// ============================================

import { useState } from 'react';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  variant?: 'default' | 'compact' | 'featured';
}

export function ProductCard({
  product,
  onAddToCart,
  onAddToWishlist,
  onQuickView,
  variant = 'default',
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    onAddToWishlist?.(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  const getConditionBadge = () => {
    const badges: Record<string, { bg: string; text: string }> = {
      new: { bg: 'bg-green-100 text-green-700', text: 'New' },
      open_box: { bg: 'bg-blue-100 text-blue-700', text: 'Open Box' },
      used: { bg: 'bg-yellow-100 text-yellow-700', text: 'Used' },
      refurbished: { bg: 'bg-purple-100 text-purple-700', text: 'Refurbished' },
    };
    return badges[product.condition] || badges['new'];
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency || 'USD',
    }).format(price);
  };

  if (variant === 'compact') {
    return (
      <div className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
        <div className="flex">
          {/* Image */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <img
              src={product.images[0] || '/placeholder.jpg'}
              alt={product.name}
              className="w-full h-full object-cover"
              onLoad={() => setImageLoaded(true)}
            />
          </div>
          {/* Info */}
          <div className="flex-1 p-3">
            <h3 className="font-semibold text-sm text-gray-800 line-clamp-1">{product.name}</h3>
            <p className="text-lg font-bold text-gray-900 mt-1">{formatPrice(product.price)}</p>
            <div className="flex items-center mt-1">
              <span className="text-yellow-400">★</span>
              <span className="text-sm text-gray-600 ml-1">{product.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100 transform hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Loading Skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
        )}
        
        {/* Product Image */}
        <img
          src={product.images[0] || '/placeholder.jpg'}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {/* Condition Badge */}
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getConditionBadge().bg}`}>
            {getConditionBadge().text}
          </span>
          
          {/* Listing Type Badge */}
          {product.listingType === 'auction' && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white">
              🔨 Auction
            </span>
          )}
          
          {/* Featured Badge */}
          {variant === 'featured' && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white">
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg transform translate-x-12 group-hover:translate-x-0 transition-all duration-300 hover:scale-110"
        >
          <svg
            className={`w-5 h-5 transition-colors ${isWishlisted ? 'text-pink-500 fill-current' : 'text-gray-600'}`}
            fill={isWishlisted ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        {/* Quick View Button */}
        <button
          onClick={handleQuickView}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full font-semibold text-sm text-gray-800 shadow-lg transform translate-y-16 group-hover:translate-y-0 transition-all duration-300 hover:bg-white"
        >
          Quick View
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category */}
        <div className="text-xs font-medium text-pink-500 uppercase tracking-wide mb-1">
          {product.category.name}
        </div>

        {/* Title */}
        <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 group-hover:text-pink-500 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-4 h-4 ${star <= Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-200'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-gray-500">({product.totalReviews})</span>
        </div>

        {/* Location */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Ships from {product.originCountry}
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</span>
            {product.stock <= 5 && product.stock > 0 && (
              <span className="block text-xs text-orange-500 mt-1">Only {product.stock} left!</span>
            )}
          </div>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              onAddToCart?.(product);
            }}
            className="p-3 rounded-full bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
