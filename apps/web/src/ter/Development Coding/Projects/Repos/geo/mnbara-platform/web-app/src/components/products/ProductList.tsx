import React, { useState, useCallback } from 'react';
import { ProductGrid } from './ProductGrid';
import { Button } from '../core/Button';
import { Product, ProductFilters, ProductSortOption } from '../../types/product';
import './ProductList.css';

export interface ProductListProps {
  initialProducts?: Product[];
  initialFilters?: ProductFilters;
  onLoadMore?: (filters: ProductFilters) => Promise<Product[]>;
  onFilterChange?: (filters: ProductFilters) => void;
  totalCount?: number;
  loading?: boolean;
  hasMore?: boolean;
}

export const ProductList: React.FC<ProductListProps> = ({
  initialProducts = [],
  initialFilters = {},
  onLoadMore,
  onFilterChange,
  totalCount = 0,
  loading = false,
  hasMore = false,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [sortBy, setSortBy] = useState<ProductSortOption>(ProductSortOption.NEWEST);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [page, setPage] = useState(1);

  const handleSortChange = useCallback((newSort: ProductSortOption) => {
    setSortBy(newSort);
    const newFilters = { ...filters, sortBy: newSort, page: 1 };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  }, [filters, onFilterChange]);

  const handleLoadMore = useCallback(async () => {
    if (onLoadMore) {
      const nextPage = page + 1;
      const newFilters = { ...filters, page: nextPage };
      const newProducts = await onLoadMore(newFilters);
      setProducts([...products, ...newProducts]);
      setPage(nextPage);
    }
  }, [page, filters, products, onLoadMore]);

  const handleFavorite = useCallback((productId: string) => {
    // Toggle favorite status
    setProducts(products.map(p => 
      p.id === productId ? { ...p, isFavorite: !p.isFavorite } : p
    ));
  }, [products]);

  const handleQuickView = useCallback((product: Product) => {
    // Open quick view modal or navigate to product detail
    console.log('Quick view:', product.id);
  }, []);

  const handleBid = useCallback((product: Product) => {
    // Open bid modal
    console.log('Bid on:', product.id);
  }, []);

  const handleBuyNow = useCallback((product: Product) => {
    // Add to cart or navigate to checkout
    console.log('Buy now:', product.id);
  }, []);

  return (
    <div className="mnbara-product-list">
      <div className="mnbara-product-list__header">
        <div className="mnbara-product-list__results">
          {totalCount > 0 && (
            <span>{totalCount.toLocaleString()} results</span>
          )}
        </div>
        
        <div className="mnbara-product-list__controls">
          <div className="mnbara-product-list__sort">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as ProductSortOption)}
              className="mnbara-product-list__sort-select"
            >
              <option value={ProductSortOption.NEWEST}>Newest First</option>
              <option value={ProductSortOption.PRICE_LOW_HIGH}>Price: Low to High</option>
              <option value={ProductSortOption.PRICE_HIGH_LOW}>Price: High to Low</option>
              <option value={ProductSortOption.MOST_BIDS}>Most Bids</option>
              <option value={ProductSortOption.ENDING_SOON}>Ending Soon</option>
              <option value={ProductSortOption.BEST_MATCH}>Best Match</option>
            </select>
          </div>
          
          <div className="mnbara-product-list__view-toggle">
            <button
              className={`mnbara-product-list__view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button
              className={`mnbara-product-list__view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="4" width="18" height="4" rx="1" />
                <rect x="3" y="10" width="18" height="4" rx="1" />
                <rect x="3" y="16" width="18" height="4" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <ProductGrid
        products={products}
        loading={loading}
        viewMode={viewMode}
        onFavorite={handleFavorite}
        onQuickView={handleQuickView}
        onBid={handleBid}
        onBuyNow={handleBuyNow}
      />

      {hasMore && (
        <div className="mnbara-product-list__load-more">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            loading={loading}
          >
            Load More Products
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductList;
