import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MicrophoneIcon, 
  StopIcon,
  MagnifyingGlassIcon,
  SpeakerWaveIcon,
  LanguageIcon
} from '@heroicons/react/24/outline'

interface VoiceResult {
  transcript: string
  confidence: number
  intent: string
  products: any[]
}

const VoiceSearchPage: React.FC = () => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [results, setResults] = useState<VoiceResult | null>(null)
  const [language, setLanguage] = useState<'ar' | 'en'>('ar')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = language === 'ar' ? 'ar-SA' : 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex
        const result = event.results[current]
        if (result.isFinal) {
          setTranscript(result[0].transcript)
          handleSearch(result[0].transcript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        setError(`خطأ في التعرف على الصوت: ${event.error}`)
        setIsListening(false)
      }
    }
  }, [language])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      setError(null)
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  const handleSearch = async (query: string) => {
    try {
      const response = await fetch('/api/voice/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, language })
      })
      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError('فشل في البحث')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎤 البحث الصوتي
          </h1>
          <p className="text-lg text-gray-600">
            ابحث عن المنتجات بصوتك - بالعربي أو الإنجليزي
          </p>
        </motion.div>

        {/* Language Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-full p-1 shadow-lg">
            <button
              onClick={() => setLanguage('ar')}
              className={`px-6 py-2 rounded-full transition-all ${
                language === 'ar' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              العربية
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-6 py-2 rounded-full transition-all ${
                language === 'en' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Voice Button */}
        <motion.div className="flex justify-center mb-8">
          <motion.button
            onClick={toggleListening}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all ${
              isListening 
                ? 'bg-red-500 animate-pulse' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isListening ? (
              <StopIcon className="w-16 h-16 text-white" />
            ) : (
              <MicrophoneIcon className="w-16 h-16 text-white" />
            )}
          </motion.button>
        </motion.div>

        {/* Status */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center mb-8"
            >
              <div className="flex items-center justify-center gap-2 text-indigo-600">
                <SpeakerWaveIcon className="w-6 h-6 animate-pulse" />
                <span className="text-lg">جاري الاستماع...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transcript */}
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg mb-8"
          >
            <h3 className="text-sm font-medium text-gray-500 mb-2">ما قلته:</h3>
            <p className="text-xl text-gray-900">{transcript}</p>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 text-center text-red-600"
          >
            {error}
          </motion.div>
        )}

        {/* Results */}
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold mb-4">نتائج البحث</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.products?.map((product: any, index: number) => (
                <div key={index} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3"></div>
                  <h4 className="font-medium text-gray-900">{product.name}</h4>
                  <p className="text-indigo-600 font-bold">${product.price}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tips */}
        <div className="mt-12 bg-white/50 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">💡 نصائح للبحث الصوتي</h3>
          <ul className="space-y-2 text-gray-600">
            <li>• قل "ابحث عن آيفون 15" للبحث عن منتج</li>
            <li>• قل "أرني أرخص لابتوب" للفلترة بالسعر</li>
            <li>• قل "أضف للسلة" لإضافة المنتج مباشرة</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default VoiceSearchPage
