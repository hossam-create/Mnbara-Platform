/**
 * FULFILLMENT OPTIONS DEMO PAGE
 * Example usage of the FulfillmentSelector component
 */

import React from 'react';
import FulfillmentSelector from '../components/fulfillment/FulfillmentSelector';

const FulfillmentDemoPage: React.FC = () => {
  // Mock cart data
  const mockProducts = [
    {
      id: 'prod-glass-vase',
      name: 'Handcrafted Glass Vase',
      productType: 'fragile' as const,
      warehouseDistanceKm: 200,
      price: 15000, // 150.00 EGP
      image: 'https://example.com/vase.jpg'
    },
    {
      id: 'prod-furniture-sofa',
      name: 'Modern Leather Sofa',
      productType: 'oversized' as const,
      warehouseDistanceKm: 600,
      price: 250000, // 2500.00 EGP
      image: 'https://example.com/sofa.jpg'
    },
    {
      id: 'prod-book',
      name: 'Programming Book Collection',
      productType: 'standard' as const,
      warehouseDistanceKm: 50,
      price: 8000, // 80.00 EGP
      image: 'https://example.com/books.jpg'
    }
  ];

  const handleFulfillmentChange = (method: string) => {
    console.log('Fulfillment method selected:', method);
    // In production, update cart state, trigger analytics, etc.
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Checkout - Fulfillment Options
          </h1>
          <p className="text-gray-600">
            Choose how you'd like to receive your order
          </p>
        </div>

        {/* Cart Summary */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Your Cart ({mockProducts.length} items)
          </h2>
          <div className="space-y-3">
            {mockProducts.map(product => (
              <div key={product.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">
                      {product.productType === 'fragile' ? '🏺' : 
                       product.productType === 'oversized' ? '🛋️' : '📚'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-500">
                      {product.productType} • {product.warehouseDistanceKm}km from hub
                    </p>
                  </div>
                </div>
                <p className="font-bold text-gray-900">
                  {(product.price / 100).toFixed(2)} EGP
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t-2 border-gray-200 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-800">Total</span>
            <span className="text-2xl font-bold text-blue-600">
              {(mockProducts.reduce((sum, p) => sum + p.price, 0) / 100).toFixed(2)} EGP
            </span>
          </div>
        </div>

        {/* Fulfillment Selector */}
        <FulfillmentSelector
          products={mockProducts}
          userLocation={{
            city: 'Cairo',
            zipCode: '11511',
            storeName: 'MNbarh Cairo Center',
            storeAddress: 'Downtown Cairo, Egypt'
          }}
          onFulfillmentChange={handleFulfillmentChange}
        />

        {/* Additional Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                About Pickup Preparation Periods
              </h3>
              <p className="text-sm text-blue-800">
                Pickup orders require products to be shipped from our warehouse to your selected pickup hub. 
                The preparation period depends on product type (fragile items need extra care) and warehouse distance. 
                Your pickup will be ready when all items arrive at the hub.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-300 transition">
            ← Back to Cart
          </button>
          <button className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">
            Continue to Payment →
          </button>
        </div>
      </div>
    </div>
  );
};

export default FulfillmentDemoPage;
