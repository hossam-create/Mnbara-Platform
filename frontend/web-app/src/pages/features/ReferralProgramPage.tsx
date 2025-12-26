import React, { useState } from 'react'

const ReferralProgramPage: React.FC = () => {
  const [copied, setCopied] = useState(false)
  const referralLink = 'https://mnbara.com/ref/MNB-2025-001234'
  const referralCode = 'MNB001234'
  const totalReferred = 12
  const totalRewards = 1200

  const referralHistory = [
    { name: 'أحمد محمد', date: '2025-12-20', reward: 100, status: 'completed' },
    { name: 'فاطمة علي', date: '2025-12-18', reward: 100, status: 'completed' },
    { name: 'محمود حسن', date: '2025-12-15', reward: 100, status: 'pending' },
  ]

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">👥 برنامج الإحالات</h1>
          <p className="text-lg text-gray-600">أحصل على مكافآت عند إحالة أصدقائك</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-gray-600 mb-2">عدد الإحالات</p>
            <p className="text-4xl font-bold text-blue-600">{totalReferred}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-gray-600 mb-2">المكافآت المكتسبة</p>
            <p className="text-4xl font-bold text-green-600">{totalRewards} نقطة</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-gray-600 mb-2">معدل النجاح</p>
            <p className="text-4xl font-bold text-purple-600">85%</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">رابط الإحالة الخاص بك</h2>
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
            />
            <button
              onClick={copyToClipboard}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {copied ? '✓ تم النسخ' : 'نسخ'}
            </button>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">كود الإحالة:</p>
            <p className="text-2xl font-bold text-blue-600">{referralCode}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="px-4 py-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
              📱 مشاركة عبر WhatsApp
            </button>
            <button className="px-4 py-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
              📧 مشاركة عبر البريد
            </button>
            <button className="px-4 py-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
              🔗 مشاركة الرابط
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">كيف يعمل البرنامج</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: 1, title: 'شارك الرابط', desc: 'أرسل رابط الإحالة لأصدقائك' },
              { step: 2, title: 'التسجيل', desc: 'يقوم صديقك بالتسجيل عبر رابطك' },
              { step: 3, title: 'الشراء الأول', desc: 'يقوم بعملية شراء أولى' },
              { step: 4, title: 'احصل على المكافأة', desc: '100 نقطة لك و50 لصديقك' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral History */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">سجل الإحالات</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 font-bold text-gray-900">الاسم</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-900">التاريخ</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-900">المكافأة</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-900">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {referralHistory.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{item.name}</td>
                    <td className="py-3 px-4 text-gray-600">{item.date}</td>
                    <td className="py-3 px-4 text-green-600 font-bold">+{item.reward}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.status === 'completed' ? '✓ مكتمل' : '⏳ قيد الانتظار'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReferralProgramPage
