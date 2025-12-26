import React from 'react';

export default function CareersPage() {
  const jobOpenings = [
    {
      id: 1,
      title: "مطور Full Stack",
      department: "التقنية",
      location: "الرياض، السعودية",
      type: "دوام كامل",
      description: "نبحث عن مطور Full Stack مبدع للانضمام إلى فريقنا التقني."
    },
    {
      id: 2,
      title: "مسوق رقمي",
      department: "التسويق",
      location: "عن بُعد",
      type: "دوام كامل",
      description: "انضم إلى فريق التسويق لدينا لقيادة الحملات الرقمية."
    },
    {
      id: 3,
      title: "مصمم UX/UI",
      department: "التصميم",
      location: "الرياض، السعودية",
      type: "دوام كامل",
      description: "نبحث عن مصمم موهوب لتحسين تجربة المستخدم."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            انضم إلى فريق MNBARH
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            كن جزءاً من ثورة التجارة عبر الحداد
          </p>
          <div className="bg-blue-50 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-lg text-gray-800">
              "نحن نبني مستقبل التجارة العالمية - انضم إلينا في رحلتنا"
            </p>
          </div>
        </div>

        {/* Why Work With Us */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-800 text-center mb-8">
            لماذا MNBARH؟
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                🚀
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">نمو سريع</h3>
              <p className="text-gray-600">
                انضم إلى منصة ناشئة ذات نمو متسارع
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                💡
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">ابتكار مستمر</h3>
              <p className="text-gray-600">
                اعمل على أحدث التقنيات والتحديات
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                🌍
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">تأثير عالمي</h3>
              <p className="text-gray-600">
                غيّر طريقة تسوق الناس حول العالم
              </p>
            </div>
          </div>
        </div>

        {/* Job Openings */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-800 text-center mb-8">
            الوظائف المتاحة
          </h2>
          <div className="space-y-6">
            {jobOpenings.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {job.department}
                      </span>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {job.location}
                      </span>
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                    التقديم الآن
                  </button>
                </div>
                <p className="text-gray-600 mt-4">{job.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-800 text-center mb-8">
            مزايا العمل معنا
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4">
              <div className="text-2xl mb-2">💰</div>
              <h3 className="font-medium text-gray-800">راتب تنافسي</h3>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl mb-2">🏥</div>
              <h3 className="font-medium text-gray-800">تأمين صحي</h3>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-medium text-gray-800">حزم أسهم</h3>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl mb-2">🎓</div>
              <h3 className="font-medium text-gray-800">تطوير مهني</h3>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            لم تجد الوظيفة المناسبة؟
          </h2>
          <p className="text-gray-600 mb-6">
            أرسل لنا سيرتك الذاتية وسنعاود الاتصال بك عند توفر فرص مناسبة
          </p>
          <button className="bg-green-600 text-white px-8 py-3 rounded-md hover:bg-green-700">
            إرسال السيرة الذاتية
          </button>
          <p className="text-sm text-gray-500 mt-4">
            hr@mnbarh.com
          </p>
        </div>
      </div>
    </div>
  );
}