import React, { useState } from 'react'

const NotificationSettingsPage: React.FC = () => {
  const [preferences, setPreferences] = useState({
    emailOffers: true,
    emailOrders: true,
    emailNewsletter: false,
    smsOffers: true,
    smsOrders: true,
    pushNotifications: true,
    frequency: 'daily'
  })

  const togglePreference = (key: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const notificationHistory = [
    { type: 'email', title: 'عرض خاص: خصم 30% على الإلكترونيات', date: '2025-12-23', status: 'مرسل' },
    { type: 'sms', title: 'طلبك #12345 قيد التسليم', date: '2025-12-22', status: 'مرسل' },
    { type: 'push', title: 'نقاطك المتراكمة: 2500 نقطة', date: '2025-12-21', status: 'مرسل' },
    { type: 'email', title: 'تقييم الطلب: كيف كانت تجربتك؟', date: '2025-12-20', status: 'مرسل' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🔔 إعدادات الإشعارات</h1>
          <p className="text-lg text-gray-600">تحكم في الإشعارات والرسائل التي تتلقاها</p>
        </div>

        {/* Email Preferences */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            📧 إشعارات البريد الإلكتروني
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">عروض وخصومات</p>
                <p className="text-sm text-gray-600">احصل على أحدث العروض الخاصة</p>
              </div>
              <button
                onClick={() => togglePreference('emailOffers')}
                className={`w-12 h-6 rounded-full transition-all ${
                  preferences.emailOffers ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-all ${
                  preferences.emailOffers ? 'ml-0.5' : 'mr-0.5'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">تحديثات الطلبات</p>
                <p className="text-sm text-gray-600">تتبع حالة طلباتك</p>
              </div>
              <button
                onClick={() => togglePreference('emailOrders')}
                className={`w-12 h-6 rounded-full transition-all ${
                  preferences.emailOrders ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-all ${
                  preferences.emailOrders ? 'ml-0.5' : 'mr-0.5'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">النشرة الإخبارية</p>
                <p className="text-sm text-gray-600">أخبار وتحديثات منبرة</p>
              </div>
              <button
                onClick={() => togglePreference('emailNewsletter')}
                className={`w-12 h-6 rounded-full transition-all ${
                  preferences.emailNewsletter ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-all ${
                  preferences.emailNewsletter ? 'ml-0.5' : 'mr-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* SMS Preferences */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            📱 إشعارات الرسائل النصية
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">عروض وخصومات</p>
                <p className="text-sm text-gray-600">احصل على عروض سريعة عبر SMS</p>
              </div>
              <button
                onClick={() => togglePreference('smsOffers')}
                className={`w-12 h-6 rounded-full transition-all ${
                  preferences.smsOffers ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-all ${
                  preferences.smsOffers ? 'ml-0.5' : 'mr-0.5'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">تحديثات الطلبات</p>
                <p className="text-sm text-gray-600">تنبيهات فورية عن طلباتك</p>
              </div>
              <button
                onClick={() => togglePreference('smsOrders')}
                className={`w-12 h-6 rounded-full transition-all ${
                  preferences.smsOrders ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-all ${
                  preferences.smsOrders ? 'ml-0.5' : 'mr-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            🔔 إشعارات التطبيق
          </h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">تفعيل الإشعارات</p>
              <p className="text-sm text-gray-600">احصل على تنبيهات فورية</p>
            </div>
            <button
              onClick={() => togglePreference('pushNotifications')}
              className={`w-12 h-6 rounded-full transition-all ${
                preferences.pushNotifications ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-all ${
                preferences.pushNotifications ? 'ml-0.5' : 'mr-0.5'
              }`} />
            </button>
          </div>
        </div>

        {/* Frequency */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">⏰ تكرار الإشعارات</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['hourly', 'daily', 'weekly'].map((freq) => (
              <button
                key={freq}
                onClick={() => setPreferences(prev => ({ ...prev, frequency: freq }))}
                className={`p-4 rounded-lg font-medium transition-all ${
                  preferences.frequency === freq
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {freq === 'hourly' ? 'كل ساعة' : freq === 'daily' ? 'يومياً' : 'أسبوعياً'}
              </button>
            ))}
          </div>
        </div>

        {/* Notification History */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 سجل الإشعارات</h2>
          <div className="space-y-4">
            {notificationHistory.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <span className="text-2xl">
                  {item.type === 'email' ? '📧' : item.type === 'sms' ? '📱' : '🔔'}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600">{item.date}</p>
                </div>
                <span className="text-sm font-medium text-green-600">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationSettingsPage
