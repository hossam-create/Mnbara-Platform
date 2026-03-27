import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

interface ViewedItem {
  id: string
  title: string
  price: number
  image: string
  viewedAt: Date
  timeSpent: number
}

const RecentlyViewed: React.FC = () => {
  const [viewedItems, setViewedItems] = useState<ViewedItem[]>([
    {
      id: '1',
      title: 'Premium Wireless Headphones',
      price: 149,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
      viewedAt: new Date(Date.now() - 300000),
      timeSpent: 5
    },
    {
      id: '2',
      title: 'Smart Watch Pro',
      price: 199,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
      viewedAt: new Date(Date.now() - 600000),
      timeSpent: 8
    },
    {
      id: '3',
      title: '4K Webcam',
      price: 99,
      image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300&h=300&fit=crop',
      viewedAt: new Date(Date.now() - 900000),
      timeSpent: 3
    },
    {
      id: '4',
      title: 'Portable SSD 1TB',
      price: 79,
      image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=300&h=300&fit=crop',
      viewedAt: new Date(Date.now() - 1200000),
      timeSpent: 6
    },
    {
      id: '5',
      title: 'USB-C Hub',
      price: 49,
      image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=300&h=300&fit=crop',
      viewedAt: new Date(Date.now() - 1500000),
      timeSpent: 2
    }
  ])

  const handleClearHistory = () => {
    setViewedItems([])
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (viewedItems.length === 0) {
    return null
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            👀 Recently Viewed
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Items you've looked at</p>
        </div>
        <button
          onClick={handleClearHistory}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
        >
          Clear history
        </button>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {viewedItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0 w-48 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <Link to={`/product/${item.id}`}>
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-40 object-cover hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {formatTimeAgo(item.viewedAt)}
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-lg font-bold text-primary-600">${item.price}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default RecentlyViewed
