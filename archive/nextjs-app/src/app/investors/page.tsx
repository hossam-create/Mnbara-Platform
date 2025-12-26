import React from 'react';

export default function InvestorsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            المستثمرون
          </h1>
          <p className="text-xl text-gray-600">
            استثمر في مستقبل التجارة عبر الحداد مع MNBARH
          </p>
        </div>

        {/* Investment Highlights */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-800 text-center mb-8">
            لماذا تستثمر في MNBARH؟
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl text-blue-600 mb-4">📈</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">نمو متسارع</h3>
              <p className="text-gray-600">
                نمو بنسبة 300% في أول 6 أشهر
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl text-green-600 mb-4">🌍</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">سوق عالمي</h3>
              <p className="text-gray-600">
                سوق بقيمة 2 تريليون دولار
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl text-purple-600 mb-4">💡</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">تقنية مبتكرة</h3>
              <p className="text-gray-600">
                منصة متكاملة بذكاء اصطناعي
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl text-orange-600 mb-4">🛡️</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">أمان مالي</h3>
              <p className="text-gray-600">
                أنظمة أمان متقدمة
              </p>
            </div>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-800 text-center mb-8">
            المؤشرات المالية
          </h2>
          <div className="bg-gray-50 rounded-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  2M+
                </div>
                <p className="text-gray-600">مستخدم نشط</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  50M+
                </div>
                <p className="text-gray-600">معاملة مكتملة</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  300%
                </div>
                <p className="text-gray-600">نمو سنوي</p>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Opportunities */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-800 text-center mb-8">
            فرص الاستثمار
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                الجولة التمويلية القادمة
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">المبلغ المستهدف:</span>
                  <span className="font-semibold">$10M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">التقييم:</span>
                  <span className="font-semibold">$50M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الموعد النهائي:</span>
                  <span className="font-semibold">31 مارس 2025</span>
                </div>
              </div>
              <button className="w-full mt-6 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700">
                التقديم للاستثمار
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                استثمار مباشر
              </h3>
              <p className="text-gray-600 mb-4">
                فرص استثمارية مباشرة للمستثمرين الاستراتيجيين
              </p>
              <ul className="space-y-2 text-gray-600">
                <li>• استثمارات تبدأ من $100K</li>
                <li>• مشاركة في مجلس الإدارة</li>
                <li>• تقارير مالية شهرية</li>
              </ul>
              <button className="w-full mt-6 bg-green-600 text-white py-3 rounded-md hover:bg-green-700">
                التواصل المباشر
              </button>
            </div>
          </div>
        </div>

        {/* Investor Resources */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-800 text-center mb-8">
            موارد المستثمرين
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-2xl mb-4">📄</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                التقارير المالية
              </h3>
              <p className="text-gray-600">
                أحدث التقارير المالية والبيانات
              </p>
              <button className="mt-4 text-blue-600 hover:text-blue-800">
                تحميل التقارير
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-2xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                عروض التقديم
              </h3>
              <p className="text-gray-600">
                عروض تقديمية للاستثمار
              </p>
              <button className="mt-4 text-blue-600 hover:text-blue-800">
                مشاهدة العروض
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-2xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                بيانات الأداء
              </h3>
              <p className="text-gray-600">
                مؤشرات الأداء الرئيسية
              </p>
              <button className="mt-4 text-blue-600 hover:text-blue-800">
                الاطلاع على البيانات
              </button>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            للاستفسارات الاستثمارية
          </h2>
          <div className="max-w-md mx-auto space-y-2">
            <p className="text-gray-700">
              <strong>نائب الرئيس للشؤون المالية:</strong> أحمد السديس
            </p>
            <p className="text-gray-700">
              <strong>البريد الإلكتروني:</strong> investors@mnbarh.com
            </p>
            <p className="text-gray-700">
              <strong>الهاتف:</strong> +966 12 345 6789
            </p>
          </div>
          <button className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700">
            طلب اجتماع
          </button>
        </div>
      </div>
    </div>
  );
}