import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Review {
  id: string
  rating: number
  text: string
  reviewer: string
  avatar: string
  date: Date
  verified: boolean
}

const ReviewsCarousel: React.FC = () => {
  const [reviews] = useState<Review[]>([
    {
      id: '1',
      rating: 5,
      text: 'Excellent quality and fast shipping! Highly recommend this seller. The product arrived in perfect condition.',
      reviewer: 'Sarah M.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      date: new Date(Date.now() - 86400000),
      verified: true
    },
    {
      id: '2',
      rating: 5,
      text: 'Amazing product! Better than expected. Great customer service and very responsive to questions.',
      reviewer: 'John D.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      date: new Date(Date.now() - 172800000),
      verified: true
    },
    {
      id: '3',
      rating: 4,
      text: 'Good quality product. Shipping took a bit longer than expected but overall satisfied with my purchase.',
      reviewer: 'Emily R.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      date: new Date(Date.now() - 259200000),
      verified: true
    },
    {
      id: '4',
      rating: 5,
      text: 'Perfect! Exactly as described. Will definitely buy from this seller again. Highly trustworthy!',
      reviewer: 'Michael T.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      date: new Date(Date.now() - 345600000),
      verified: true
    }
  ])

  const [currentIndex, setCurrentIndex] = useState(0)

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length)
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length)
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= rating
                ? 'text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  const currentReview = reviews[currentIndex]

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            ⭐ Customer Reviews
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">What buyers are saying</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentReview.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            {/* Stars */}
            <div className="mb-4">
              {renderStars(currentReview.rating)}
            </div>

            {/* Review Text */}
            <p className="text-lg text-gray-900 dark:text-white mb-6 italic">
              "{currentReview.text}"
            </p>

            {/* Reviewer Info */}
            <div className="flex items-center gap-4">
              <img
                src={currentReview.avatar}
                alt={currentReview.reviewer}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {currentReview.reviewer}
                  </p>
                  {currentReview.verified && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                      ✓ Verified Buyer
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentReview.date.toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handlePrev}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-primary-600 w-6'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Review Count */}
        <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          {currentIndex + 1} of {reviews.length} reviews
        </div>
      </div>
    </section>
  )
}

export default ReviewsCarousel
