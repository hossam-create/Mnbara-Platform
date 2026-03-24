import React from 'react'
import { Link } from 'react-router-dom'
import { TrendingUpIcon } from '@heroicons/react/24/outline'

interface TrendingSearchesProps {
  searches: string[]
}

const TrendingSearches: React.FC<TrendingSearchesProps> = ({ searches }) => {
  return (
    <section>
      <div className="flex items-center mb-6">
        <TrendingUpIcon className="w-6 h-6 text-primary-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Trending Searches
        </h2>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {searches.slice(0, 8).map((search, index) => (
          <Link
            key={index}
            to={`/search?q=${encodeURIComponent(search)}`}
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
          >
            {search}
          </Link>
        ))}
      </div>
    </section>
  )
}

export default TrendingSearches