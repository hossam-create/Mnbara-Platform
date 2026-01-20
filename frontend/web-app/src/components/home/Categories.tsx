import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

// Mnbara main categories with product images
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
      { name: 'Sports Memorabilia', image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=150&h=150&fit=crop', slug: 'sports-memorabilia' },
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
]
