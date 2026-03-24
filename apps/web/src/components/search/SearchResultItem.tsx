import { Link } from 'react-router-dom';

/**
 * Search Result Item - Mnbara marketplace product card
 * 
 * Structure (left to right):
 * - Thumbnail image
 * - Product details (title, condition, seller, shipping)
 * - Price and actions (watchlist icon)
 */

// Heart/Watchlist Icon
const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg 
    className={`w-5 h-5 ${filled ? 'text-[#e53238] fill-current' : 'text-gray-400'}`}
    fill={filled ? 'currentColor' : 'none'} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={1.5} 
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
    />
  </svg>
);

// Star Rating Display
function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg 
          key={i} 
          className={`w-3 h-3 ${i < fullStars || (i === fullStars && hasHalfStar) ? 'text-[#e53238]' : 'text-gray-300'}`}
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export interface SearchResultItemProps {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  condition: 'New' | 'Used' | 'Refurbished' | 'Open Box' | 'Certified Refurbished';
  shipping: string;
  shippingPrice?: number;
  freeReturns?: boolean;
  sellerName: string;
  sellerRating: number;
  sellerReviews: number;
  sellerTopRated?: boolean;
  itemsSold?: number;
  watchers?: number;
  endTime?: string;
  isBestOffer?: boolean;
  isAuction?: boolean;
  bidCount?: number;
}

export default function SearchResultItem({
  id,
  title,
  price,
  originalPrice,
  image,
  condition,
  shippingPrice = 0,
  freeReturns = false,
  sellerName,
  sellerRating,
  sellerReviews,
  sellerTopRated = false,
  itemsSold,
  watchers,
  isBestOffer = false,
  isAuction = false,
  bidCount,
}: SearchResultItemProps) {
  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

  return (
    <article className="flex gap-4 py-4 border-b border-gray-200 group">
      {/* Thumbnail */}
      <div className="flex-shrink-0 relative">
        <Link to={`/product/${id}`}>
          <div className="w-[200px] h-[200px] bg-gray-100 rounded overflow-hidden">
            <img 
              src={image} 
              alt={title}
              className="w-full h-full object-contain hover:scale-105 transition-transform"
            />
          </div>
        </Link>
        {/* Watchlist Button */}
        <button 
          className="absolute top-2 left-2 p-1.5 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow opacity-0 group-hover:opacity-100"
          aria-label="Add to Watchlist"
        >
          <HeartIcon />
        </button>
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <h3 className="mb-1">
          <Link 
            to={`/product/${id}`}
            className="text-brand-blue hover:underline font-normal text-base line-clamp-2"
          >
            {title}
          </Link>
        </h3>

        {/* Condition */}
        <p className="text-sm text-gray-600 mb-1">
          {condition}
          {itemsSold && <span className="text-gray-500"> · {itemsSold.toLocaleString()} sold</span>}
          {watchers && <span className="text-gray-500"> · {watchers} watchers</span>}
        </p>

        {/* Seller Info */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-gray-600">{sellerName}</span>
          <div className="flex items-center gap-1">
            <StarRating rating={sellerRating} />
            <span className="text-xs text-gray-500">({sellerReviews.toLocaleString()})</span>
          </div>
          {sellerTopRated && (
            <span className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">Top Rated Seller</span>
          )}
        </div>

        {/* Shipping & Returns */}
        <div className="text-sm text-gray-600">
          {shippingPrice === 0 ? (
            <span className="text-green-600 font-medium">Free shipping</span>
          ) : (
            <span>+${shippingPrice.toFixed(2)} shipping</span>
          )}
          {freeReturns && <span className="ml-2">· Free returns</span>}
        </div>
      </div>

      {/* Price Column */}
      <div className="flex-shrink-0 w-[140px] text-right">
        {/* Price */}
        <div className="mb-1">
          {isAuction ? (
            <>
              <p className="text-lg font-bold text-gray-900">${price.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{bidCount} bids</p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-gray-900">${price.toFixed(2)}</p>
              {originalPrice && discount > 0 && (
                <div className="flex items-center justify-end gap-1">
                  <span className="text-xs text-gray-500 line-through">${originalPrice.toFixed(2)}</span>
                  <span className="text-xs text-green-600 font-medium">{discount}% off</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Shipping Price */}
        <p className="text-sm text-gray-600 mb-2">
          {shippingPrice === 0 ? 'Free shipping' : `+$${shippingPrice.toFixed(2)} shipping`}
        </p>

        {/* Best Offer */}
        {isBestOffer && (
          <p className="text-sm text-gray-600 mb-2">or Best Offer</p>
        )}

        {/* Buy It Now Button */}
        {!isAuction && (
          <Link
            to={`/product/${id}`}
            className="block w-full py-2 text-center text-sm font-medium text-white bg-brand-blue rounded-full hover:bg-brand-blueDark transition-colors"
          >
            Buy It Now
          </Link>
        )}

        {isAuction && (
          <Link
            to={`/product/${id}`}
            className="block w-full py-2 text-center text-sm font-medium text-brand-blue border border-brand-blue rounded-full hover:bg-brand-blue hover:text-white transition-colors"
          >
            Place bid
          </Link>
        )}
      </div>
    </article>
  );
}
