import React, { useState } from 'react'

const AnalyticsDashboardPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('year')

  const stats = {
    totalPurchases: 45,
    totalSpent: 12500,
    averageOrderValue: 278,
    lastPurchase: '2025-12-23',
    engagementScore: 92,
    favoriteCategory: 'إلكترونيات'
  }

  const monthlyData = [
    { month: 'يناير', purchases: 3, spent: 800 },
    { month: 'فبراير', purchases: 4, spent: 950 },
    { month: 'مارس', purchases: 2, spent: 600 },
    { month: 'أبريل', purchases: 5, spent: 1200 },
    { month: 'مايو', purchases: 3, spent: 750 },
    { month: 'يونيو', purchases: 4, spent: 1100 },
  ]

  const categoryBreakdown = [
    { category: 'إلكترونيات', percentage: 35, amount: 4375 },
    { category: 'ملابس', percentage: 25, amount: 3125 },
    { category: 'كتب', percentage: 20, amount: 2500 },
    { category: 'أثاث', percentage: 15, amount: 1875 },
    { category: 'أخرى', percentage: 5, amount: 625 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">📊 لوحة التحليلات</h1>
          <p className="text-lg text-gray-600">احصائيات شاملة عن نشاطك</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-8 justify-center">
          {['week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeRange === range
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}
            >
              {range === 'week' ? 'أسبوع' : range === 'month' ? 'شهر' : 'سنة'}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-600 mb-2">إجمالي المشتريات</p>
            <p className="text-4xl font-bold text-teal-600">{stats.totalPurchases}</p>
            <p className="text-sm text-gray-500 mt-2">عملية شراء</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-600 mb-2">إجمالي الإنفاق</p>
            <p className="text-4xl font-bold text-green-600">{stats.totalSpent.toLocaleString()} ريال</p>
            <p className="text-sm text-gray-500 mt-2">منذ الانضمام</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-600 mb-2">متوسط قيمة الطلب</p>
            <p className="text-4xl font-bold text-blue-600">{stats.averageOrderValue} ريال</p>
            <p className="text-sm text-gray-500 mt-2">لكل عملية</p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-600 mb-2">آخر عملية شراء</p>
            <p className="text-2xl font-bold text-gray-900">{stats.lastPurchase}</p>
            <p className="text-sm text-gray-500 mt-2">منذ يومين</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-600 mb-2">درجة الانخراط</p>
            <div className="flex items-center gap-3">
              <p className="text-4xl font-bold text-purple-600">{stats.engagementScore}%</p>
              <div className="text-2xl">⭐</div>
            </div>
            <p className="text-sm text-gray-500 mt-2">نشاط عالي جداً</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-600 mb-2">الفئة المفضلة</p>
            <p className="text-2xl font-bold text-gray-900">{stats.favoriteCategory}</p>
            <p className="text-sm text-gray-500 mt-2">35% من الإنفاق</p>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">الاتجاه الشهري</h2>
          <div className="space-y-4">
            {monthlyData.map((data) => (
              <div key={data.month}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-900">{data.month}</span>
                  <span className="text-gray-600">{data.purchases} عملية - {data.spent} ريال</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    style={{ width: `${(data.spent / 1200) * 100}%` }}
                    className="bg-gradient-to-r from-teal-400 to-cyan-500 h-2 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">توزيع الفئات</h2>
          <div className="space-y-4">
            {categoryBreakdown.map((item) => (
              <div key={item.category}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-900">{item.category}</span>
                  <span className="text-gray-600">{item.percentage}% ({item.amount} ريال)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    style={{ width: `${item.percentage}%` }}
                    className="bg-gradient-to-r from-teal-400 to-cyan-500 h-3 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboardPage
