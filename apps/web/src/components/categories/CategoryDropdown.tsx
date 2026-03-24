import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRightIcon } from '@heroicons/react/24/outline'

interface CategoryDropdownProps {
  onClose: () => void
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({ onClose }) => {
  const categories = [
    {
      name: 'Electronics',
      subcategories: [
        { name: 'Cell Phones & Accessories', href: '/electronics/cell-phones' },
        { name: 'Laptops & Computers', href: '/electronics/computers' },
        { name: 'Cameras & Photo', href: '/electronics/cameras' },
        { name: 'Audio & Headphones', href: '/electronics/audio' },
        { name: 'Video Games & Consoles', href: '/electronics/gaming' },
        { name: 'Smart Home & Security', href: '/electronics/smart-home' }
      ]
    },
    {
      name: 'Fashion',
      subcategories: [
        { name: 'Women\'s Clothing', href: '/fashion/womens' },
        { name: 'Men\'s Clothing', href: '/fashion/mens' },
        { name: 'Shoes', href: '/fashion/shoes' },
        { name: 'Jewelry & Watches', href: '/fashion/jewelry' },
        { name: 'Bags & Accessories', href: '/fashion/accessories' },
        { name: 'Kids & Baby', href: '/fashion/kids' }
      ]
    },
    {
      name: 'Home & Garden',
      subcategories: [
        { name: 'Furniture', href: '/home/furniture' },
        { name: 'Kitchen & Dining', href: '/home/kitchen' },
        { name: 'Bedding & Bath', href: '/home/bedding' },
        { name: 'Home Decor', href: '/home/decor' },
        { name: 'Garden & Outdoor', href: '/home/garden' },
        { name: 'Tools & Home Improvement', href: '/home/tools' }
      ]
    },
    {
      name: 'Sports & Outdoors',
      subcategories: [
        { name: 'Fitness & Exercise', href: '/sports/fitness' },
        { name: 'Outdoor Recreation', href: '/sports/outdoor' },
        { name: 'Team Sports', href: '/sports/team' },
        { name: 'Water Sports', href: '/sports/water' },
        { name: 'Winter Sports', href: '/sports/winter' },
        { name: 'Cycling', href: '/sports/cycling' }
      ]
    },
    {
      name: 'Auto Parts & Accessories',
      subcategories: [
        { name: 'Car Parts', href: '/auto/parts' },
        { name: 'Motorcycle Parts', href: '/auto/motorcycle' },
        { name: 'Truck Parts', href: '/auto/truck' },
        { name: 'Tools & Equipment', href: '/auto/tools' },
        { name: 'Accessories', href: '/auto/accessories' },
        { name: 'Tires & Wheels', href: '/auto/tires' }
      ]
    },
    {
      name: 'Collectibles & Art',
      subcategories: [
        { name: 'Coins & Paper Money', href: '/collectibles/coins' },
        { name: 'Sports Memorabilia', href: '/collectibles/sports' },
        { name: 'Comics & Manga', href: '/collectibles/comics' },
        { name: 'Art', href: '/collectibles/art' },
        { name: 'Dolls & Bears', href: '/collectibles/dolls' },
        { name: 'Stamps', href: '/collectibles/stamps' }
      ]
    }
  ]

  return (
    <div className="absolute top-full left-0 w-screen bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-700 mt-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category) => (
            <div key={category.name} className="group">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {category.name}
              </h3>
              <ul className="space-y-2">
                {category.subcategories.map((sub) => (
                  <li key={sub.name}>
                    <Link
                      to={sub.href}
                      onClick={onClose}
                      className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 group"
                    >
                      <ChevronRightIcon className="w-3 h-3 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Featured categories section */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Featured Categories</h3>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/deals"
                  onClick={onClose}
                  className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-sm font-medium hover:bg-red-200 dark:hover:bg-red-800"
                >
                  🔥 Hot Deals
                </Link>
                <Link
                  to="/trending"
                  onClick={onClose}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800"
                >
                  📈 Trending
                </Link>
                <Link
                  to="/new-arrivals"
                  onClick={onClose}
                  className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-medium hover:bg-green-200 dark:hover:bg-green-800"
                >
                  ✨ New Arrivals
                </Link>
              </div>
            </div>
            <Link
              to="/categories"
              onClick={onClose}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              View all categories →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryDropdown
