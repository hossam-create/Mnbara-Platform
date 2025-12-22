import { Suspense } from 'react';
import Link from 'next/link';

// Placeholder data - will be replaced with API calls
const MOCK_LISTINGS = [
  { id: '1', title: 'iPhone 15 Pro Max', origin: 'USA', destination: 'Egypt', price: 1199, image: null },
  { id: '2', title: 'Nike Air Jordan 1', origin: 'USA', destination: 'UAE', price: 180, image: null },
  { id: '3', title: 'PlayStation 5', origin: 'USA', destination: 'Saudi Arabia', price: 499, image: null },
  { id: '4', title: 'MacBook Pro 14"', origin: 'USA', destination: 'Egypt', price: 1999, image: null },
  { id: '5', title: 'Dyson Airwrap', origin: 'UK', destination: 'UAE', price: 599, image: null },
  { id: '6', title: 'Lego Star Wars Set', origin: 'Germany', destination: 'Egypt', price: 299, image: null },
];

function SearchFilters() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>
      
      {/* Origin */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Origin Country
        </label>
        <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All Countries</option>
          <option value="US">United States</option>
          <option value="UK">United Kingdom</option>
          <option value="DE">Germany</option>
        </select>
      </div>

      {/* Destination */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Destination
        </label>
        <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All Destinations</option>
          <option value="EG">Egypt</option>
          <option value="AE">UAE</option>
          <option value="SA">Saudi Arabia</option>
        </select>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price Range
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Category */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="fashion">Fashion</option>
          <option value="toys">Toys & Games</option>
          <option value="beauty">Beauty</option>
        </select>
      </div>

      <button className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
        Apply Filters
      </button>
    </div>
  );
}

function ListingCard({ listing }: { listing: typeof MOCK_LISTINGS[0] }) {
  return (
    <Link href={`/listing/${listing.id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
        {/* Image placeholder */}
        <div className="aspect-square bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-sm">No Image</span>
        </div>
        
        <div className="p-4">
          <h3 className="font-medium text-gray-900 mb-1 truncate">
            {listing.title}
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            {listing.origin} → {listing.destination}
          </p>
          <p className="text-lg font-semibold text-primary-600">
            ${listing.price}
          </p>
        </div>
      </div>
    </Link>
  );
}

function SearchResults() {
  // TODO: Replace with API call using useRequests hook
  const listings = MOCK_LISTINGS;
  const isLoading = false;
  const isEmpty = listings.length === 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="aspect-square loading-skeleton" />
            <div className="p-4 space-y-2">
              <div className="h-5 loading-skeleton w-3/4" />
              <div className="h-4 loading-skeleton w-1/2" />
              <div className="h-6 loading-skeleton w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="empty-state">
        <p className="text-lg">No listings found</p>
        <p className="text-sm mt-2">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Browse Listings</h1>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search for items..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button className="bg-primary-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-primary-700">
            Search
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <SearchFilters />
        </aside>

        {/* Results */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-gray-600">
              Showing {MOCK_LISTINGS.length} results
            </p>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option>Sort by: Newest</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>

          <Suspense fallback={<div className="loading-skeleton h-96" />}>
            <SearchResults />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
