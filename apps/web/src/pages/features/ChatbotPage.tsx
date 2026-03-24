import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PaperAirplaneIcon, 
  SparklesIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'مرحباً! أنا مساعدك الذكي في منبرة. كيف يمكنني مساعدتك اليوم؟', sender: 'bot', timestamp: new Date() }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(() => { scrollToBottom() }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user', timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        text: getBotResponse(input), 
        sender: 'bot', 
        timestamp: new Date() 
      }
      setMessages(prev => [...prev, botMsg])
      setIsTyping(false)
    }, 1000)
  }

  const getBotResponse = (query: string): string => {
    const q = query.toLowerCase()
    if (q.includes('سعر') || q.includes('price')) return 'يمكنك مشاهدة الأسعار في صفحة المنتج. هل تريد مساعدة في البحث عن منتج معين؟'
    if (q.includes('شحن') || q.includes('delivery')) return 'نوفر شحن سريع خلال 3-5 أيام. الشحن مجاني للطلبات فوق 200 ريال.'
    if (q.includes('إرجاع') || q.includes('return')) return 'سياسة الإرجاع لدينا 14 يوم. يمكنك إرجاع المنتج بحالته الأصلية.'
    return 'شكراً لسؤالك! سأساعدك في إيجاد ما تبحث عنه. هل يمكنك توضيح المزيد؟'
  }

  const quickActions = ['ما هي طرق الدفع؟', 'كيف أتتبع طلبي؟', 'سياسة الإرجاع', 'تواصل مع الدعم']

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">💬 المساعد الذكي</h1>
          <p className="text-gray-600">متاح 24/7 للإجابة على استفساراتك</p>
        </motion.div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-emerald-600 p-4 flex items-center gap-3">
            <SparklesIcon className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-white font-semibold">مساعد منبرة</h2>
              <p className="text-emerald-100 text-sm">متصل الآن</p>
            </div>
          </div>

          <div className="h-96 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    msg.sender === 'user' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-900'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t">
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {quickActions.map((action, i) => (
                <button key={i} onClick={() => setInput(action)} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm whitespace-nowrap hover:bg-emerald-100">
                  {action}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="اكتب رسالتك..."
                className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <motion.button
                onClick={sendMessage}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatbotPage
