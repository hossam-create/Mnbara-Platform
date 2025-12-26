import React from 'react';

export default function PressPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            الصحافة والإعلام
          </h1>
          <p className="text-xl text-gray-600">
            أحدث الأخبار والتغطيات الإعلامية عن منصة MNBARH
          </p>
        </div>

        {/* Press Releases */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            البيانات الصحفية
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                إطلاق منصة MNBARH رسمياً
              </h3>
              <p className="text-gray-600 mb-4">
                23 ديسمبر 2024 - الرياض، السعودية
              </p>
              <p className="text-gray-700 mb-4">
                أطلقت منصة MNBARH رسمياً، المنصة الرائدة في التجارة عبر الحداد 
                التي تربط المسافرين بالمشترين حول العالم.
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                قراءة المزيد
              </button>
            </div>
          </div>
        </div>

        {/* Media Coverage */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            التغطيات الإعلامية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                الاقتصادية
              </h3>
              <p className="text-gray-600 mb-4">
                "منصة MNBARH تُحدث ثورة في التجارة عبر الحداد"
              </p>
              <p className="text-sm text-gray-500">
                20 ديسمبر 2024
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                العربية
              </h3>
              <p className="text-gray-600 mb-4">
                "كيف تغير MNBARH طريقة تسوقنا عالمياً"
              </p>
              <p className="text-sm text-gray-500">
                18 ديسمبر 2024
              </p>
            </div>
          </div>
        </div>

        {/* Press Kit */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            مواد صحفية
          </h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              حزمة الصحافة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-4 mb-2">
                  📸
                </div>
                <p className="text-sm font-medium text-gray-700">صور عالية الجودة</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-4 mb-2">
                  📄
                </div>
                <p className="text-sm font-medium text-gray-700">شعارات</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-4 mb-2">
                  📊
                </div>
                <p className="text-sm font-medium text-gray-700">معلومات الشركة</p>
              </div>
            </div>
            <button className="mt-6 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700">
              تحميل الحزمة الصحفية
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            للاستفسارات الإعلامية
          </h2>
          <div className="space-y-2">
            <p className="text-gray-700">
              <strong>البريد الإلكتروني:</strong> press@mnbarh.com
            </p>
            <p className="text-gray-700">
              <strong>الهاتف:</strong> +966 12 345 6789
            </p>
            <p className="text-gray-700">
              <strong>المقر الرئيسي:</strong> الرياض، السعودية
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}