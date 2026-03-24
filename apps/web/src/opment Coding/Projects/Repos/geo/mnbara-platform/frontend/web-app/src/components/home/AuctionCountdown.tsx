import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

interface Auction {
  id: string
  title: string
  currentBid: number
  numberOfBids: number
  image: string
  endsAt: Date
  highestBidder?: string
  category: string
}

const AuctionCountdown: React.FC = () => {
  const [auctions, setAuctions] = useState<Auction[]>([
    {
      id: 'a1',
      title: 'Vintage Rolex Watch',
      currentBid: 2500,
      numberOfBids: 45,
      image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=300&h=300&fit=crop',
      endsAt: new Date(Date.now() + 3600000),
      highestBidder: 'collector_pro',
      category: 'Collectibles'
    },
    {
      id: 'a2',
      title: 'Rare Comic Book Collection',
      currentBid: 850,
      numberOfBids: 28,
      image: 'https://images.unsplash.com/photo-1543002588-d83cedbc4d60?w=300&h=300&fit=crop',
      endsAt: new Date(Date.now() + 7200000),
      highestBidder: 'comic_fan',
      category: 'Collectibles'
    },
    {
      id: 'a3',
      title: 'Antique Camera',
      currentBid: 450,
      numberOfBids: 15,
      image: 'https://images.unsplash.com/photo-1606986628025-35d57e735ae0?w=300&h=300&fit=crop',
      endsAt: new Date(Date.now() + 5400000),
      highestBidder: 'photo_buff',
      category: 'Vintage'
    },
    {
      id: 'a4',
      title: 'Limited Edition Sneakers',
      currentBid: 1200,
      numberOfBids: 62,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop',
      endsAt: new Date(Date.now() + 9000000),
      highestBidder: 'sneaker_head',
      category: 'Fashion'
    }
  ])

  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft: { [key: string]: string } = {}
      auctions.forEach(auction => {
        const now = new Date().getTime()
        const end = new Date(auction.endsAt).getTime()
        const distance = end - now

        if (distance > 0) {
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((distance % (1000 * 60)) / 1000)
          newTimeLeft[auction.id] = `${hours}h ${minutes}m ${seconds}s`
        } else {
          newTimeLeft[auction.id] = 'Ended'
        }
      })
      setTimeLeft(newTimeLeft)
    }, 1000)

    return () => clearInterval(timer)
  }, [auctions])

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🏆 Live Auctions
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Bid now on exclusive items</p>
        </div>
        <Link
          to="/auctions"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          See all auctions
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {auctions.map((auction, index) => (
          <motion.div
            key={auction.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="relative">
              <img
                src={auction.image}
                alt={auction.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                {auction.category}
              </div>
              <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                Auction
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3 line-clamp-2">
                {auction.title}
              </h3>

              {/* Current Bid */}
              <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current Bid</p>
                <p className="text-2xl font-bold text-primary-600">${auction.currentBid}</p>
              </div>

              {/* Bid Info */}
              <div className="mb-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">{auction.numberOfBids} bids</span>
                  <span className="text-gray-600 dark:text-gray-400">by {auction.highestBidder}</span>
                </div>
              </div>

              {/* Countdown */}
              <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-center">
                <p className="text-xs font-mono text-blue-600 dark:text-blue-400">
                  {timeLeft[auction.id] || 'Loading...'}
                </p>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors">
                Place Bid
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default AuctionCountdown
