import Image from 'next/image';
import Link from 'next/link';
import { Search, ShoppingCart, Bell, User, Clock, TrendingUp, Zap, Star } from 'lucide-react';

export default function Home() {
  const categories = [
    'إلكترونيات', 'أزياء', 'منزل وحديقة', 'رياضة', 'ألعاب',
    'كتب', 'سيارات', 'جمال وعناية', 'هواتف', 'أجهزة كمبيوتر',
    'ساعات', 'مجوهرات', 'صحة', 'أطفال', 'موسيقى', 'تحف'
  ];

  const liveAuctions = [
    { id: 1, title: 'ساعة رولكس أصلية', currentBid: '12,500 ريال', timeLeft: '2س 15د', bids: 24, image: '/images/1.png' },
    { id: 2, title: 'آيفون 15 برو ماكس', currentBid: '5,200 ريال', timeLeft: '45د', bids: 18, image: '/images/2.png' },
    { id: 3, title: 'لابتوب ماك بوك برو', currentBid: '8,900 ريال', timeLeft: '1س 30د', bids: 31, image: '/images/3.png' },
    { id: 4, title: 'حقيبة لويس فيتون', currentBid: '3,400 ريال', timeLeft: '3س', bids: 15, image: '/images/4.png' },
  ];

  const hotDeals = [
    { id: 1, title: 'سماعات AirPods Pro', price: '850 ريال', oldPrice: '1,200 ريال', discount: '-29%', image: '/images/5.png' },
    { id: 2, title: 'شاشة سامسونج 55 بوصة', price: '1,950 ريال', oldPrice: '2,800 ريال', discount: '-30%', image: '/images/6.png' },
    { id: 3, title: 'بلايستيشن 5', price: '2,100 ريال', oldPrice: '2,600 ريال', discount: '-19%', image: '/images/8.png' },
    { id: 4, title: 'كاميرا كانون EOS', price: '3,200 ريال', oldPrice: '4,500 ريال', discount: '-29%', image: '/images/96.png' },
  ];

  const featuredProducts = Array(12).fill(null).map((_, i) => ({
    id: i + 1,
    title: `منتج مميز ${i + 1}`,
    price: `${Math.floor(Math.random() * 5000) + 100} ريال`,
    shipping: 'شحن مجاني',
    image: `/images/${[1, 2, 3, 4, 5, 6, 8, 96, 97, 98, 99][i % 11]}.png`,
    rating: 4.5,
    reviews: Math.floor(Math.random() * 500) + 50
  }));

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Top Bar */}
      <div className="bg-white border-b">
        <div className="max-w-[1400px] mx-auto px-4 py-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex gap-4 text-gray-600">
              <Link href="/sell" className="hover:text-blue-600">بيع</Link>
              <Link href="/daily-deals" className="hover:text-blue-600">العروض اليومية</Link>
              <Link href="/help" className="hover:text-blue-600">مساعدة وتواصل</Link>
            </div>
            <div className="flex gap-4 items-center">
              <Bell className="w-4 h-4 text-gray-600" />
              <Link href="/cart" className="flex items-center gap-1 hover:text-blue-600">
                <ShoppingCart className="w-4 h-4" />
                <span>سلة التسوق (0)</span>
              </Link>
              <Link href="/login" className="hover:text-blue-600">تسجيل الدخول</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 py-4">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image src="/images/logo2.png" alt="منبرة" width={50} height={50} />
              <span className="text-3xl font-bold text-red-600">منبرة</span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-3xl">
              <div className="flex">
                <select className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-r-md text-sm focus:outline-none">
                  <option>جميع الفئات</option>
                  <option>إلكترونيات</option>
                  <option>أزياء</option>
                  <option>سيارات</option>
                </select>
                <input
                  type="text"
                  placeholder="ابحث عن أي شيء..."
                  className="flex-1 px-4 py-3 border-t border-b border-gray-300 focus:outline-none"
                />
                <button className="px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-l-md font-semibold">
                  بحث
                </button>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                لوحة التحكم
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Categories */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-lg mb-4">تسوق حسب الفئة</h3>
              <ul className="space-y-2">
                {categories.map((cat) => (
                  <li key={cat}>
                    <Link href={`/category/${cat}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/categories" className="text-sm text-blue-600 hover:underline mt-4 block">
                عرض جميع الفئات →
              </Link>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow p-4 mt-4">
              <h3 className="font-bold text-lg mb-4">روابط سريعة</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/trending" className="text-gray-700 hover:text-blue-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> الأكثر رواجاً
                </Link></li>
                <li><Link href="/new" className="text-gray-700 hover:text-blue-600 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> وصل حديثاً
                </Link></li>
                <li><Link href="/deals" className="text-gray-700 hover:text-blue-600 flex items-center gap-2">
                  <Star className="w-4 h-4" /> عروض مميزة
                </Link></li>
              </ul>
            </div>
          </div>

          {/* Main Area */}
          <div className="col-span-9 space-y-6">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
              <h1 className="text-3xl font-bold mb-2">مرحباً في منبرة</h1>
              <p className="text-lg mb-4">اكتشف ملايين المنتجات وشارك في مزادات حية</p>
              <div className="flex gap-4">
                <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100">
                  ابدأ البيع الآن
                </button>
                <button className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400">
                  تصفح المزادات
                </button>
              </div>
            </div>

            {/* Live Auctions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Clock className="w-6 h-6 text-red-600" />
                  مزادات حية الآن
                </h2>
                <Link href="/auctions" className="text-blue-600 hover:underline">
                  عرض الكل →
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {liveAuctions.map((auction) => (
                  <div key={auction.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-40 bg-gray-100">
                      <Image src={auction.image} alt={auction.title} fill className="object-cover" />
                      <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                        LIVE
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">{auction.title}</h3>
                      <div className="text-green-600 font-bold text-lg">{auction.currentBid}</div>
                      <div className="flex justify-between text-xs text-gray-600 mt-2">
                        <span>{auction.bids} عرض</span>
                        <span className="text-red-600">{auction.timeLeft}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hot Deals */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-500" />
                  عروض ساخنة
                </h2>
                <Link href="/deals" className="text-blue-600 hover:underline">
                  المزيد من العروض →
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {hotDeals.map((deal) => (
                  <div key={deal.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-40 bg-gray-100">
                      <Image src={deal.image} alt={deal.title} fill className="object-cover" />
                      <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded font-bold text-sm">
                        {deal.discount}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">{deal.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 font-bold text-lg">{deal.price}</span>
                        <span className="text-gray-400 line-through text-sm">{deal.oldPrice}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Products */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">منتجات مميزة لك</h2>
              <div className="grid grid-cols-4 gap-4">
                {featuredProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-40 bg-gray-100">
                      <Image src={product.image} alt={product.title} fill className="object-cover" />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">{product.title}</h3>
                      <div className="text-gray-900 font-bold">{product.price}</div>
                      <div className="text-xs text-green-600 mt-1">{product.shipping}</div>
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                        {'★'.repeat(Math.floor(product.rating))}
                        <span>({product.reviews})</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12 py-8">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="grid grid-cols-5 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">شراء</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="/registration">التسجيل</Link></li>
                <li><Link href="/bidding">المزايدة</Link></li>
                <li><Link href="/stores">المتاجر</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">بيع</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="/start-selling">ابدأ البيع</Link></li>
                <li><Link href="/seller-center">مركز البائع</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">عن منبرة</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="/about">من نحن</Link></li>
                <li><Link href="/careers">الوظائف</Link></li>
                <li><Link href="/press">الأخبار</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">مساعدة</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="/help">مركز المساعدة</Link></li>
                <li><Link href="/contact">تواصل معنا</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">المجتمع</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="/forums">المنتديات</Link></li>
                <li><Link href="/blog">المدونة</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-6 text-sm text-gray-400 text-center">
            <p>© 2025 منبرة. جميع الحقوق محفوظة. | <Link href="/privacy" className="hover:text-white">الخصوصية</Link> | <Link href="/terms" className="hover:text-white">الشروط</Link></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
