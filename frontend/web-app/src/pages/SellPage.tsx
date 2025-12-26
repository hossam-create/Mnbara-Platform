import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { 
  CameraIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon,
  TruckIcon,
  ChartBarIcon,
  ShieldCheckIcon 
} from '@heroicons/react/24/outline'

const SellPage: React.FC = () => {
  const sellingSteps = [
    {
      icon: CameraIcon,
      title: 'Take photos',
      description: 'Add up to 12 photos that show your item\'s best features'
    },
    {
      icon: DocumentTextIcon,
      title: 'Add details',
      description: 'Include a title, description, and category to help buyers find your item'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Set your price',
      description: 'Choose auction-style or fixed price listing'
    },
    {
      icon: TruckIcon,
      title: 'Choose shipping',
      description: 'Decide how you\'ll ship and who pays for shipping'
    }
  ]

  const sellingBenefits = [
    {
      icon: ChartBarIcon,
      title: 'Reach millions of buyers',
      description: 'Your items are seen by buyers around the world'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Seller protection',
      description: 'We help protect you from fraudulent buyers'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Get paid fast',
      description: 'Receive payments quickly and securely'
    }
  ]

  return (
    <>
      <Helmet>
        <title>Sell Your Items - Mnbara</title>
        <meta name="description" content="Start selling on Mnbara. Turn your unused items into cash with our easy-to-use selling platform." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 dark:from-secondary-700 dark:to-secondary-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Turn your stuff into cash
              </h1>
              <p className="text-xl text-secondary-100 mb-8 max-w-2xl mx-auto">
                Millions of buyers are looking for unique items like yours. 
                Start selling today and join our community of successful sellers.
              </p>
              <Link
                to="/seller/listings/create"
                className="inline-flex items-center px-8 py-4 bg-white text-secondary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-lg"
              >
                Start selling now
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* How it works */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                How selling works
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                It's simple to get started
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {sellingSteps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <div className="bg-secondary-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Why sell on Mnbara?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {sellingBenefits.map((benefit, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <benefit.icon className="w-12 h-12 text-secondary-600 dark:text-secondary-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to start selling?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Join thousands of sellers who trust Mnbara to help them reach buyers worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/seller/listings/create"
                className="btn btn-primary"
              >
                Create your first listing
              </Link>
              <Link
                to="/help/selling"
                className="btn btn-outline"
              >
                Learn more about selling
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SellPage