import React from 'react';
import Link from 'next/link';

const categories = [
  {
    id: 'electronics',
    name: 'Electronics',
    nameAr: 'إلكترونيات',
    icon: '📱',
    color: 'bg-blue-100',
    ebayStyle: true
  },
  {
    id: 'fashion',
    name: 'Fashion',
    nameAr: 'أزياء',
    icon: '👕',
    color: 'bg-pink-100',
    ebayStyle: true
  },
  {
    id: 'home',
    name: 'Home & Garden',
    nameAr: 'منزل وحديقة',
    icon: '🏠',
    color: 'bg-green-100',
    ebayStyle: true
  },
  {
    id: 'sports',
    name: 'Sports',
    nameAr: 'رياضة',
    icon: '⚽',
    color: 'bg-orange-100',
    ebayStyle: true
  },
  {
    id: 'collectibles',
    name: 'Collectibles',
    nameAr: 'مقتنيات',
    icon: '🎨',
    color: 'bg-purple-100',
    ebayStyle: true
  },
  {
    id: 'vehicles',
    name: 'Vehicles',
    nameAr: 'مركبات',
    icon: '🚗',
    color: 'bg-red-100',
    ebayStyle: true
  },
  {
    id: 'beauty',
    name: 'Beauty',
    nameAr: 'جمال',
    icon: '💄',
    color: 'bg-pink-100',
    ebayStyle: true
  },
  {
    id: 'books',
    name: 'Books & Media',
    nameAr: 'كتب ووسائط',
    icon: '📚',
    color: 'bg-yellow-100',
    ebayStyle: true
  },
  {
    id: 'toys',
    name: 'Toys & Games',
    nameAr: 'ألعاب',
    icon: '🎮',
    color: 'bg-red-100',
    ebayStyle: true
  },
  {
    id: 'jewelry',
    name: 'Jewelry',
    nameAr: 'مجوهرات',
    icon: '💎',
    color: 'bg-purple-100',
    ebayStyle: true
  },
  {
    id: 'tools',
    name: 'Tools',
    nameAr: 'أدوات',
    icon: '🛠️',
    color: 'bg-gray-100',
    ebayStyle: true
  },
  {
    id: 'health',
    name: 'Health',
    nameAr: 'صحة',
    icon: '🏥',
    color: 'bg-green-100',
    ebayStyle: true
  },
];

const CategoryGrid: React.FC = () => {
  return (
    <section className="bg-white py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Shop by Category
        </h2>
        <p className="text-gray-600 text-center mb-8">
          اكتشف أفضل الفئات المتاحة
        </p>
        
        {/* eBay Style Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.id}`}
              className="group block p-4 text-center rounded-xl border-2 border-gray-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105"
            >
              {/* eBay Style Icon Container */}
              <div className={`w-16 h-16 ${category.color} rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-50 transition-colors duration-300`}>
                <span className="text-2xl">{category.icon}</span>
              </div>
              
              {/* Category Name - Bilingual */}
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-900 block">
                  {category.name}
                </span>
                <span className="text-xs text-gray-600 block font-arabic">
                  {category.nameAr}
                </span>
              </div>
              
              {/* Hover Effect - eBay Style */}
              <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300" />
            </Link>
          ))}
        </div>

        {/* View All Categories Button - eBay Style */}
        <div className="text-center mt-8">
          <Link
            href="/categories"
            className="inline-flex items-center px-6 py-3 border-2 border-blue-500 text-blue-600 font-semibold rounded-lg hover:bg-blue-500 hover:text-white transition-all duration-200"
          >
            عرض جميع الفئات
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;