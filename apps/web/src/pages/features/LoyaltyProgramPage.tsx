import React, { useState } from 'react'

const LoyaltyProgramPage: React.FC = () => {
  const [userTier, setUserTier] = useState('silver')
  const points = 2500

  const tiers = [
    { name: 'Bronze', icon: '🥉', minPoints: 0, maxPoints: 1000, benefits: ['5% خصم', 'دعم أولي'] },
    { name: 'Silver', icon: '🥈', minPoints: 1001, maxPoints: 5000, benefits: ['10% خصم', 'دعم أولوي', 'شحن مجاني'] },
    { name: 'Gold', icon: '🥇', minPoints: 5001, maxPoints: 10000, benefits: ['15% خصم', 'دعم VIP', 'عروض حصرية'] },
    { name: 'Platinum', icon: '💎', minPoints: 10001, maxPoints: Infinity, benefits: ['20% خصم', 'مدير حساب', 'أولوية مطلقة'] },
  ]

  const currentTier = tiers.find(t => t.name.toLowerCase() === userTier)
  const progressPercent = ((points - (currentTier?.minPoints || 0)) / ((currentTier?.maxPoints || 10000) - (currentTier?.minPoints || 0))) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🎁 برنامج الولاء</h1>
          <p className="text-lg text-gray-600">اجمع النقاط واستمتع بمزايا حصرية</p>
        </div>

        {/* Current Tier Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-gray-600 mb-2">مستواك الحالي</p>
              <h2 className="text-3xl font-bold text-gray-900">{currentTier?.icon} {currentTier?.name}</h2>
            </div>
            <div className="text-right">
              <p className="text-gray-600 mb-2">النقاط المتراكمة</p>
              <p className="text-4xl font-bold text-purple-600">{points}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">التقدم نحو المستوى التالي</span>
              <span className="text-sm font-medium text-purple-600">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                style={{ width: `${progressPercent}%` }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
              />
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentTier?.benefits.map((benefit, i) => (
              <div key={i} className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-sm font-medium text-purple-900">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tiers Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl p-6 cursor-pointer transition-all ${
                userTier === tier.name.toLowerCase()
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-900 hover:shadow-lg'
              }`}
            >
              <div className="text-4xl mb-3">{tier.icon}</div>
              <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
              <p className="text-sm opacity-75 mb-4">{tier.minPoints.toLocaleString()} - {tier.maxPoints === Infinity ? '∞' : tier.maxPoints.toLocaleString()}</p>
              <button
                onClick={() => setUserTier(tier.name.toLowerCase())}
                className={`w-full py-2 rounded-lg font-medium transition-all ${
                  userTier === tier.name.toLowerCase()
                    ? 'bg-white text-purple-600'
                    : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                }`}
              >
                اختر
              </button>
            </div>
          ))}
        </div>

        {/* How to Earn Points */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">كيفية جمع النقاط</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🛍️', title: 'التسوق', desc: 'نقطة واحدة لكل ريال' },
              { icon: '👥', title: 'الإحالات', desc: '100 نقطة لكل عميل جديد' },
              { icon: '⭐', title: 'التقييمات', desc: '50 نقطة لكل تقييم' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoyaltyProgramPage
