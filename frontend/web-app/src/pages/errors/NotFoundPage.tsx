import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const NotFoundPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Page Not Found - Mnbara</title>
        <meta name="description" content="The page you're looking for doesn't exist." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-400">
              404
            </h1>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
              Page not found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Sorry, we couldn't find the page you're looking for.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              to="/"
              className="btn btn-primary w-full flex items-center justify-center space-x-2"
            >
              <HomeIcon className="w-5 h-5" />
              <span>Go home</span>
            </Link>
            
            <Link
              to="/search"
              className="btn btn-outline w-full flex items-center justify-center space-x-2"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              <span>Search products</span>
            </Link>
          </div>

          <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>If you think this is a mistake, please contact our support team.</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default NotFoundPage