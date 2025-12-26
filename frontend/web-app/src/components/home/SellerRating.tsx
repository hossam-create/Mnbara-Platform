import React from 'react'

interface SellerRatingProps {
  sellerId: string
  sellerName: string
  averageRating: number
  totalFeedback: number
  positivePercentage: number
  badge?: 'top-rated' | 'power-seller' | 'none'
}

const SellerRating: React.FC<SellerRatingProps> = ({
  sellerId,
  sellerName,
  averageRating,
  totalFeedback,
  positivePercentage,
  badge = 'none'
}) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= Math.round(rating)
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

  const getBadgeIcon = () => {
    switch (badge) {
      case 'top-rated':
        return '⭐'
      case 'power-seller':
        return '🏆'
      default:
        return null
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
            {sellerName}
          </h4>
          {badge !== 'none' && (
            <span className="text-lg" title={badge === 'top-rated' ? 'Top Rated Seller' : 'Power Seller'}>
              {getBadgeIcon()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-1">
          {renderStars(averageRating)}
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {averageRating.toFixed(1)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span>{totalFeedback.toLocaleString()} feedback</span>
          <span>•</span>
          <span className="text-green-600 dark:text-green-400 font-medium">
            {positivePercentage}% positive
          </span>
        </div>
      </div>

      <button className="px-3 py-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 border border-primary-600 dark:border-primary-400 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
        View
      </button>
    </div>
  )
}

export default SellerRating
