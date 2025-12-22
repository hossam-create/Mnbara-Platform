import React from 'react';
import ListingCard from './ListingCard';

const mockListings = [
  {
    id: '1',
    title: 'iPhone 13 Pro Max - 256GB - Like New',
    price: 899.99,
    originalPrice: 1099.99,
    image: '/api/placeholder/300/300',
    condition: 'Excellent',
    seller: 'tech_guru',
    rating: 4.8,
    reviews: 127,
    shipping: 'Free shipping',
    timeLeft: '2h 30m',
  },
  {
    id: '2',
    title: 'Nike Air Jordan 1 Retro High OG',
    price: 249.99,
    originalPrice: 170.00,
    image: '/api/placeholder/300/300',
    condition: 'New',
    seller: 'sneaker_head',
    rating: 4.9,
    reviews: 89,
    shipping: '+$9.99 shipping',
    timeLeft: '1d 5h',
  },
  {
    id: '3',
    title: 'Sony PlayStation 5 Digital Edition',
    price: 449.99,
    originalPrice: 399.99,
    image: '/api/placeholder/300/300',
    condition: 'Like New',
    seller: 'game_master',
    rating: 4.7,
    reviews: 203,
    shipping: 'Free shipping',
    timeLeft: '6h 45m',
  },
  {
    id: '4',
    title: 'Apple Watch Series 7 - 45mm GPS',
    price: 329.99,
    originalPrice: 429.00,
    image: '/api/placeholder/300/300',
    condition: 'Excellent',
    seller: 'watch_expert',
    rating: 4.8,
    reviews: 156,
    shipping: '+$4.99 shipping',
    timeLeft: '3h 20m',
  },
];

const FeaturedListings: React.FC = () => {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Featured Listings
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {mockListings.map((listing) => (
          <ListingCard key={listing.id} {...listing} />
        ))}
      </div>
      
      <div className="text-center mt-6 sm:mt-8">
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">
          View All Listings
        </button>
      </div>
    </section>
  );
};

export default FeaturedListings;