import React from 'react';

export default function AffiliatesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            برنامج الشركاء
          </h1>
          <p className="text-xl text-gray-600">
            انضم إلى برنامج شركاء MNBARH واكسب معنا
          </p>
        </div>

        {/* Program Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-800 text-center mb-8">
            لماذا تنضم إلى برنامج الشركاء؟
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                أرباح عالية
              </h3>
              <p className="text-gray-600">
                عمولات تصل إلى 30% على كل عملية بيع
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎁</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                مكافآت شهرية
              </h3>
              <p className="text-gray-600">
                مكافآت إضافية لأفضل الأداء
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                أدوات متقدمة
              </h3>
              <p className="text-gray-600">
                منصة متكاملة لتتبع الأداء
              </p>
            </div>
          </div>
        </div>

        {/* Commission Structure */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-800 text-center mb-8">
            هيكل العمولات
          </h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    مستوى الأداء
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العمولة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبيعات المطلوبة
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    مبتدئ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    15%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    0-10 مبيعات
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    متقدم
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    20%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    11-50 مبيعات
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    محترف
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    25%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    51-100 مبيعات
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    نخبة
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    30%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    100+ مبيعات
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-800 text-center mb-8">
            كيف يعمل البرنامج؟
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                انضم
              </h3>
              <p className="text-gray-600">
                سجل في برنامج الشركاء
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                انشر
              </h3>
              <p className="text-gray-600">
                انشر رابطك الخاص
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                اكسب
              </h3>
              <p className="text-gray-600">
                احصل على عمولات على المبيعات
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                تابع
              </h3>
              <p className="text-gray-600">
                تتبع أرباحك في الوقت الحقيقي
              </p>
            </div>
          </div>
        </div>

        {/* Affiliate Tools */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-800 text-center mb-8">
            أدوات الشركاء
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-2xl text-blue-600 mb-4">🔗</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                روابط تتبع
              </h3>
              <p className="text-gray-600">
                روابط تتبع فريدة لكل شريك
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-2xl text-green-600 mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                لوحة تحكم
              </h3>
              <p className="text-gray-600">
                إحصائيات وأداء في الوقت الحقيقي
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-2xl text-purple-600 mb-4">🎨</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                مواد ترويجية
              </h3>
              <p className="text-gray-600">
                بانرات وصور وفيديوهات
              </p>
            </div>
          </div>
        </div>

        {/* Registration */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-semibold mb-4">
            انضم إلى برنامج الشركاء اليوم
          </h2>
          <p className="mb-6 opacity-90">
            ابدأ في كسب العمولات من اليوم الأول
          </p>
          <div className="max-w-md mx-auto">
            <button className="w-full bg-white text-blue-600 px-8 py-4 rounded-md font-semibold hover:bg-gray-100">
              التسجيل في برنامج الشركاء
            </button>
            <p className="text-sm opacity-80 mt-4">
              التسجيل مجاني ولا يتطلب أي رسوم
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-12 bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            لديك استفسارات؟
          </h2>
          <p className="text-gray-600 mb-6">
            فريق دعم الشركاء جاهز لمساعدتك
          </p>
          <div className="space-y-2">
            <p className="text-gray-700">
              <strong>البريد الإلكتروني:</strong> affiliates@mnbarh.com
            </p>
            <p className="text-gray-700">
              <strong>الهاتف:</strong> +966 12 345 6789
            </p>
            <p className="text-gray-700">
              <strong>ساعات العمل:</strong> الأحد - الخميس، 8 ص - 5 م
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}