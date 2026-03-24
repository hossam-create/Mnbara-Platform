import React, { useState } from 'react'
import { motion } from 'framer-motion'

interface Badge {
  id: string
  type: 'buyer-protection' | 'money-back' | 'ssl' | 'secure-checkout'
  label: string
  description: string
  icon: string
}

const TrustBadges: React.FC = () => {
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null)

  const badges: Badge[] = [
    {
      id: '1',
      type: 'buyer-protection',
      label: 'Buyer Protection',
      description: 'Your purchase is protected by our buyer protection guarantee',
      icon: '🛡️'
    },
    {
      id: '2',
      type: 'money-back',
      label: 'Money Back Guarantee',
      description: 'Not satisfied? Get your money back within 30 days',
      icon: '💰'
    },
    {
      id: '3',
      type: 'ssl',
      label: 'SSL Secure',
      description: 'Your data is encrypted and secure',
      icon: '🔒'
    },
    {
      id: '4',
      type: 'secure-checkout',
      label: 'Secure Checkout',
      description: 'Fast and secure payment processing',
      icon: '✓'
    }
  ]

  return (
    <section className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          ✨ Why Shop With Us
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your trust is our priority</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onMouseEnter={() => setHoveredBadge(badge.id)}
            onMouseLeave={() => setHoveredBadge(null)}
            className="relative"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow cursor-help">
              <div className="text-4xl mb-3">{badge.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                {badge.label}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {badge.type === 'buyer-protection' && 'Protected'}
                {badge.type === 'money-back' && 'Guaranteed'}
                {badge.type === 'ssl' && 'Encrypted'}
                {badge.type === 'secure-checkout' && 'Verified'}
              </p>
            </div>

            {/* Tooltip */}
            {hoveredBadge === badge.id && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded text-xs whitespace-nowrap z-10"
              >
                {badge.description}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default TrustBadges
