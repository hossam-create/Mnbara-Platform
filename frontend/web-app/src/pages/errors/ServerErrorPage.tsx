import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const ServerErrorPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <>
      <Helmet>
        <title>Server Error - Mnbara</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <ExclamationTriangleIcon className="w-14 h-14 text-red-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">500</h1>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Server Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
            Something went wrong on our end. We're working to fix it. Please try again later.
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
              Try Again
            </button>
            <button onClick={() => navigate('/')} className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800">
              Go Home
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ServerErrorPage
