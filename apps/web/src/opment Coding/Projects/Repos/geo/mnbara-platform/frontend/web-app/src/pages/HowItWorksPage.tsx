import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Store, 
  Plane,
  Search,
  CreditCard,
  Package,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
  Globe,
  Users,
  Star
} from 'lucide-react';

const HowItWorksPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar'>('en');

  const content = {
    en: {
      title: "How Mnbarh Works",
      subtitle: "Your trusted marketplace for buying, selling, and global shopping",
      description: "Simple, secure, and transparent transactions for everyone",
      
      buyer: {
        title: "For Buyers",
        steps: [
          {
            icon: <Search className="w-6 h-6" />,
            title: "Find What You Need",
            description: "Search millions of products from trusted sellers worldwide"
          },
          {
            icon: <CreditCard className="w-6 h-6" />,
            title: "Pay Securely",
            description: "Your payment is protected until you receive your order"
          },
          {
            icon: <Package className="w-6 h-6" />,
            title: "Receive Your Items",
            description: "Track your delivery and confirm when everything looks good"
          },
          {
            icon: <CheckCircle className="w-6 h-6" />,
            title: "Rate & Review",
            description: "Share your experience to help the community"
          }
        ],
        features: [
          "Buyer Protection on every order",
          "Secure payment processing",
          "Real-time order tracking",
          "24/7 customer support"
        ]
      },
      
      seller: {
        title: "For Sellers",
        steps: [
          {
            icon: <Store className="w-6 h-6" />,
            title: "List Your Products",
            description: "Create detailed listings with photos and descriptions"
          },
          {
            icon: <Users className="w-6 h-6" />,
            title: "Reach Customers",
            description: "Connect with buyers from around the world"
          },
          {
            icon: <Package className="w-6 h-6" />,
            title: "Ship Your Orders",
            description: "Package and ship items securely with tracking"
          },
          {
            icon: <CreditCard className="w-6 h-6" />,
            title: "Get Paid",
            description: "Receive your payment after successful delivery"
          }
        ],
        features: [
          "Seller Protection guarantee",
          "Low selling fees",
          "Global customer base",
          "Seller analytics dashboard"
        ]
      },
      
      traveler: {
        title: "For Travelers",
        steps: [
          {
            icon: <Globe className="w-6 h-6" />,
            title: "Browse Requests",
            description: "Find shopping requests from your travel destinations"
          },
          {
            icon: <ShoppingCart className="w-6 h-6" />,
            title: "Shop & Purchase",
            description: "Buy requested items and keep receipts"
          },
          {
            icon: <Plane className="w-6 h-6" />,
            title: "Travel & Deliver",
            description: "Bring items back and arrange delivery"
          },
          {
            icon: <CreditCard className="w-6 h-6" />,
            title: "Earn Rewards",
            description: "Get paid for your shopping service plus rewards"
          }
        ],
        features: [
          "Flexible earning opportunities",
          "Travel expense coverage",
          "Verified buyer requests",
          "Secure payment system"
        ]
      }
    },
    
    ar: {
      title: "كيف يعمل منبره",
      subtitle: "سوقك الموثوق للشراء والبيع والتسوق العالمي",
      description: "معاملات بسيطة وآمنة وشفافة للجميع",
      
      buyer: {
        title: "للمشترين",
        steps: [
          {
            icon: <Search className="w-6 h-6" />,
            title: "ابحث عما تحتاجه",
            description: "ابحث في ملايين المنتجات من بائعين موثوقين حول العالم"
          },
          {
            icon: <CreditCard className="w-6 h-6" />,
            title: "ادفع بأمان",
            description: "مدفوعاتك محمية حتى تستلم طلبك"
          },
          {
            icon: <Package className="w-6 h-6" />,
            title: "استلم منتجاتك",
            description: "تتبع شحنتك وأكد عندما يصبح كل شيء على ما يرام"
          },
          {
            icon: <CheckCircle className="w-6 h-6" />,
            title: "قيم وراجع",
            description: "شارك تجربتك لمساعدة المجتمع"
          }
        ],
        features: [
          "حماية المشتري على كل طلب",
          "معالجة آمنة للمدفوعات",
          "تتبع الطلبات في الوقت الفعلي",
          "دعم العملاء على مدار الساعة"
        ]
      },
      
      seller: {
        title: "للبائعين",
        steps: [
          {
            icon: <Store className="w-6 h-6" />,
            title: "اعرض منتجاتك",
            description: "إنشاء قوائم مفصلة مع الصور والأوصاف"
          },
          {
            icon: <Users className="w-6 h-6" />,
            title: "تواصل مع العملاء",
            description: "اتصل بالمشترين من جميع أنحاء العالم"
          },
          {
            icon: <Package className="w-6 h-6" />,
            title: "شحن طلباتك",
            description: "عبئ وشحن البنود بأمان مع التتبع"
          },
          {
            icon: <CreditCard className="w-6 h-6" />,
            title: "احصل على الدفع",
            description: "استلم دفعتك بعد التسليم الناجح"
          }
        ],
        features: [
          "ضمان حماية البائع",
          "رسوم بيع منخفضة",
          "قاعدة عملاء عالمية",
          "لوحة تحليلات البائع"
        ]
      },
      
      traveler: {
        title: "للمسافرين",
        steps: [
          {
            icon: <Globe className="w-6 h-6" />,
            title: "تصفح الطلبات",
            description: "ابحث عن طلبات التسوق من وجهات سفرك"
          },
          {
            icon: <ShoppingCart className="w-6 h-6" />,
            title: "تسوق واشتر",
            description: "اشترِ العناصر المطلوبة واحتفظ بالإيصالات"
          },
          {
            icon: <Plane className="w-6 h-6" />,
            title: "سافر وسلم",
            description: "أحضر العناصر ورتب التسليم"
          },
          {
            icon: <CreditCard className="w-6 h-6" />,
            title: "اكسب مكافآت",
            description: "احصل على الدفع لخدمة التسوق بالإضافة إلى المكافآت"
          }
        ],
        features: [
          "فرص كسب مرنة",
          "تغطية نفقات السفر",
          "طلبات المشترين الموثقة",
          "نظام دفع آمن"
        ]
      }
    }
  };

  const t = content[selectedLanguage];

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <p className="text-xl text-gray-600">{t.description}</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="buyer" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="buyer" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              {t.buyer.title}
            </TabsTrigger>
            <TabsTrigger value="seller" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              {t.seller.title}
            </TabsTrigger>
            <TabsTrigger value="traveler" className="flex items-center gap-2">
              <Plane className="w-4 h-4" />
              {t.traveler.title}
            </TabsTrigger>
          </TabsList>

          {/* Buyer Tab */}
          <TabsContent value="buyer">
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-semibold mb-6 text-gray-900">
                  {selectedLanguage === 'en' ? 'Simple Steps to Buy' : 'خطوات بسيطة للشراء'}
                </h3>
                <div className="space-y-4">
                  {t.buyer.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm border">
                      <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        {step.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{step.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        {index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-6 text-gray-900">
                  {selectedLanguage === 'en' ? 'Buyer Benefits' : 'مزايا المشتري'}
                </h3>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {t.buyer.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <Star className="w-5 h-5" />
                        <span className="font-semibold">
                          {selectedLanguage === 'en' ? 'Trusted by millions' : 'موثوق من قبل الملايين'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Seller Tab */}
          <TabsContent value="seller">
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-semibold mb-6 text-gray-900">
                  {selectedLanguage === 'en' ? 'Simple Steps to Sell' : 'خطوات بسيطة للبيع'}
                </h3>
                <div className="space-y-4">
                  {t.seller.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm border">
                      <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        {step.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{step.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        {index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-6 text-gray-900">
                  {selectedLanguage === 'en' ? 'Seller Benefits' : 'مزايا البائع'}
                </h3>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {t.seller.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <Star className="w-5 h-5" />
                        <span className="font-semibold">
                          {selectedLanguage === 'en' ? 'Join thousands of sellers' : 'انضم إلى آلاف البائعين'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Traveler Tab */}
          <TabsContent value="traveler">
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-semibold mb-6 text-gray-900">
                  {selectedLanguage === 'en' ? 'Simple Steps to Earn' : 'خطوات بسيطة للكسب'}
                </h3>
                <div className="space-y-4">
                  {t.traveler.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm border">
                      <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        {step.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{step.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        {index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-6 text-gray-900">
                  {selectedLanguage === 'en' ? 'Traveler Benefits' : 'مزايا المسافر'}
                </h3>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {t.traveler.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <Star className="w-5 h-5" />
                        <span className="font-semibold">
                          {selectedLanguage === 'en' ? 'Turn travel into income' : 'حول السفر إلى دخل'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">
            {selectedLanguage === 'en' ? 'Ready to Get Started?' : 'هل أنت مستعد للبدء؟'}
          </h2>
          <p className="text-xl mb-6 opacity-90">
            {selectedLanguage === 'en' 
              ? 'Join thousands of buyers, sellers, and travelers on Mnbarh' 
              : 'انضم إلى آلاف المشترين والبائعين والمسافرين على منبره'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-yellow-700 hover:bg-gray-100">
              {selectedLanguage === 'en' ? 'Start Buying' : 'ابدأ الشراء'}
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-yellow-700">
              {selectedLanguage === 'en' ? 'Start Selling' : 'ابدأ البيع'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
