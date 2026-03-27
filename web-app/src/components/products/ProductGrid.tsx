import React from 'react';
import { ProductCard } from './ProductCard';
import type { Product } from '../../types/product';
import './ProductGrid.css';

export interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  viewMode?: 'grid' | 'list';
  onFavorite?: (productId: string) => void;
  onQuickView?: (product: Product) => void;
  onBid?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  emptyMessage?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  viewMode = 'grid',
  onFavorite,
  onQuickView,
  onBid,
  onBuyNow,
  emptyMessage = 'No products found',
}) => {
  if (loading) {
    return (
      <div className={`mnbara-product-grid mnbara-product-grid--${viewMode} mnbara-product-grid--loading`}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="mnbara-product-grid__skeleton">
            <div className="mnbara-product-grid__skeleton-image" />
            <div className="mnbara-product-grid__skeleton-text" />
            <div className="mnbara-product-grid__skeleton-text mnbara-product-grid__skeleton-text--short" />
            <div className="mnbara-product-grid__skeleton-button" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mnbara-product-grid__empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <h3>{emptyMessage}</h3>
        <p>Try adjusting your search or filters to find what you're looking for.</p>
      </div>
    );
  }

  return (
    <div className={`mnbara-product-grid mnbara-product-grid--${viewMode}`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          viewMode={viewMode}
          onFavorite={onFavorite}
          onQuickView={onQuickView}
          onBid={onBid}
          onBuyNow={onBuyNow}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
