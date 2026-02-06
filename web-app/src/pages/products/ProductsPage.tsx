import React, { useState, useCallback } from 'react';
import { ProductList } from '../../components/products/ProductList';
import { ProductFilters } from '../../components/products/ProductFilters';
import { ProductSearch } from '../../components/products/ProductSearch';
import type { Product, ProductCategory, ProductFilters as IProductFilters } from '../../types/product';
import './ProductsPage.css';

// Mock categories for demonstration
const mockCategories: ProductCategory[] = [
  { id: '1', name: 'Electronics', slug: 'electronics' },
  { id: '2', name: 'Fashion', slug: 'fashion' },
  { id: '3', name: 'Home & Garden', slug: 'home-garden' },
  { id: '4', name: 'Sports', slug: 'sports' },
  { id: '5', name: 'Collectibles', slug: 'collectibles' },
];

// Mock products for demonstration
const mockProducts: Product[] = [
  {
    id: '1',
    title: 'iPhone 15 Pro Max - 256GB - Titanium',
    slug: 'iphone-15-pro-max',
    description: 'Brand new iPhone 15 Pro Max with 256GB storage in Titanium finish.',
    shortDescription: 'Latest iPhone with 256GB storage',
    price: 1199,
    currency: 'USD',
    condition: 'new',
    status: 'active',
    categoryId: '1',
    sellerId: 's1',
    seller: {
      id: 's1',
      name: 'Apple Store',
      rating: 4.9,
      reviewCount: 1250,
      verified: true,
      memberSince: '2020-01-01',
    },
    images: [
      { id: 'img1', url: '/images/placeholder.jpg', thumbnailUrl: '/images/placeholder.jpg', isPrimary: true, sortOrder: 0 },
    ],
    location: { country: 'USA', city: 'New York' },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    viewCount: 1500,
    favoriteCount: 89,
    isFavorite: false,
    hasBuyItNow: true,
    buyItNowPrice: 1199,
    allowsOffers: true,
  },
  {
    id: '2',
    title: 'Vintage Rolex Submariner Watch',
    slug: 'vintage-rolex-submariner',
    description: 'Authentic vintage Rolex Submariner from 1975.',
    shortDescription: 'Rare vintage Rolex Submariner',
    price: 15000,
    currency: 'USD',
    condition: 'good',
    status: 'active',
    categoryId: '5',
    sellerId: 's2',
    seller: {
      id: 's2',
      name: 'Luxury Watches',
      rating: 4.8,
      reviewCount: 450,
      verified: true,
      memberSince: '2019-05-01',
    },
    images: [
      { id: 'img2', url: '/images/placeholder.jpg', thumbnailUrl: '/images/placeholder.jpg', isPrimary: true, sortOrder: 0 },
    ],
    location: { country: 'USA', city: 'Los Angeles' },
    createdAt: '2024-01-14T10:00:00Z',
    updatedAt: '2024-01-14T10:00:00Z',
    viewCount: 2300,
    favoriteCount: 156,
    isFavorite: true,
    auction: {
      id: 'auction1',
      productId: '2',
      startingPrice: 10000,
      currentPrice: 14500,
      reservePrice: 14000,
      hasReserve: true,
      startTime: '2024-01-10T10:00:00Z',
      endTime: '2024-01-20T10:00:00Z',
      status: 'active',
      bidCount: 12,
      bidIncrement: 250,
      watchersCount: 89,
      autoExtendEnabled: true,
      autoExtendMinutes: 5,
      extendThresholdMinutes: 5,
    },
    hasBuyItNow: false,
    allowsOffers: false,
  },
  {
    id: '3',
    title: 'MacBook Pro 16" M3 Max',
    slug: 'macbook-pro-16-m3-max',
    description: 'Latest MacBook Pro with M3 Max chip, 64GB RAM, 2TB SSD.',
    shortDescription: 'Powerful laptop for professionals',
    price: 3499,
    currency: 'USD',
    condition: 'new',
    status: 'active',
    categoryId: '1',
    sellerId: 's3',
    seller: {
      id: 's3',
      name: 'Tech Direct',
      rating: 4.7,
      reviewCount: 890,
      verified: true,
      memberSince: '2021-03-01',
    },
    images: [
      { id: 'img3', url: '/images/placeholder.jpg', thumbnailUrl: '/images/placeholder.jpg', isPrimary: true, sortOrder: 0 },
    ],
    location: { country: 'USA', city: 'San Francisco' },
    createdAt: '2024-01-13T10:00:00Z',
    updatedAt: '2024-01-13T10:00:00Z',
    viewCount: 980,
    favoriteCount: 67,
    isFavorite: false,
    hasBuyItNow: true,
    buyItNowPrice: 3499,
    allowsOffers: true,
  },
];

export const ProductsPage: React.FC = () => {
  const [products] = useState<Product[]>(mockProducts);
  const [filters, setFilters] = useState<IProductFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, query }));
  }, []);

  const handleFilterChange = useCallback((newFilters: IProductFilters) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return (
    <div className="mnbara-products-page">
      <div className="mnbara-products-page__header">
        <h1>All Products</h1>
        <ProductSearch
          onSearch={handleSearch}
          placeholder="Search products..."
        />
      </div>

      <div className="mnbara-products-page__content">
        <aside className={`mnbara-products-page__sidebar ${showFilters ? 'open' : ''}`}>
          <ProductFilters
            categories={mockCategories}
            selectedFilters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </aside>

        <main className="mnbara-products-page__main">
          <button
            className="mnbara-products-page__filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
            </svg>
            Filters
          </button>

          <ProductList
            initialProducts={products}
            initialFilters={filters}
            totalCount={products.length}
            onFilterChange={handleFilterChange}
          />
        </main>
      </div>
    </div>
  );
};

export default ProductsPage;
