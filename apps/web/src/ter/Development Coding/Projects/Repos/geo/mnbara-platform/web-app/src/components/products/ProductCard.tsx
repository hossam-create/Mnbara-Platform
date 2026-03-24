import React from 'react';
import { Card } from '../core/Card';
import { Button } from '../core/Button';
import type { Product } from '../../types/product';
import './ProductCard.css';

export interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  onFavorite?: (productId: string) => void;
  onQuickView?: (product: Product) => void;
  onBid?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  viewMode = 'grid',
  onFavorite,
  onQuickView,
  onBid,
  onBuyNow,
}) => {
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  const currentPrice = product.auction?.currentPrice || product.price;
  const timeLeft = product.auction ? getTimeRemaining(product.auction.endTime) : null;

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite?.(product.id);
  };

  return (
    <Card
      className={`mnbara-product-card mnbara-product-card--${viewMode}`}
      hoverable
      onClick={() => onQuickView?.(product)}
    >
      <div className="mnbara-product-card__image-container">
        {primaryImage ? (
          <img
            src={primaryImage.thumbnailUrl || primaryImage.url}
            alt={product.title}
            className="mnbara-product-card__image"
            loading="lazy"
          />
        ) : (
          <div className="mnbara-product-card__image-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
        
        <button
          className={`mnbara-product-card__favorite ${product.isFavorite ? 'active' : ''}`}
          onClick={handleFavorite}
          aria-label={product.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg viewBox="0 0 24 24" fill={product.isFavorite ? 'currentColor' : 'none'} stroke="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {product.auction && timeLeft && (
          <div className="mnbara-product-card__timer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{timeLeft}</span>
          </div>
        )}

        {product.condition && (
          <div className={`mnbara-product-card__condition mnbara-product-card__condition--${product.condition}`}>
            {formatCondition(product.condition)}
          </div>
        )}
      </div>

      <div className="mnbara-product-card__content">
        <div className="mnbara-product-card__category">
          {product.category?.name || 'Uncategorized'}
        </div>
        
        <h3 className="mnbara-product-card__title">{product.title}</h3>
        
        {product.shortDescription && (
          <p className="mnbara-product-card__description">{product.shortDescription}</p>
        )}

        <div className="mnbara-product-card__price-container">
          <div className="mnbara-product-card__current-price">
            <span className="mnbara-product-card__currency">{product.currency}</span>
            <span className="mnbara-product-card__amount">{currentPrice.toLocaleString()}</span>
          </div>
          
          {product.auction && (
            <div className="mnbara-product-card__bid-count">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2v20M2 12h20" />
              </svg>
              {product.auction.bidCount} bids
            </div>
          )}
        </div>

        {product.auction ? (
          <div className="mnbara-product-card__actions">
            <Button
              variant="primary"
              fullWidth
              onClick={(e) => {
                e.stopPropagation();
                onBid?.(product);
              }}
            >
              Place Bid
            </Button>
            {product.hasBuyItNow && product.buyItNowPrice && (
              <Button
                variant="success"
                fullWidth
                onClick={(e) => {
                  e.stopPropagation();
                  onBuyNow?.(product);
                }}
              >
                Buy Now - {product.currency}{product.buyItNowPrice.toLocaleString()}
              </Button>
            )}
          </div>
        ) : (
          <div className="mnbara-product-card__actions">
            <Button
              variant="primary"
              fullWidth
              onClick={(e) => {
                e.stopPropagation();
                onBuyNow?.(product);
              }}
            >
              {product.allowsOffers ? 'Buy or Make Offer' : 'Buy Now'}
            </Button>
          </div>
        )}

        {viewMode === 'list' && product.seller && (
          <div className="mnbara-product-card__seller">
            <img
              src={product.seller.avatar || '/images/default-avatar.png'}
              alt={product.seller.name}
              className="mnbara-product-card__seller-avatar"
            />
            <div className="mnbara-product-card__seller-info">
              <span className="mnbara-product-card__seller-name">
                {product.seller.name}
                {product.seller.verified && (
                  <svg className="mnbara-product-card__verified" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </span>
              <span className="mnbara-product-card__seller-rating">
                ★ {product.seller.rating.toFixed(1)} ({product.seller.reviewCount} reviews)
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// Utility function to format time remaining
function getTimeRemaining(endTime: string): string {
  const end = new Date(endTime).getTime();
  const now = new Date().getTime();
  const diff = end - now;

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// Utility function to format condition
function formatCondition(condition: string): string {
  return condition
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default ProductCard;
