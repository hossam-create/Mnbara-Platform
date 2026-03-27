import React from 'react';
import { useParams } from 'react-router-dom';
import { Star, MapPin, Package, Shield, CheckCircle, MessageSquare } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

const PublicSellerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const seller = {
    id,
    name: 'Premium Electronics Store',
    avatar: 'PE',
    rating: 4.8,
    totalReviews: 245,
    verified: true,
    memberSince: '2023-06-15',
    location: 'Dubai, UAE',
    totalSales: 1234,
    responseRate: 98,
    responseTime: '2h',
    description: 'Premium electronics retailer specializing in high-quality gadgets and accessories. All products come with manufacturer warranty and fast shipping.',
    categories: ['Electronics', 'Computers', 'Phones', 'Accessories']
  };

  const products = [
    { id: '1', name: 'iPhone 15 Pro Max', price: 1299, image: '', condition: 'New' },
    { id: '2', name: 'MacBook Pro M3', price: 2499, image: '', condition: 'New' },
    { id: '3', name: 'AirPods Pro 2', price: 249, image: '', condition: 'New' },
    { id: '4', name: 'Apple Watch Ultra', price: 799, image: '', condition: 'New' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
              {seller.avatar}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{seller.name}</h1>
                {seller.verified && (
                  <Badge variant="success" size="sm">Verified Seller</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-6 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-gray-900">{seller.rating}</span>
                  <span className="text-gray-600">({seller.totalReviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {seller.location}
                </div>
                <div className="text-sm text-gray-600">
                  Member since {new Date(seller.memberSince).toLocaleDateString()}
                </div>
              </div>

              <p className="text-gray-700 mb-4">{seller.description}</p>

              <div className="flex items-center gap-4">
                <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Contact Seller
                </button>
                <button className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                  Follow Store
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Total Sales</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{seller.totalSales}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Rating</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{seller.rating.toFixed(1)}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Response Rate</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{seller.responseRate}%</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Response Time</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{seller.responseTime}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {seller.categories.map((category) => (
              <Badge key={category} variant="secondary" size="md">{category}</Badge>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Products ({products.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                <div className="text-sm text-gray-600 mb-2">{product.condition}</div>
                <div className="font-bold text-gray-900">${product.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicSellerProfilePage;
