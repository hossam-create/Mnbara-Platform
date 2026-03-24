import React, { useState } from 'react'
import { motion } from 'framer-motion'

interface SaveButtonProps {
  productId: string
  onSave?: (productId: string) => void
  onUnsave?: (productId: string) => void
  initialSaved?: boolean
}

const SaveButton: React.FC<SaveButtonProps> = ({
  productId,
  onSave,
  onUnsave,
  initialSaved = false
}) => {
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [showToast, setShowToast] = useState(false)

  const handleToggleSave = () => {
    setIsSaved(!isSaved)
    setShowToast(true)

    if (!isSaved) {
      onSave?.(productId)
    } else {
      onUnsave?.(productId)
    }

    setTimeout(() => setShowToast(false), 2000)
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggleSave}
        className={`p-2 rounded-full transition-all ${
          isSaved
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        title={isSaved ? 'Remove from saved' : 'Save for later'}
      >
        <motion.svg
          animate={{ scale: isSaved ? 1.2 : 1 }}
          className="w-5 h-5"
          fill={isSaved ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </motion.svg>
      </motion.button>

      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full mt-2 right-0 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-1 rounded text-xs font-medium whitespace-nowrap z-10"
        >
          {isSaved ? 'Added to saved' : 'Removed from saved'}
        </motion.div>
      )}
    </div>
  )
}

export default SaveButton
