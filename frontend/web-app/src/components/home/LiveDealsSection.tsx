import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

interface Deal {
  id: string
  title: string
  originalPrice: number
  salePrice: number
  discount: number
  image: string
  endsAt: Date
  itemsLeft: number
  totalItems: number
}

const LiveDealsSection: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([
    {
      id: '1',
      title: 'Premium Wireless Headphones',
      originalPrice: 299,
      salePrice: 149,
      discount: 50,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
      endsAt: new Date(Date.now() + 3600000),
      itemsLeft: 5,
      totalItems: 20
    },
    {
      id: '2',
      title: 'Smart Watch Pro',
      originalPrice: 399,
      salePrice: 199,
      discount: 50,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
      endsAt: new Date(Date.now() + 7200000),
      itemsLeft: 3,
      totalItems: 15
    },
    {
      id: '3',
      title: '4K Webcam',
      originalPrice: 199,
      salePrice: 99,
      discount: 50,
      image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300&h=300&fit=crop',
      endsAt: new Date(Date.now() + 5400000),
      itemsLeft: 8,
      totalItems: 25
    },
    {
      id: '4',
      title: 'Portable SSD 1TB',
      originalPrice: 149,
      salePrice: 79,
      discount: 47,
      image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=300&h=300&fit=crop',
      endsAt: new Date(Date.now() + 9000000),
      itemsLeft: 12,
      totalItems: 30
    }
  ])

  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft: { [key: string]: string } = {}
      deals.forEach(deal => {
        const now = new Date().getTime()
        const end = new Date(deal.endsAt).getTime()
        const distance = end - now

        if (distance > 0) {
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((distance % (1000 * 60)) / 1000)
          newTimeLeft[deal.id] = `${hours}h ${minutes}m ${seconds}s`
        } else {
          newTimeLeft[deal.id] = 'Ended'
        }
      })
      setTimeLeft(newTimeLeft)
    }, 1000)

    return () => clearInterval(timer)
  }, [deals])

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🔥 Live Deals
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Limited time offers ending soon</p>
        </div>
        <Link
          to="/deals"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          See all deals
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {deals.map((deal, index) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="relative">
              <img
                src={deal.image}
                alt={deal.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                -{deal.discount}%
              </div>
              {deal.itemsLeft <= 5 && (
                <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                  Hurry!
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">
                {deal.title}
              </h3>

              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-primary-600">${deal.salePrice}</span>
                  <span className="text-sm text-gray-500 line-through">${deal.originalPrice}</span>
                </div>
              </div>

              {/* Inventory Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Items left</span>
                  <span>{deal.itemsLeft}/{deal.totalItems}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${(deal.itemsLeft / deal.totalItems) * 100}%` }}
                  />
                </div>
              </div>

              {/* Countdown */}
              <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-center">
                <p className="text-xs font-mono text-red-600 dark:text-red-400">
                  {timeLeft[deal.id] || 'Loading...'}
                </p>
              </div>

              <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition-colors">
                Buy Now
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default LiveDealsSection
