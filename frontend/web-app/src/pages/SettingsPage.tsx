import React from 'react'
import { Helmet } from 'react-helmet-async'

const SettingsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Settings - Mnbara</title>
        <meta name="description" content="Manage your account settings and preferences on Mnbara." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Settings
          </h1>
          
          <div className="text-center py-16">
            <p className="text-gray-600 dark:text-gray-400">
              Settings page is under construction.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default SettingsPage