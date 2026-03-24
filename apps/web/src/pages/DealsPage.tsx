import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  Tag, 
  Star,
  Heart,
  ShoppingCart,
  Timer,
  Flame,
  Gift,
  Percent
} from 'lucide-react';

const DealsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar'>('en');

  const content = {
    en: {
      title: "Daily Deals",
      subtitle: "Amazing savings every day",
      description: "Don't miss out on these limited-time offers",
      
      hero: {
        title: "Today's Best Deals",
        description: "Save big on popular items - offers change daily!",
        cta: "Shop All Deals"
      },
      
      categories: [
        { id: 'all', name: 'All Deals', icon: <Flame className="w-5 h-5" /> },
        { id: 'electronics', name: 'Electronics', icon: <Zap className="w-5 h-5" /> },
        { id: 'fashion', name: 'Fashion', icon: <Tag className="w-5 h-5" /> },
        { id: 'home', name: 'Home & Garden', icon: <Gift className="w-5 h-5" /> },
        { id: 'sports', name: 'Sports', icon: <TrendingUp className="w-5 h-5" /> }
      ],
      
      deals: [
        {
          id: 1,
          title: "Wireless Bluetooth Headphones",
          originalPrice: 89.99,
          dealPrice: 49.99,
          discount: 44,
          category: 'electronics',
          image: '/api/placeholder/300/200',
          rating: 4.5,
          reviews: 234,
          timeLeft: '2h 15m',
          sold: 156,
          available: 44,
          badge: 'Flash Deal'
        },
        {
          id: 2,
          title: "Smart Watch Series 5",
          originalPrice: 299.99,
          dealPrice: 199.99,
          discount: 33,
          category: 'electronics',
          image: '/api/placeholder/300/200',
          rating: 4.7,
          reviews: 512,
          timeLeft: '5h 30m',
          sold: 89,
          available: 61,
          badge: 'Limited Stock'
        },
        {
          id: 3,
          title: "Designer Handbag Collection",
          originalPrice: 189.99,
          dealPrice: 99.99,
          discount: 47,
          category: 'fashion',
          image: '/api/placeholder/300/200',
          rating: 4.3,
          reviews: 178,
          timeLeft: '1d 3h',
          sold: 67,
          available: 33,
          badge: 'Today Only'
        },
        {
          id: 4,
          title: "Home Security Camera Set",
          originalPrice: 249.99,
          dealPrice: 149.99,
          discount: 40,
          category: 'home',
          image: '/api/placeholder/300/200',
          rating: 4.6,
          reviews: 423,
          timeLeft: '3h 45m',
          sold: 234,
          available: 66,
          badge: 'Best Seller'
        },
        {
          id: 5,
          title: "Professional Yoga Mat",
          originalPrice: 79.99,
          dealPrice: 39.99,
          discount: 50,
          category: 'sports',
          image: '/api/placeholder/300/200',
          rating: 4.8,
          reviews: 892,
          timeLeft: '6h 20m',
          sold: 445,
          available: 55,
          badge: '50% Off'
        },
        {
          id: 6,
          title: "Coffee Maker Deluxe",
          originalPrice: 159.99,
          dealPrice: 89.99,
          discount: 44,
          category: 'home',
          image: '/api/placeholder/300/200',
          rating: 4.4,
          reviews: 267,
          timeLeft: '4h 10m',
          sold: 123,
          available: 77,
          badge: 'Flash Deal'
        }
      ],
      
      features: {
        title: "Why Shop Daily Deals?",
        features: [
          {
            icon: <Percent className="w-8 h-8" />,
            title: "Up to 70% Off",
            description: "Massive discounts on popular items"
          },
          {
            icon: <Timer className="w-8 h-8" />,
            title: "Limited Time",
            description: "Deals change daily - check back often"
          },
          {
            icon: <Shield className="w-8 h-8" />,
            title: "Quality Guaranteed",
            description: "All deals come with buyer protection"
          },
          {
            icon: <Zap className="w-8 h-8" />,
            title: "Fast Shipping",
            description: "Quick delivery on all deal items"
          }
        ]
      },
      
      newsletter: {
        title: "Never Miss a Deal",
        description: "Get daily deal alerts delivered to your inbox",
        placeholder: "Enter your email address",
        buttonText: "Subscribe to Deals"
      }
    },
    
    ar: {
      title: "العروض اليومية",
      subtitle: "توفير مذهل كل يوم",
      description: "لا تفوت هذه العروض المحدودة الوقت",
      
      hero: {
        title: "أفضل العروض اليوم",
        description: "وفر كبير على المنتجات الشائعة - العروض تتغير يومياً!",
        cta: "تسوق جميع العروض"
      },
      
      categories: [
        { id: 'all', name: 'جميع العروض', icon: <Flame className="w-5 h-5" /> },
        { id: 'electronics', name: 'إلكترونيات', icon: <Zap className="w-5 h-5" /> },
        { id: 'fashion', name: 'أزياء', icon: <Tag className="w-5 h-5" /> },
        { id: 'home', name: 'المنزل والحديقة', icon: <Gift className="w-5 h-5" /> },
        { id: 'sports', name: 'رياضة', icon: <TrendingUp className="w-5 h-5" /> }
      ],
      
      deals: [
        {
          id: 1,
          title: "سماعات بلوتوث لاسلكية",
          originalPrice: 89.99,
          dealPrice: 49.99,
          discount: 44,
          category: 'electronics',
          image: '/api/placeholder/300/200',
          rating: 4.5,
          reviews: 234,
          timeLeft: '2س 15د',
          sold: 156,
          available: 44,
          badge: 'عرض سريع'
        },
        {
          id: 2,
          title: "ساعة ذكية سلسلة 5",
          originalPrice: 299.99,
          dealPrice: 199.99,
          discount: 33,
          category: 'electronics',
          image: '/api/placeholder/300/200',
          rating: 4.7,
          reviews: 512,
          timeLeft: '5س 30د',
          sold: 89,
          available: 61,
          badge: 'مخزون محدود'
        },
        {
          id: 3,
          title: "مجموعة حقائب تصميم",
          originalPrice: 189.99,
          dealPrice: 99.99,
          discount: 47,
          category: 'fashion',
          image: '/api/placeholder/300/200',
          rating: 4.3,
          reviews: 178,
          timeLeft: '1ي 3س',
          sold: 67,
          available: 33,
          badge: 'ليوم فقط'
        },
        {
          id: 4,
          title: "مجموعة كاميرات أمن المنزل",
          originalPrice: 249.99,
          dealPrice: 149.99,
          discount: 40,
          category: 'home',
          image: '/api/placeholder/300/200',
          rating: 4.6,
          reviews: 423,
          timeLeft: '3س 45د',
          sold: 234,
          available: 66,
          badge: 'الأكثر مبيعاً'
        },
        {
          id: 5,
          title: "سجادة يوغا احترافية",
          originalPrice: 79.99,
          dealPrice: 39.99,
          discount: 50,
          category: 'sports',
          image: '/api/placeholder/300/200',
          rating: 4.8,
          reviews: 892,
          timeLeft: '6س 20د',
          sold: 445,
          available: 55,
          badge: 'خصم 50%'
        },
        {
          id: 6,
          title: "صانع قهوة فاخر",
          originalPrice: 159.99,
          dealPrice: 89.99,
          discount: 44,
          category: 'home',
          image: '/api/placeholder/300/200',
          rating: 4.4,
          reviews: 267,
          timeLeft: '4س 10د',
          sold: 123,
          available: 77,
          badge: 'عرض سريع'
        }
      ],
      
      features: {
        title: "لماذا تتسوق في العروض اليومية؟",
        features: [
          {
            icon: <Percent className="w-8 h-8" />,
            title: "حتى 70% خصم",
            description: "خصومات ضخمة على المنتجات الشائعة"
          },
          {
            icon: <Timer className="w-8 h-8" />,
            title: "وقت محدود",
            description: "العروض تتغير يومياً - تحقق بانتظام"
          },
          {
            icon: <Shield className="w-8 h-8" />,
            title: "جودة مضمونة",
            description: "جميع العروض تأتي مع حماية المشتري"
          },
          {
            icon: <Zap className="w-8 h-8" />,
            title: "شحن سريع",
            description: "توصيل سريع لجميع عناصر العرض"
          }
        ]
      },
      
      newsletter: {
        title: "لا تفوت أبداً عرضاً",
        description: "احصل على تنبيهات العروض اليومية في بريدك",
        placeholder: "أدخل عنوان بريدك الإلكتروني",
        buttonText: "اشترك في العروض"
      }
    }
  };

  const t = content[selectedLanguage];
  
  const filteredDeals = selectedCategory === 'all' 
    ? t.deals 
    : t.deals.filter(deal => deal.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white" dir={selectedLanguage === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
              <p className="text-gray-600 mt-1">{t.subtitle}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedLanguage === 'en' ? 'default' : 'outline'}
                onClick={() => setSelectedLanguage('en')}
                className="px-4 py-2"
              >
                English
              </Button>
              <Button
                variant={selectedLanguage === 'ar' ? 'default' : 'outline'}
                onClick={() => setSelectedLanguage('ar')}
                className="px-4 py-2"
              >
                العربية
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Flame className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4">{t.hero.title}</h2>
            <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">{t.hero.description}</p>
            <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100">
              <ShoppingCart className="w-4 h-4 mr-2" />
              {t.hero.cta}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {t.categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-2"
              >
                {category.icon}
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredDeals.map((deal) => (
            <Card key={deal.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="relative">
                  <img 
                    src={deal.image} 
                    alt={deal.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <Badge className="absolute top-2 left-2 bg-red-600 text-white">
                    {deal.badge}
                  </Badge>
                  <Badge className="absolute top-2 right-2 bg-green-600 text-white">
                    -{deal.discount}%
                  </Badge>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{deal.title}</h3>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">{deal.rating}</span>
                    </div>
                    <span className="text-sm text-gray-500">({deal.reviews})</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-red-600">${deal.dealPrice}</span>
                    <span className="text-sm text-gray-500 line-through">${deal.originalPrice}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1 text-sm text-orange-600">
                      <Clock className="w-4 h-4" />
                      {deal.timeLeft}
                    </div>
                    <div className="text-sm text-gray-600">
                      {deal.sold} sold
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button className="flex-1" size="sm">
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      {selectedLanguage === 'en' ? 'Buy Now' : 'اشترِ الآن'}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t.features.title}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.features.features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">{t.newsletter.title}</h2>
          <p className="text-lg mb-6 opacity-90">{t.newsletter.description}</p>
          <div className="flex max-w-md mx-auto gap-2">
            <input
              type="email"
              placeholder={t.newsletter.placeholder}
              className="flex-1 px-4 py-3 rounded-lg text-gray-900"
            />
            <Button className="bg-red-600 hover:bg-red-700">
              {t.newsletter.buttonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealsPage;
