import React, { useState } from 'react'

const CustomerSupportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat')
  const [messages, setMessages] = useState([
    { id: 1, sender: 'support', text: 'مرحباً! كيف يمكننا مساعدتك؟', time: '10:00' },
  ])
  const [inputMessage, setInputMessage] = useState('')

  const faqs = [
    {
      question: 'كيف أتتبع طلبي؟',
      answer: 'يمكنك تتبع طلبك من خلال قسم "الطلبات" في حسابك. ستجد رقم التتبع والحالة الحالية للشحنة.'
    },
    {
      question: 'ما هي سياسة الإرجاع؟',
      answer: 'يمكنك إرجاع المنتجات خلال 30 يوماً من الشراء. يجب أن يكون المنتج في حالة جديدة وغير مستخدم.'
    },
    {
      question: 'كيف أغير كلمة المرور؟',
      answer: 'اذهب إلى الإعدادات > الأمان > تغيير كلمة المرور. اتبع الخطوات لتعيين كلمة مرور جديدة.'
    },
    {
      question: 'هل يمكنني إلغاء طلبي؟',
      answer: 'نعم، يمكنك إلغاء الطلب قبل أن يتم شحنه. اذهب إلى تفاصيل الطلب واختر "إلغاء الطلب".'
    },
    {
      question: 'كم تستغرق عملية الشحن؟',
      answer: 'عادة ما تستغرق عملية الشحن 2-5 أيام عمل حسب موقعك والخدمة المختارة.'
    },
    {
      question: 'هل هناك رسوم توصيل؟',
      answer: 'نعم، تختلف رسوم التوصيل حسب الموقع والوزن. يمكنك رؤية الرسوم قبل إتمام الشراء.'
    },
  ]

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      setMessages([...messages, { id: messages.length + 1, sender: 'user', text: inputMessage, time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) }])
      setInputMessage('')
      // Simulate support response
      setTimeout(() => {
        setMessages(prev => [...prev, { id: prev.length + 1, sender: 'support', text: 'شكراً على رسالتك. سيتم الرد عليك قريباً.', time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) }])
      }, 1000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">💬 دعم العملاء</h1>
          <p className="text-lg text-gray-600">نحن هنا لمساعدتك 24/7</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 justify-center">
          {['chat', 'faq', 'contact'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab === 'chat' ? '💬 الدردشة المباشرة' : tab === 'faq' ? '❓ الأسئلة الشائعة' : '📧 اتصل بنا'}
            </button>
          ))}
        </div>

        {/* Live Chat */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Chat Header */}
            <div className="bg-blue-600 text-white p-6">
              <h2 className="text-xl font-bold">الدردشة المباشرة مع فريق الدعم</h2>
              <p className="text-blue-100 text-sm">متوسط وقت الرد: أقل من دقيقة</p>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}>
                    <p>{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="اكتب رسالتك..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  إرسال
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAQs */}
        {activeTab === 'faq' && (
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <h3 className="text-lg font-bold text-gray-900 mb-3">❓ {faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        )}

        {/* Contact Form */}
        {activeTab === 'contact' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">اتصل بنا</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">الاسم</label>
                <input
                  type="text"
                  placeholder="أدخل اسمك"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  placeholder="أدخل بريدك الإلكتروني"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">الموضوع</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>اختر الموضوع</option>
                  <option>شكوى</option>
                  <option>استفسار</option>
                  <option>اقتراح</option>
                  <option>أخرى</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">الرسالة</label>
                <textarea
                  placeholder="اكتب رسالتك"
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                إرسال الرسالة
              </button>
            </form>

            {/* Contact Info */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">معلومات التواصل</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl mb-2">📞</p>
                  <p className="text-sm text-gray-600">الهاتف</p>
                  <p className="font-medium text-gray-900">+966 11 1234 5678</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl mb-2">📧</p>
                  <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                  <p className="font-medium text-gray-900">support@mnbarh.com</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl mb-2">🕐</p>
                  <p className="text-sm text-gray-600">ساعات العمل</p>
                  <p className="font-medium text-gray-900">24/7</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerSupportPage
