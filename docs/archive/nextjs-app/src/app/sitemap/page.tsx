import React from 'react';

export default function SitemapPage() {
  const siteSections = [
    {
      title: "التسوق",
      links: [
        { name: "جميع الفئات", href: "/categories" },
        { name: "العروض الخاصة", href: "/deals" },
        { name: "المنتجات الجديدة", href: "/new-arrivals" },
        { name: "الأكثر مبيعاً", href: "/best-sellers" },
        { name: "المزادات", href: "/auctions" }
      ]
    },
    {
      title: "الحساب",
      links: [
        { name: "تسجيل الدخول", href: "/login" },
        { name: "إنشاء حساب", href: "/register" },
        { name: "طلباتي", href: "/orders" },
        { name: "مفضلاتي", href: "/wishlist" },
        { name: "عنواني", href: "/addresses" },
        { name: "إعدادات الحساب", href: "/settings" }
      ]
    },
    {
      title: "المساعدة",
      links: [
        { name: "مركز المساعدة", href: "/help" },
        { name: "الشحن والتوصيل", href: "/shipping" },
        { name: "الإرجاع والاستبدال", href: "/returns" },
        { name: "طرق الدفع", href: "/payment-methods" },
        { name: "تتبع الطلب", href: "/track-order" },
        { name: "الأسئلة الشائعة", href: "/faq" }
      ]
    },
    {
      title: "عن MNBARH",
      links: [
        { name: "من نحن", href: "/about" },
        { name: "اتصل بنا", href: "/contact" },
        { name: "المركز الإعلامي", href: "/press" },
        { name: "الوظائف", href: "/careers" },
        { name: "المستثمرون", href: "/investors" },
        { name: "الشركاء", href: "/affiliates" }
      ]
    },
    {
      title: "القوانين والسياسات",
      links: [
        { name: "شروط الاستخدام", href: "/terms" },
        { name: "سياسة الخصوصية", href: "/privacy" },
        { name: "سياسة الكوكيز", href: "/cookies" },
        { name: "سياسة الإرجاع", href: "/return-policy" },
        { name: "ضمان المنتج", href: "/warranty" },
        { name: "الشروط والأحكام", href: "/terms-and-conditions" }
      ]
    },
    {
      title: "خدمات إضافية",
      links: [
        { name: "MNBARH للجوال", href: "/mobile-app" },
        { name: "برنامج الولاء", href: "/loyalty" },
        { name: "الهدايا والقسائم", href: "/gift-cards" },
        { name: "التوصيات", href: "/recommendations" },
        { name: "المقارنة", href: "/compare" },
        { name: "التقييمات", href: "/reviews" }
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            خريطة الموقع
          </h1>
          <p className="text-xl text-gray-600">
            استكشف جميع صفحات ومنتجات MNBARH
          </p>
        </div>

        {/* Search Box */}
        <div className="mb-12">
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              ابحث في الموقع
            </h2>
            <div className="flex">
              <input
                type="text"
                placeholder="ابحث عن منتج أو صفحة..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="bg-blue-600 text-white px-6 py-2 rounded-r-md hover:bg-blue-700">
                بحث
              </button>
            </div>
          </div>
        </div>

        {/* Sitemap Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {siteSections.map((section, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {section.title}
              </h2>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Popular Categories */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-8">
            الفئات الشائعة
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              "إلكترونيات",
              "ملابس",
              "أجهزة منزلية",
              "جوالات",
              "ألعاب",
              "كتب",
              "رياضة",
              "جمال",
              "سيارات",
              "أثاث",
              "تحف",
              "ساعات"
            ].map((category, index) => (
              <a
                key={index}
                href={`/category/${category}`}
                className="bg-gray-100 hover:bg-gray-200 rounded-md px-4 py-2 text-center text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {category}
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
            روابط سريعة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <h3 className="font-medium text-gray-700 mb-2">خدمة العملاء</h3>
              <div className="space-y-1">
                <a href="/contact" className="text-blue-600 hover:underline text-sm">
                  اتصل بنا
                </a>
                <br />
                <a href="/help" className="text-blue-600 hover:underline text-sm">
                  المساعدة
                </a>
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-medium text-gray-700 mb-2">حسابي</h3>
              <div className="space-y-1">
                <a href="/orders" className="text-blue-600 hover:underline text-sm">
                  طلباتي
                </a>
                <br />
                <a href="/settings" className="text-blue-600 hover:underline text-sm">
                  الإعدادات
                </a>
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-medium text-gray-700 mb-2">عن MNBARH</h3>
              <div className="space-y-1">
                <a href="/about" className="text-blue-600 hover:underline text-sm">
                  من نحن
                </a>
                <br />
                <a href="/careers" className="text-blue-600 hover:underline text-sm">
                  الوظائف
                </a>
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-medium text-gray-700 mb-2">التسوق</h3>
              <div className="space-y-1">
                <a href="/deals" className="text-blue-600 hover:underline text-sm">
                  العروض
                </a>
                <br />
                <a href="/categories" className="text-blue-600 hover:underline text-sm">
                  الفئات
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* XML Sitemap Info */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            خريطة الموقع لبرامج الزحف
          </h2>
          <p className="text-gray-600 mb-4">
            لمحركات البحث وبرامج الزحف، يمكنك استخدام:
          </p>
          <code className="bg-white px-3 py-1 rounded-md text-sm font-mono text-gray-800">
            /sitemap.xml
          </code>
          <p className="text-sm text-gray-500 mt-4">
            تم تحديث الخريطة آخر مرة في: {new Date().toLocaleDateString('ar-SA')}
          </p>
        </div>
      </div>
    </div>
  );
}