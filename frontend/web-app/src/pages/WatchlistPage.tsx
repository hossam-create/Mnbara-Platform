import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { removeFromWatchlist } from '@/store/slices/userSlice'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { HeartIcon, TrashIcon } from '@heroicons/react/24/outline'
import ProductCard from '@/components/product/ProductCard'

const WatchlistPage: React.FC = () => {
  const dispatch = useDispatch()
  const { watchlist } = useSelector((state: RootState) => state.user)
  
  // Mock products for demonstration - in real app, fetch from API
  const mockWatchlistProducts = [
    {
      id: '1',
      title: 'iPhone 14 Pro Max 256GB Space Black',
      price: 1099,
      originalPrice: 1199,
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop',
      rating: 4.8,
      reviewCount: 1250,
      seller: {
        id: 'seller1',
        name: 'TechStore Pro',
        rating: 4.9
      },
      condition: 'new' as const,
      shipping: {
        free: true,
        cost: 0,
        estimatedDays: 2
      },
      location: {
        city: 'New York',
        country: 'USA'
      }
    },
    {
      id: '2',
      title: 'MacBook Air M2 13-inch 512GB',
      price: 1399,
      image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300&h=300&fit=crop',
      rating: 4.7,
      reviewCount: 890,
      seller: {
        id: 'seller2',
        name: 'Apple Authorized',
        rating: 4.8
      },
      condition: 'new' as const,
      shipping: {
        free: true,
        cost: 0,
        estimatedDays: 3
      },
      location: {
        city: 'California',
        country: 'USA'
      }
    }
  ]

  const handleRemoveFromWatchlist = (productId: string) => {
    dispatch(removeFromWatchlist(productId))
  }

  const handleClearWatchlist = () => {
    watchlist.forEach(productId => {
      dispatch(removeFromWatchlist(productId))
    })
  }

  return (
    <>
      <Helmet>
        <title>My Watchlist ({watchlist.length}) - Mnbara</title>
        <meta name="description" content="Keep track of items you're interested in with your Mnbara watchlist." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <HeartIcon className="w-8 h-8 text-red-500" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Watchlist ({watchlist.length})
              </h1>
            </div>
            
            {watchlist.length > 0 && (
              <button
                onClick={handleClearWatchlist}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 flex items-center space-x-1"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Clear all</span>
              </button>
            )}
          </div>

          {watchlist.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <HeartIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Your watchlist is empty
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Save items you're interested in to your watchlist so you can easily find them later.
              </p>
              <Link
                to="/"
                className="btn btn-primary"
              >
                Start browsing
              </Link>
            </div>
          ) : (
            <>
              {/* Watchlist Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {watchlist.length} {watchlist.length === 1 ? 'item' : 'items'} saved
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <select className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      <option>Recently added</option>
                      <option>Price: Low to High</option>
                      <option>Price: High to Low</option>
                      <option>Ending soonest</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Watchlist Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {mockWatchlistProducts
                  .filter(product => watchlist.includes(product.id))
                  .map((product) => (
                    <div key={product.id} className="relative">
                      <ProductCard product={product} />
                      
                      {/* Remove from watchlist button */}
                      <button
                        onClick={() => handleRemoveFromWatchlist(product.id)}
                        className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:shadow-md transition-shadow z-10"
                        title="Remove from watchlist"
                      >
                        <TrashIcon className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
              </div>

              {/* Watchlist Tips */}
              <div className="mt-12 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Watchlist Tips
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Get notified when prices drop on your watched items</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Receive alerts when auctions are ending soon</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Share your watchlist with friends and family</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Organize items into custom lists</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default WatchlistPage