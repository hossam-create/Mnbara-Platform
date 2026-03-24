import React from 'react';
import { Heart, Package } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout';

const SavedItemsPage: React.FC = () => {
  const items = [
    {
      id: '1',
      title: 'Apple iPhone 15 Pro Max 256GB',
      price: 1099.99,
      seller: 'techsuperstore',
    },
    {
      id: '2',
      title: 'AirPods Pro (2nd Gen)',
      price: 249.0,
      seller: 'premiumaudio',
    },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Saved Items</h1>
            <p className="mt-2 text-gray-600">Your bookmarked products</p>
          </div>

          {!items.length ? (
            <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
              <Heart className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <div className="text-lg font-semibold text-gray-900">No saved items</div>
              <div className="text-sm text-gray-600">Browse products and save the ones you like.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={`/product/${item.id}`}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                    <Package className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="font-medium text-gray-900 line-clamp-2">{item.title}</div>
                  <div className="text-sm text-gray-600 mt-1">Seller: {item.seller}</div>
                  <div className="text-lg font-bold text-gray-900 mt-2">${item.price.toFixed(2)}</div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default SavedItemsPage;
