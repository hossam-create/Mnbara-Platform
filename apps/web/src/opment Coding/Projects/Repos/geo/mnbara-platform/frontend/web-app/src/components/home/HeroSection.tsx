import React from 'react'
import { Link } from 'react-router-dom'
import SearchBar from '@/components/search/SearchBar'

const HeroSection: React.FC = () => {
  return (
    <div className="relative bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-900">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Find it. Love it. Buy it.
          </h1>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Discover millions of products from trusted sellers around the world. 
            Your next great find is just a search away.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar />
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/categories"
              className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Browse Categories
            </Link>
            <Link
              to="/sell"
              className="bg-secondary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary-600 transition-colors"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroSection