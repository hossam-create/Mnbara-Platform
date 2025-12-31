import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

// eBay-style main categories with product images
const mainCategories = [
  {
    name: 'Motors',
    nameAr: 'سيارات',
    slug: 'motors',
    products: [
      { name: 'Cars & Trucks', image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=150&h=150&fit=crop', slug: 'cars-trucks' },
      { name: 'Motorcycles', image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=150&h=150&fit=crop', slug: 'motorcycles' },
      { name: 'Parts & Accessories', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=150&h=150&fit=crop', slug: 'parts-accessories' },
      { name: 'Boats', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=150&h=150&fit=crop', slug: 'boats' },
    ]
  },
  {
    name: 'Electronics',
    nameAr: 'إلكترونيات',
    slug: 'electronics',
    products: [
      { name: 'Cell Phones', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150&h=150&fit=crop', slug: 'cell-phones' },
      { name: 'Computers & Tablets', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=150&h=150&fit=crop', slug: 'computers-tablets' },
      { name: 'Video Games', image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=150&h=150&fit=crop', slug: 'video-games' },
      { name: 'Cameras & Photo', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=150&h=150&fit=crop', slug: 'cameras-photo' },
    ]
  },
  {
    name: 'Collectibles & Art',
    nameAr: 'مقتنيات وفنون',
    slug: 'collectibles-art',
    products: [
      { name: 'Coins & Paper Money', image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=150&h=150&fit=crop', slug: 'coins' },
      { name: 'Sports Memorabilia', image: 'https://images.unsplash.com/photo-1461896836934- voices?w=150&h=150&fit=crop', slug: 'sports-memorabilia' },
      { name: 'Art', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=150&h=150&fit=crop', slug: 'art' },
      { name: 'Antiques', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop', slug: 'antiques' },
    ]
  },
  {
    name: 'Home & Garden',
    nameAr: 'منزل وحديقة',
    slug: 'home-garden',
    products: [
      { name: 'Furniture', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=150&h=150&fit=crop', slug: 'furniture' },
      { name: 'Home Décor', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=150&h=150&fit=crop', slug: 'home-decor' },
      { name: 'Kitchen & Dining', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=150&h=150&fit=crop', slug: 'kitchen-dining' },
      { name: 'Garden & Outdoor', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=150&h=150&fit=crop', slug: 'garden-outdoor' },
    ]
  },
  {
    name: 'Clothing & Accessories',
    nameAr: 'ملابس وإكسسوارات',
    slug: 'clothing-accessories',
    products: [
      { name: "Women's Clothing", image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=150&h=150&fit=crop', slug: 'womens-clothing' },
      { name: "Men's Clothing", image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=150&h=150&fit=crop', slug: 'mens-clothing' },
      { name: 'Shoes', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&h=150&fit=crop', slug: 'shoes' },
      { name: 'Watches & Jewelry', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&h=150&fit=crop', slug: 'watches-jewelry' },
    ]
  },
  {
    name: 'Toys & Hobbies',
    nameAr: 'ألعاب وهوايات',
    slug: 'toys-hobbies',
    products: [
      { name: 'Action Figures', image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=150&h=150&fit=crop', slug: 'action-figures' },
      { name: 'Building Toys', image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=150&h=150&fit=crop', slug: 'building-toys' },
      { name: 'Diecast & Vehicles', image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=150&h=150&fit=crop', slug: 'diecast-vehicles' },
      { name: 'Games', image: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=150&h=150&fit=crop', slug: 'games' },
    ]
  },
  {
    name: 'Sporting Goods',
    nameAr: 'مستلزمات رياضية',
    slug: 'sporting-goods',
    products: [
      { name: 'Cycling', image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=150&h=150&fit=crop', slug: 'cycling' },
      { name: 'Golf', image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=150&h=150&fit=crop', slug: 'golf' },
      { name: 'Fitness Equipment', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&h=150&fit=crop', slug: 'fitness-equipment' },
      { name: 'Outdoor Sports', image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=150&h=150&fit=crop', slug: 'outdoor-sports' },
    ]
  },
  {
    name: 'Business & Industrial',
    nameAr: 'أعمال وصناعة',
    slug: 'business-industrial',
    products: [
      { name: 'Heavy Equipment', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=150&h=150&fit=crop', slug: 'heavy-equipment' },
      { name: 'Office Equipment', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=150&h=150&fit=crop', slug: 'office-equipment' },
      { name: 'Restaurant & Food', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=150&h=150&fit=crop', slug: 'restaurant-food' },
      { name: 'Industrial Tools', image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=150&h=150&fit=crop', slug: 'industrial-tools' },
    ]
  },
]

const Categories: React.FC = () => {
  return (
    <section className="py-6">
      {/* eBay-style header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Explore Popular Categories
        </h2>
        <Link
          to="/categories"
          className="flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm"
        >
          See all categories
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
