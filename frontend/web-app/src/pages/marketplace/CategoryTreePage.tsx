import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, Folder } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  children?: Category[];
  productCount?: number;
}

const CategoryTreePage: React.FC = () => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const categories: Category[] = [
    {
      id: '1',
      name: 'Electronics',
      slug: 'electronics',
      productCount: 15420,
      children: [
        {
          id: '1-1',
          name: 'Computers',
          slug: 'computers',
          productCount: 5230,
          children: [
            { id: '1-1-1', name: 'Laptops', slug: 'laptops', productCount: 2340 },
            { id: '1-1-2', name: 'Desktops', slug: 'desktops', productCount: 1890 },
            { id: '1-1-3', name: 'Tablets', slug: 'tablets', productCount: 1000 }
          ]
        },
        {
          id: '1-2',
          name: 'Phones',
          slug: 'phones',
          productCount: 6890,
          children: [
            { id: '1-2-1', name: 'Smartphones', slug: 'smartphones', productCount: 4560 },
            { id: '1-2-2', name: 'Accessories', slug: 'phone-accessories', productCount: 2330 }
          ]
        },
        {
          id: '1-3',
          name: 'Audio',
          slug: 'audio',
          productCount: 3300,
          children: [
            { id: '1-3-1', name: 'Headphones', slug: 'headphones', productCount: 2100 },
            { id: '1-3-2', name: 'Speakers', slug: 'speakers', productCount: 1200 }
          ]
        }
      ]
    },
    {
      id: '2',
      name: 'Fashion',
      slug: 'fashion',
      productCount: 12350,
      children: [
        {
          id: '2-1',
          name: 'Clothing',
          slug: 'clothing',
          productCount: 7890,
          children: [
            { id: '2-1-1', name: 'Men', slug: 'men-clothing', productCount: 3450 },
            { id: '2-1-2', name: 'Women', slug: 'women-clothing', productCount: 4440 }
          ]
        },
        {
          id: '2-2',
          name: 'Accessories',
          slug: 'accessories',
          productCount: 4460,
          children: [
            { id: '2-2-1', name: 'Bags', slug: 'bags', productCount: 2340 },
            { id: '2-2-2', name: 'Jewelry', slug: 'jewelry', productCount: 2120 }
          ]
        }
      ]
    },
    {
      id: '3',
      name: 'Home & Garden',
      slug: 'home-garden',
      productCount: 8920,
      children: [
        {
          id: '3-1',
          name: 'Furniture',
          slug: 'furniture',
          productCount: 4560,
          children: [
            { id: '3-1-1', name: 'Living Room', slug: 'living-room', productCount: 2340 },
            { id: '3-1-2', name: 'Bedroom', slug: 'bedroom', productCount: 2220 }
          ]
        },
        {
          id: '3-2',
          name: 'Kitchen', 
          slug: 'kitchen',
          productCount: 4360
        }
      ]
    }
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div key={category.id} style={{ marginLeft: `${level * 20}px` }}>
        <div
          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
          onClick={() => hasChildren && toggleCategory(category.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
          
          {hasChildren ? (
            <FolderOpen className={`w-5 h-5 ${isExpanded ? 'text-yellow-500' : 'text-gray-500'}`} />
          ) : (
            <Folder className="w-5 h-5 text-gray-500" />
          )}
          
          <span className="flex-1 font-medium text-gray-900">{category.name}</span>
          {category.productCount && (
            <span className="text-sm text-gray-500">{category.productCount.toLocaleString()}</span>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-1">
            {category.children!.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Categories</h1>
          <p className="mt-2 text-gray-600">Explore all product categories</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search categories..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-1">
            {categories.map(category => renderCategory(category))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900 mb-1">36,690</div>
            <div className="text-sm text-gray-600">Total Products</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900 mb-1">12</div>
            <div className="text-sm text-gray-600">Main Categories</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900 mb-1">48</div>
            <div className="text-sm text-gray-600">Sub-categories</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryTreePage;
