import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CubeIcon, 
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline'

interface Showroom {
  id: string
  name: string
  description: string
  thumbnail: string
  visitors: number
  products: number
}

const VRShowroomPage: React.FC = () => {
  const [selectedShowroom, setSelectedShowroom] = useState<Showroom | null>(null)
  const [isVRMode, setIsVRMode] = useState(false)

  const showrooms: Showroom[] = [
    { id: '1', name: 'صالة الإلكترونيات', description: 'أحدث الأجهزة الإلكترونية', thumbnail: '📱', visitors: 234, products: 150 },
    { id: '2', name: 'معرض الأثاث', description: 'أثاث منزلي فاخر', thumbnail: '🛋️', visitors: 156, products: 89 },
    { id: '3', name: 'بوتيك الأزياء', description: 'أحدث صيحات الموضة', thumbnail: '👗', visitors: 312, products: 200 },
    { id: '4', name: 'معرض السيارات', description: 'سيارات فاخرة ورياضية', thumbnail: '🚗', visitors: 89, products: 45 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 to-indigo-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">🥽 صالات العرض الافتراضية</h1>
          <p className="text-lg text-violet-200">استكشف المنتجات في بيئة ثلاثية الأبعاد</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {showrooms.map((showroom) => (
            <motion.div
              key={showroom.id}
              whileHover={{ scale: 1.05, y: -5 }}
              onClick={() => setSelectedShowroom(showroom)}
              className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 cursor-pointer border-2 transition-all ${
                selectedShowroom?.id === showroom.id ? 'border-violet-400' : 'border-transparent hover:border-violet-400/50'
              }`}
            >
              <div className="text-6xl mb-4 text-center">{showroom.thumbnail}</div>
              <h3 className="text-xl font-semibold mb-2">{showroom.name}</h3>
              <p className="text-violet-200 text-sm mb-4">{showroom.description}</p>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1"><UserGroupIcon className="w-4 h-4" />{showroom.visitors}</span>
                <span className="flex items-center gap-1"><CubeIcon className="w-4 h-4" />{showroom.products}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {selectedShowroom && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-violet-800 to-indigo-800 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-9xl mb-4">{selectedShowroom.thumbnail}</div>
                  <h2 className="text-3xl font-bold mb-2">{selectedShowroom.name}</h2>
                  <p className="text-violet-200 mb-6">{selectedShowroom.description}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsVRMode(true)}
                    className="px-8 py-4 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold text-lg"
                  >
                    🥽 دخول VR
                  </motion.button>
                </div>
              </div>
            </div>
            <div className="p-6 flex justify-between items-center">
              <div className="flex gap-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20">
                  <ChatBubbleLeftRightIcon className="w-5 h-5" /> دردشة
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20">
                  <ShoppingCartIcon className="w-5 h-5" /> تسوق
                </button>
              </div>
              <div className="text-violet-200">
                <UserGroupIcon className="w-5 h-5 inline mr-2" />
                {selectedShowroom.visitors} زائر الآن
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default VRShowroomPage
