import React from 'react'
import { useParams } from 'react-router-dom'

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Category: {slug}
          </h1>
          <p className="text-sm text-gray-500 mt-4">
            This page is under construction. Category products will be displayed here.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CategoryPage