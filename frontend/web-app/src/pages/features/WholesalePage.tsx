import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BuildingStorefrontIcon, 
  TruckIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface WholesaleProduct {
  id: string
  name: string
  minOrder: number
  pricePerUnit: number
  discount: string
  category: string
}

const WholesalePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = ['all', 'electronics', 'fashion', 'home', 'beauty']
  const products: WholesaleProduct[] = [
    { id: '1', name: 'سماعات بلوتوث', minOrder: 50, pricePerUnit: 25, discount: '40%', category: 'electronics' },
    { id: '2', name: 'تيشيرتات قطن', minOrder: 100, pricePerUnit: 8, discount: '50%', category: 'fashion' },
    { id: '3', name: 'شموع معطرة', minOrder: 200, pricePerUnit: 3, discount: '60%', category: 'home' },
    { id: '4', name: 'كريم مرطب', minOrder: 150, pricePerUnit: 5, discount: '45%', category: 'beauty' },
  ]

  const benefits = [
    { icon: CurrencyDollarIcon, title: 'أسعار الجملة', desc: 'خصومات تصل إلى 60%' },
    { icon: TruckIcon, title: 'شحن مجاني', desc: 'للطلبات فوق 5000 ريال' },
    { icon: ShieldCheckIcon, title: 'ضمان الجودة', desc: 'منتجات أصلية 100%' },
    { icon: ChartBarIcon, title: 'تقارير مفصلة', desc: 'تتبع مبيعاتك' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🏢 سوق الجملة B2B</h1>
          <p className="text-lg text-gray-600">أسعار خاصة للتجار وأصحاب المشاريع</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {benefits.map((benefit, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl p-6 text-center shadow-lg">
              <benefit.icon className="w-12 h-12 mx-auto mb-3 text-amber-600" />
              <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
              <p className="text-sm text-gray-500">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full whitespace-nowrap ${selectedCategory === cat ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {cat === 'all' ? 'الكل' : cat === 'electronics' ? 'إلكترونيات' : cat === 'fashion' ? 'أزياء' : cat === 'home' ? 'منزل' : 'تجميل'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.filter(p => selectedCategory === 'all' || p.category === selectedCategory).map((product) => (
              <motion.div key={product.id} whileHover={{ y: -5 }} className="border rounded-xl p-4 hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  <BuildingStorefrontIcon className="w-16 h-16 text-gray-300" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-amber-600 font-bold">${product.pricePerUnit}/قطعة</span>
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">-{product.discount}</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">الحد الأدنى: {product.minOrder} قطعة</p>
                <button className="w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">طلب عرض سعر</button>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-amber-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">هل أنت تاجر؟</h2>
          <p className="mb-6">سجل الآن واحصل على خصم 10% إضافي على أول طلب</p>
          <button className="px-8 py-3 bg-white text-amber-600 rounded-xl font-semibold hover:bg-gray-100">
            سجل كتاجر جملة
          </button>
        </div>
      </div>
    </div>
  )
}

export default WholesalePage
