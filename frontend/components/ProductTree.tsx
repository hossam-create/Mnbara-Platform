'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, Search, Filter, Globe } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  level: number;
  productCount: number;
  isLeaf: boolean;
  children?: Category[];
}

interface Product {
  id: string;
  title: string;
  titleAr: string;
  price: number;
  currency: string;
  originCountry: string;
  purchaseCountry: string;
  deliveryCountry: string;
  condition: string;
  status: string;
  seller: {
    id: string;
    name: string;
    email: string;
  };
  images: Array<{
    id: string;
    url: string;
    thumbnailUrl: string;
    isPrimary: boolean;
  }>;
}

interface ProductTreeProps {
  onProductClick?: (product: Product) => void;
}

export const ProductTree: React.FC<ProductTreeProps> = ({ onProductClick }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState<string>('');
  const [filterSeller, setFilterSeller] = useState<string>('');
  const [countries, setCountries] = useState<string[]>([]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch products when category is selected or filters change
  useEffect(() => {
    if (selectedCategory) {
      fetchProducts(selectedCategory);
    }
  }, [selectedCategory, filterCountry, filterSeller]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products/tree');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
        // Extract unique countries from categories
        const allCountries = new Set<string>();
        data.data.forEach((cat: Category) => {
          if (cat.children) {
            cat.children.forEach((child: Category) => {
              if (child.children) {
                child.children.forEach((subChild: Category) => {
                  // Countries will be extracted from products
                });
              }
            });
          }
        });
        setCountries(['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'SA', 'AE', 'EG', 'JO']);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (categoryId: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCountry) params.append('country', filterCountry);
      if (filterSeller) params.append('seller', filterSeller);

      const response = await fetch(`/api/products/tree/${categoryId}/products?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.data.products);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category.id);
    if (!category.isLeaf && category.children) {
      toggleCategory(category.id);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('query', searchQuery);
      if (filterCountry) params.append('country', filterCountry);

      const response = await fetch(`/api/products/tree/search?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.data.products || []);
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error('Failed to search:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategory === category.id;

    return (
      <div key={category.id} className="select-none">
        <div
          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
            isSelected ? 'bg-yellow-500 text-black' : 'hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleCategoryClick(category)}
        >
          {!category.isLeaf && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory(category.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          <span className="flex-1">{category.name}</span>
          <span className="text-xs text-gray-500">({category.productCount})</span>
        </div>

        {isExpanded && category.children && category.children.length > 0 && (
          <div className="ml-2">
            {category.children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderProduct = (product: Product) => (
    <div
      key={product.id}
      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onProductClick?.(product)}
    >
      <div className="flex gap-4">
        {product.images.length > 0 && (
          <img
            src={product.images.find(img => img.isPrimary)?.thumbnailUrl || product.images[0].thumbnailUrl}
            alt={product.title}
            className="w-24 h-24 object-cover rounded"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{product.title}</h3>
          <p className="text-gray-600 text-sm">{product.titleAr}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xl font-bold text-yellow-600">
              ${product.price.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500">{product.condition}</span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <div className="flex items-center gap-1" title="Origin Country">
              <Globe className="w-4 h-4 text-gray-500" />
              <span>{product.originCountry}</span>
            </div>
            <div className="flex items-center gap-1" title="Purchase Country">
              <Globe className="w-4 h-4 text-blue-500" />
              <span>{product.purchaseCountry}</span>
            </div>
            <div className="flex items-center gap-1" title="Delivery Country">
              <Globe className="w-4 h-4 text-green-500" />
              <span>{product.deliveryCountry}</span>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <span>Seller: {product.seller.name}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - Categories */}
      <div className="w-80 border-r overflow-y-auto bg-gray-50">
        <div className="p-4 border-b bg-white sticky top-0 z-10">
          <h2 className="text-lg font-bold mb-4">Categories</h2>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">All Countries</option>
                {countries.map(country => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="p-2">
          {loading && categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Loading categories...</div>
          ) : (
            categories.map(category => renderCategory(category))
          )}
        </div>
      </div>

      {/* Main Content - Products */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              {selectedCategory ? 'Products' : 'Search Results'} ({products.length})
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <input
                type="text"
                placeholder="Filter by seller..."
                value={filterSeller}
                onChange={(e) => setFilterSeller(e.target.value)}
                className="px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {selectedCategory
                ? 'No products found in this category'
                : 'Search for products or select a category'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => renderProduct(product))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductTree;
