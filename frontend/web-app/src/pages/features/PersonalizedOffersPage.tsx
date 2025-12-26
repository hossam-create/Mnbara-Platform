import React, { useState } from 'react'

const PersonalizedOffersPage: React.FC = () => {
  const [appliedOffers, setAppliedOffers] = useState<string[]>([])

  const offers = [
    {
      id: 1,
      title: 'خصم 30% على الإلكترونيات',
      description: 'بناءً على تاريخ شرائك من فئة الإلكترونيات',
      discount: 30,
      category: 'إلكترونيات',
      expiresIn: '3 أيام',
      minPurchase: 500,
      icon: '📱'
    },
    {
      id: 2,
      title: 'شحن مجاني على الملابس',
      description: 'عرض خاص للعملاء المتكررين',
      discount: 'مجاني',
      category: 'ملابس',
      expiresIn: '7 أيام',
      minPurchase: 200,
      icon: '👕'
    },
    {
      id: 3,
      title: 'اشتري 2 واحصل على 1 مجاني',
      description: 'على المنتجات المختارة من الكتب',
      discount: '50%',
      category: 'كتب',
      expiresIn: '5 أيام',
      minPurchase: 100,
      icon: '📚'
    },
    {
      id: 4,
      title: 'خصم 25% على الأثاث',
      description: 'عرض حصري للعملاء VIP',
      discount: 25,
      category: 'أثاث',
      expiresIn: '10 أيام',
      minPurchase: 1000,
      icon: '🛋️'
    },
    {
      id: 5,
      title: 'نقاط مضاعفة على الجمال',
      description: 'احصل على ضعف النقاط على منتجات الجمال',
      discount: '2x نقاط',
      category: 'جمال',
      expiresIn: '4 أيام',
      minPurchase: 150,
      icon: '💄'
    },
    {
      id: 6,
      title: 'خصم 20% على الأحذية',
      description: 'عرض موسمي خاص بك',
      discount: 20,
      category: 'أحذية',
      expiresIn: '6 أيام',
      minPurchase: 300,
      icon: '👟'
    }
  ]

  const toggleOffer = (id: string) => {
    setAppliedOffers(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🎉 عروض مخصصة لك</h1>
          <p className="text-lg text-gray-600">عروض مختارة بناءً على تاريخ شرائك</p>
        </div>

        {/* Applied Offers Summary */}
        {appliedOffers.length > 0 && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-8">
            <p className="text-green-800">
              ✓ تم تطبيق {appliedOffers.length} عرض على سلتك
            </p>
          </div>
        )}

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-400 to-red-500 p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{offer.icon}</span>
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">{offer.category}</span>
                </div>
                <h3 className="text-lg font-bold">{offer.title}</h3>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-gray-600 text-sm mb-4">{offer.description}</p>

                {/* Discount Badge */}
                <div className="bg-orange-50 rounded-lg p-3 mb-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {typeof offer.discount === 'number' ? `${offer.discount}%` : offer.discount}
                  </p>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <p>⏰ ينتهي في: {offer.expiresIn}</p>
                  <p>💰 الحد الأدنى: {offer.minPurchase} ريال</p>
                </div>

                {/* Apply Button */}
                <button
                  onClick={() => toggleOffer(offer.id.toString())}
                  className={`w-full py-2 rounded-lg font-medium transition-all ${
                    appliedOffers.includes(offer.id.toString())
                      ? 'bg-green-500 text-white'
                      : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                  }`}
                >
                  {appliedOffers.includes(offer.id.toString()) ? '✓ مطبق' : 'تطبيق العرض'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Offer History */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">سجل العروض</h2>
          <div className="space-y-4">
            {[
              { title: 'خصم 20% على الإلكترونيات', date: '2025-12-20', status: 'منتهي', savings: 150 },
              { title: 'شحن مجاني', date: '2025-12-15', status: 'مستخدم', savings: 50 },
              { title: 'نقاط مضاعفة', date: '2025-12-10', status: 'مستخدم', savings: 200 },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600">{item.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{item.status}</p>
                  <p className="text-green-600 font-bold">توفير: {item.savings} ريال</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersonalizedOffersPage
