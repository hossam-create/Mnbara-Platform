import React from 'react';
import Link from 'next/link';

const categories = [
  {
    id: 'electronics',
    name: 'Electronics',
    icon: '📱',
    color: 'bg-blue-100',
  },
  {
    id: 'fashion',
    name: 'Fashion',
    icon: '👕',
    color: 'bg-pink-100',
  },
  {
    id: 'home',
    name: 'Home',
    icon: '🏠',
    color: 'bg-green-100',
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: '⚽',
    color: 'bg-orange-100',
  },
  {
    id: 'collectibles',
    name: 'Collectibles',
    icon: '🎨',
    color: 'bg-purple-100',
  },
  {
    id: 'vehicles',
    name: 'Vehicles',
    icon: '🚗',
    color: 'bg-red-100',
  },
];

const CategoryGrid: React.FC = () => {
  return (
    <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Shop by Category
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.id}`}
                className="block p-3 sm:p-4 text-center rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 sm:w-16 sm:h-16 ${category.color} rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3`}>
                  <span className="text-xl sm:text-2xl">{category.icon}</span>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
  );
};

export default CategoryGrid;