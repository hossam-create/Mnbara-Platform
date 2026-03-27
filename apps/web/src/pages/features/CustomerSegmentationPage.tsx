import React, { useState } from 'react'

const CustomerSegmentationPage: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState('frequent')

  const segments = [
    {
      id: 'vip',
      name: 'VIP',
      icon: '👑',
      description: 'أعلى 5% من المشترين',
      criteria: 'إنفاق أكثر من 50,000 ريال',
      benefits: ['خصم 25%', 'مدير حساب مخصص', 'أولوية مطلقة في الدعم', 'عروض حصرية'],
      members: 750,
      color: 'from-yellow-400 to-orange-500'
    },
    {
      id: 'frequent',
      name: 'المشترون المتكررون',
      icon: '⭐',
      description: 'المشترون المنتظمون',
      criteria: 'أكثر من 10 عمليات شراء سنوياً',
      benefits: ['خصم 15%', 'شحن مجاني', 'دعم أولوي', 'عروض خاصة'],
      members: 5200,
      color: 'from-blue-400 to-cyan-500'
    },
    {
      id: 'occasional',
      name: 'المشترون العرضيون',
      icon: '🛍️',
      description: 'المشترون غير المنتظمين',
      criteria: '1-10 عمليات شراء سنوياً',
      benefits: ['خصم 10%', 'عروض موسمية', 'دعم عادي'],
      members: 8900,
      color: 'from-green-400 to-emerald-500'
    },
    {
      id: 'inactive',
      name: 'غير النشطين',
      icon: '😴',
      description: 'لم يشتروا في آخر 90 يوم',
      criteria: 'عدم النشاط لمدة 90 يوم',
      benefits: ['عروض استرجاع', 'خصم ترحيب', 'رسائل تذكيرية'],
      members: 3400,
      color: 'from-gray-400 to-slate-500'
    },
    {
      id: 'at_risk',
      name: 'المعرضون للخطر',
      icon: '⚠️',
      description: 'انخفاض في النشاط',
      criteria: 'انخفاض 50% في الشراء',
      benefits: ['عروض خاصة', 'خصم 20%', 'استطلاع رأي'],
      members: 1200,
      color: 'from-red-400 to-pink-500'
    }
  ]

  const current = segments.find(s => s.id === selectedSegment)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">📊 تقسيم العملاء</h1>
          <p className="text-lg text-gray-600">اكتشف فئتك واستمتع بالمزايا المخصصة</p>
        </div>

        {/* Current Segment */}
        {current && (
          <div className={`bg-gradient-to-r ${current.color} rounded-2xl shadow-lg p-8 mb-8 text-white`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-white/80 mb-2">فئتك الحالية</p>
                <h2 className="text-4xl font-bold">{current.icon} {current.name}</h2>
              </div>
              <div className="text-right">
                <p className="text-white/80 mb-2">عدد الأعضاء</p>
                <p className="text-3xl font-bold">{current.members.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-white/90 mb-4">{current.description}</p>
            <p className="text-white/80">المعايير: {current.criteria}</p>
          </div>
        )}

        {/* Segments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {segments.map((segment) => (
            <button
              key={segment.id}
              onClick={() => setSelectedSegment(segment.id)}
              className={`rounded-xl p-4 transition-all cursor-pointer ${
                selectedSegment === segment.id
                  ? `bg-gradient-to-r ${segment.color} text-white shadow-lg scale-105`
                  : 'bg-white text-gray-900 hover:shadow-lg'
              }`}
            >
              <div className="text-3xl mb-2">{segment.icon}</div>
              <h3 className="font-bold mb-1">{segment.name}</h3>
              <p className={`text-xs ${selectedSegment === segment.id ? 'text-white/80' : 'text-gray-600'}`}>
                {segment.members.toLocaleString()} عضو
              </p>
            </button>
          ))}
        </div>

        {/* Benefits */}
        {current && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">مزايا الفئة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {current.benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <span className="text-2xl">✨</span>
                  <span className="text-gray-900 font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Segment Comparison */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">مقارنة الفئات</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 font-bold text-gray-900">الفئة</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-900">الخصم</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-900">الدعم</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-900">الشحن</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-900">العروض</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((segment) => (
                  <tr key={segment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{segment.icon} {segment.name}</td>
                    <td className="py-3 px-4 text-gray-600">{segment.benefits[0]}</td>
                    <td className="py-3 px-4 text-gray-600">{segment.benefits[2] || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{segment.benefits[1] || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{segment.benefits[3] || '-'}</td>
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

export default CustomerSegmentationPage
