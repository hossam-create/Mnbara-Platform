import React, { useState } from 'react'

const SpecialDateRewardsPage: React.FC = () => {
  const [claimedRewards, setClaimedRewards] = useState<string[]>([])

  const specialDates = [
    {
      id: 'birthday',
      type: 'عيد ميلاد',
      date: '2025-01-15',
      daysUntil: 23,
      reward: 500,
      description: 'احصل على 500 نقطة هدية في عيد ميلادك',
      icon: '🎂'
    },
    {
      id: 'anniversary',
      type: 'ذكرى الانضمام',
      date: '2025-12-25',
      daysUntil: 0,
      reward: 300,
      description: 'احصل على 300 نقطة في ذكرى انضمامك',
      icon: '🎉'
    },
    {
      id: 'registration',
      type: 'ذكرى التسجيل',
      date: '2024-12-25',
      daysUntil: -1,
      reward: 200,
      description: 'احصل على 200 نقطة في ذكرى تسجيلك',
      icon: '🎊'
    },
  ]

  const rewardHistory = [
    { date: '2025-12-25', type: 'ذكرى الانضمام', reward: 300, status: 'claimed' },
    { date: '2025-06-15', type: 'عيد ميلاد', reward: 500, status: 'claimed' },
    { date: '2024-12-25', type: 'ذكرى التسجيل', reward: 200, status: 'claimed' },
  ]

  const toggleClaim = (id: string) => {
    setClaimedRewards(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🎁 مكافآت التواريخ الخاصة</h1>
          <p className="text-lg text-gray-600">احصل على مكافآت خاصة في التواريخ المهمة</p>
        </div>

        {/* Upcoming Rewards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🗓️ التواريخ القادمة</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {specialDates.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-pink-400 to-rose-500 p-6 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-4xl">{item.icon}</span>
                    {item.daysUntil === 0 && (
                      <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                        اليوم
                      </span>
                    )}
                    {item.daysUntil > 0 && (
                      <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                        بعد {item.daysUntil} يوم
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold">{item.type}</h3>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-gray-600 text-sm mb-4">{item.description}</p>

                  {/* Reward Badge */}
                  <div className="bg-pink-50 rounded-lg p-4 mb-4 text-center">
                    <p className="text-3xl font-bold text-pink-600">+{item.reward}</p>
                    <p className="text-xs text-gray-600 mt-1">نقطة</p>
                  </div>

                  {/* Date */}
                  <p className="text-sm text-gray-600 mb-4 text-center">📅 {item.date}</p>

                  {/* Claim Button */}
                  <button
                    onClick={() => toggleClaim(item.id)}
                    disabled={item.daysUntil < 0}
                    className={`w-full py-2 rounded-lg font-medium transition-all ${
                      claimedRewards.includes(item.id)
                        ? 'bg-green-500 text-white'
                        : item.daysUntil < 0
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                    }`}
                  >
                    {claimedRewards.includes(item.id) ? '✓ تم الاستلام' : item.daysUntil < 0 ? 'انتهى' : 'استلام المكافأة'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">كيف يعمل البرنامج</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                📅
              </div>
              <h3 className="font-bold text-gray-900 mb-2">التواريخ المهمة</h3>
              <p className="text-gray-600 text-sm">نتذكر عيد ميلادك وذكرى انضمامك</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                🎁
              </div>
              <h3 className="font-bold text-gray-900 mb-2">مكافآت خاصة</h3>
              <p className="text-gray-600 text-sm">احصل على نقاط إضافية في تلك الأيام</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                ✨
              </div>
              <h3 className="font-bold text-gray-900 mb-2">استمتع بالمزايا</h3>
              <p className="text-gray-600 text-sm">استخدم النقاط في الشراء والخصومات</p>
            </div>
          </div>
        </div>

        {/* Reward History */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 سجل المكافآت</h2>
          <div className="space-y-4">
            {rewardHistory.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div>
                  <p className="font-medium text-gray-900">{item.type}</p>
                  <p className="text-sm text-gray-600">{item.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-pink-600">+{item.reward}</p>
                  <p className="text-xs text-green-600 font-medium">✓ {item.status === 'claimed' ? 'تم الاستلام' : 'قيد الانتظار'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpecialDateRewardsPage
