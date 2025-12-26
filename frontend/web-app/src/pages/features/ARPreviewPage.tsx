import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CameraIcon, 
  CubeIcon,
  ArrowsPointingOutIcon,
  ArrowPathIcon,
  PhotoIcon,
  ShareIcon
} from '@heroicons/react/24/outline'

interface ARProduct {
  id: string
  name: string
  modelUrl: string
  thumbnail: string
  scale: number
}

const ARPreviewPage: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<ARProduct | null>(null)
  const [isARActive, setIsARActive] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const sampleProducts: ARProduct[] = [
    { id: '1', name: 'كنبة حديثة', modelUrl: '/models/sofa.glb', thumbnail: '🛋️', scale: 1 },
    { id: '2', name: 'طاولة طعام', modelUrl: '/models/table.glb', thumbnail: '🪑', scale: 1 },
    { id: '3', name: 'مصباح أرضي', modelUrl: '/models/lamp.glb', thumbnail: '💡', scale: 0.5 },
    { id: '4', name: 'سجادة', modelUrl: '/models/rug.glb', thumbnail: '🟫', scale: 1.5 },
  ]

  const startAR = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsARActive(true)
        setCameraPermission(true)
      }
    } catch (err) {
      setCameraPermission(false)
    }
  }

  const stopAR = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      setIsARActive(false)
    }
  }

  const captureScreenshot = () => {
    if (canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        ctx.drawImage(videoRef.current, 0, 0)
        const link = document.createElement('a')
        link.download = 'ar-preview.png'
        link.href = canvasRef.current.toDataURL()
        link.click()
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            👓 معاينة الواقع المعزز
          </h1>
          <p className="text-lg text-gray-600">
            شوف المنتج في مكانك الحقيقي قبل ما تشتري
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">اختر منتج</h2>
              <div className="space-y-3">
                {sampleProducts.map((product) => (
                  <motion.button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                      selectedProduct?.id === product.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <span className="text-4xl">{product.thumbnail}</span>
                    <div className="text-right">
                      <h3 className="font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">نموذج 3D</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Controls */}
            {selectedProduct && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-lg mt-6"
              >
                <h2 className="text-xl font-semibold mb-4">التحكم</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">الحجم</label>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2" 
                      step="0.1"
                      defaultValue="1"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">الدوران</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="360" 
                      step="1"
                      defaultValue="0"
                      className="w-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* AR View */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="relative aspect-video bg-gray-900">
                {isARActive ? (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {selectedProduct && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          drag
                          dragConstraints={{ left: -200, right: 200, top: -150, bottom: 150 }}
                          className="text-8xl cursor-move"
                        >
                          {selectedProduct.thumbnail}
                        </motion.div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <CameraIcon className="w-24 h-24 mb-4 opacity-50" />
                    <p className="text-xl mb-2">الكاميرا غير مفعلة</p>
                    <p className="text-gray-400">اضغط على "بدء AR" لتفعيل الكاميرا</p>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Action Buttons */}
              <div className="p-4 flex justify-center gap-4">
                {!isARActive ? (
                  <motion.button
                    onClick={startAR}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium flex items-center gap-2"
                  >
                    <CameraIcon className="w-5 h-5" />
                    بدء AR
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      onClick={captureScreenshot}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium flex items-center gap-2"
                    >
                      <PhotoIcon className="w-5 h-5" />
                      التقاط صورة
                    </motion.button>
                    <motion.button
                      onClick={stopAR}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium flex items-center gap-2"
                    >
                      إيقاف
                    </motion.button>
                  </>
                )}
              </div>
            </div>

            {/* Permission Error */}
            {cameraPermission === false && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-center text-red-600"
              >
                لم يتم السماح بالوصول للكاميرا. يرجى تفعيل الإذن من إعدادات المتصفح.
              </motion.div>
            )}

            {/* Instructions */}
            <div className="mt-6 bg-white/50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">📱 كيفية الاستخدام</h3>
              <ol className="space-y-2 text-gray-600 list-decimal list-inside">
                <li>اختر المنتج من القائمة</li>
                <li>اضغط على "بدء AR" لتفعيل الكاميرا</li>
                <li>وجه الكاميرا نحو المكان المراد</li>
                <li>اسحب المنتج لتحريكه</li>
                <li>استخدم أدوات التحكم لتعديل الحجم والدوران</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ARPreviewPage
