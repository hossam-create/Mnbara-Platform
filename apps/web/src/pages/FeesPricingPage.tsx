import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  CheckCircle, 
  Percent, 
  Calculator,
  Store,
  ShoppingCart,
  Plane,
  CreditCard,
  TrendingUp,
  Info,
  Star,
  Zap
} from 'lucide-react';

const FeesPricingPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar'>('en');

  const content = {
    en: {
      title: "Fees & Pricing",
      subtitle: "Transparent pricing for everyone",
      description: "Simple, clear fees with no hidden charges",
      
      hero: {
        title: "Simple, Transparent Pricing",
        description: "No hidden fees, no surprises. Just clear pricing that helps you succeed.",
        guarantee: "No Hidden Fees"
      },
      
      sellerFees: {
        title: "Seller Fees",
        description: "Competitive rates designed to help you sell more",
        tiers: [
          {
            name: "Basic Seller",
            price: "5%",
            description: "Perfect for occasional sellers",
            features: [
              "Up to 10 listings per month",
              "Standard seller protection",
              "Basic analytics",
              "Email support"
            ],
            popular: false
          },
          {
            name: "Professional Seller",
            price: "3%",
            description: "Ideal for regular sellers",
            features: [
              "Unlimited listings",
              "Enhanced seller protection",
              "Advanced analytics",
              "Priority support",
              "Promotional tools"
            ],
            popular: true
          },
          {
            name: "Enterprise Seller",
            price: "1.5%",
            description: "For high-volume businesses",
            features: [
              "Everything in Professional",
              "Custom branding",
              "API access",
              "Dedicated account manager",
              "Custom reporting"
            ],
            popular: false
          }
        ],
        examples: [
          {
            item: "Phone Case",
            price: "$20",
            fee: "$1.00",
            net: "$19.00"
          },
          {
            item: "Designer Bag",
            price: "$150",
            fee: "$4.50",
            net: "$145.50"
          },
          {
            item: "Laptop",
            price: "$800",
            fee: "$12.00",
            net: "$788.00"
          }
        ]
      },
      
      buyerFees: {
        title: "Buyer Fees",
        description: "Most purchases are free for buyers",
        items: [
          {
            type: "Standard Purchases",
            fee: "Free",
            description: "No fees for most purchases on Mnbarh"
          },
          {
            type: "International Payments",
            fee: "2-3%",
            description: "Small currency conversion fee for international transactions"
          },
          {
            type: "Premium Services",
            fee: "Varies",
            description: "Optional services like expedited shipping or insurance"
          }
        ]
      },
      
      travelerFees: {
        title: "Traveler Fees",
        description: "Earn money while you travel",
        structure: [
          {
            type: "Service Fee",
            amount: "10% of shopping fee",
            description: "Taken from the payment you receive for shopping services"
          },
          {
            type: "Platform Fee",
            amount: "5% of item value",
            description: "Paid by the buyer requesting the shopping service"
          }
        ],
        example: {
          request: "Watch from Dubai",
          itemValue: "$500",
          shoppingFee: "$50",
          travelerEarns: "$45",
          buyerPays: "$550"
        }
      },
      
      additionalFees: {
        title: "Additional Services",
        description: "Optional services to enhance your experience",
        services: [
          {
            name: "Featured Listings",
            fee: "$2.99 per listing",
            description: "Get your items featured on the homepage"
          },
          {
            name: "Urgent Delivery",
            fee: "$5.99 per order",
            description: "Expedited handling and delivery"
          },
          {
            name: "Item Insurance",
            fee: "1% of item value",
            description: "Additional protection for high-value items"
          },
          {
            name: "Promotional Boost",
            fee: "$4.99 per campaign",
            description: "Reach more buyers with targeted promotions"
          }
        ]
      },
      
      paymentProcessing: {
        title: "Payment Processing",
        description: "Secure payment processing with competitive rates",
        methods: [
          {
            name: "Credit/Debit Cards",
            fee: "2.9% + $0.30",
            description: "Visa, Mastercard, American Express, Discover"
          },
          {
            name: "PayPal",
            fee: "3.4% + $0.30",
            description: "PayPal balance and linked accounts"
          },
          {
            name: "Bank Transfer",
            fee: "1.5%",
            description: "Direct bank transfers (minimum $5)"
          },
          {
            name: "Digital Wallets",
            fee: "2.5%",
            description: "Apple Pay, Google Pay, Samsung Pay"
          }
        ]
      },
      
      tips: {
        title: "Money-Saving Tips",
        items: [
          "Bundle multiple items to save on individual fees",
          "Choose the right seller plan for your volume",
          "Use free promotional periods when available",
          "Consider bank transfers for large transactions",
          "Take advantage of bulk listing discounts"
        ]
      }
    },
    
    ar: {
      title: "الرسوم والأسعار",
      subtitle: "أسعار شفافة للجميع",
      description: "رسوم بسيطة وواضحة بدون رسوم خفية",
      
      hero: {
        title: "أسعار بسيطة وشفافة",
        description: "لا توجد رسوم خفية، لا مفاجآت. مجرد أسعار واضحة تساعدك على النجاح.",
        guarantee: "لا توجد رسوم خفية"
      },
      
      sellerFees: {
        title: "رسوم البائع",
        description: "أسعار تنافسية مصممة لمساعدتك في البيع أكثر",
        tiers: [
          {
            name: "بائع أساسي",
            price: "5%",
            description: "مثالي للبائعين غير المنتظمين",
            features: [
              "حتى 10 قوائم شهرياً",
              "حماية بائع قياسية",
              "تحليلات أساسية",
              "دعم عبر البريد الإلكتروني"
            ],
            popular: false
          },
          {
            name: "بائع محترف",
            price: "3%",
            description: "مثالي للبائعين المنتظمين",
            features: [
              "قوائم غير محدودة",
              "حماية بائع محسّنة",
              "تحليلات متقدمة",
              "دعم أولوية",
              "أدوات ترويجية"
            ],
            popular: true
          },
          {
            name: "بائع مؤسسي",
            price: "1.5%",
            description: "للشركات عالية الحجم",
            features: [
              "كل شيء في المحترف",
              "علامة تجارية مخصصة",
              "وصول API",
              "مدير حساب مخصص",
              "تقارير مخصصة"
            ],
            popular: false
          }
        ],
        examples: [
          {
            item: "غطاء هاتف",
            price: "20 دولار",
            fee: "1.00 دولار",
            net: "19.00 دولار"
          },
          {
            item: "حقيبة مصممة",
            price: "150 دولار",
            fee: "4.50 دولار",
            net: "145.50 دولار"
          },
          {
            item: "حاسوب محمول",
            price: "800 دولار",
            fee: "12.00 دولار",
            net: "788.00 دولار"
          }
        ]
      },
      
      buyerFees: {
        title: "رسوم المشتري",
        description: "معظم المشتريات مجانية للمشترين",
        items: [
          {
            type: "المشتريات القياسية",
            fee: "مجاني",
            description: "لا توجد رسوم لمعظم المشتريات على منبره"
          },
          {
            type: "المدفوعات الدولية",
            fee: "2-3%",
            description: "رسوم تحويل عملة صغيرة للمعاملات الدولية"
          },
          {
            type: "الخدمات المميزة",
            fee: "تختلف",
            description: "خدمات اختيارية مثل الشحن السريع أو التأمين"
          }
        ]
      },
      
      travelerFees: {
        title: "رسوم المسافر",
        description: "اكسب المال أثناء سفرك",
        structure: [
          {
            type: "رسوم الخدمة",
            amount: "10% من رسوم التسوق",
            description: "تؤخذ من الدفعة التي تتلقاها لخدمات التسوق"
          },
          {
            type: "رسوم المنصة",
            amount: "5% من قيمة البند",
            description: "يدفعها المشتري طالب خدمة التسوق"
          }
        ],
        example: {
          request: "ساعة من دبي",
          itemValue: "500 دولار",
          shoppingFee: "50 دولار",
          travelerEarns: "45 دولار",
          buyerPays: "550 دولار"
        }
      },
      
      additionalFees: {
        title: "الخدمات الإضافية",
        description: "خدمات اختيارية لتعزيز تجربتك",
        services: [
          {
            name: "القوائم المميزة",
            fee: "2.99 دولار لكل قائمة",
            description: "احصل على بنودك مميزة على الصفحة الرئيسية"
          },
          {
            name: "التسليم العاجل",
            fee: "5.99 دولار لكل طلب",
            description: "معالجة وتسليم مسرعين"
          },
          {
            name: "تأمين البند",
            fee: "1% من قيمة البند",
            description: "حماية إضافية للبنود عالية القيمة"
          },
          {
            name: "تعزيز ترويجي",
            fee: "4.99 دولار لكل حملة",
            description: "وصول إلى المزيد من المشترين بترقيات مستهدفة"
          }
        ]
      },
      
      paymentProcessing: {
        title: "معالجة الدفع",
        description: "معالجة دفع آمنة بأسعار تنافسية",
        methods: [
          {
            name: "بطاقات الائتمان/الخصم",
            fee: "2.9% + 0.30 دولار",
            description: "Visa, Mastercard, American Express, Discover"
          },
          {
            name: "PayPal",
            fee: "3.4% + 0.30 دولار",
            description: "رصيد PayPal والحسابات المرتبطة"
          },
          {
            name: "التحويل البنكي",
            fee: "1.5%",
            description: "التحويلات البنكية المباشرة (حد أدنى 5 دولارات)"
          },
          {
            name: "المحافظ الرقمية",
            fee: "2.5%",
            description: "Apple Pay, Google Pay, Samsung Pay"
          }
        ]
      },
      
      tips: {
        title: "نصائح لتوفير المال",
        items: [
          "اجمع عدة بنود لتوفير الرسوم الفردية",
          "اختر خطة البائع المناسبة لحجمك",
          "استخدم فترات ترويجية مجانية عند توفرها",
          "فكر في التحويلات البنكية للمعاملات الكبيرة",
          "استفد من خصومات القوائم بالجملة"
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
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <DollarSign className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4">{t.hero.title}</h2>
            <p className="text-xl mb-6 opacity-90">{t.hero.description}</p>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
              <CheckCircle className="w-6 h-6" />
              <span className="text-lg font-semibold">{t.hero.guarantee}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Seller Fees */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.sellerFees.title}</h3>
          <p className="text-gray-600 mb-8">{t.sellerFees.description}</p>
          
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {t.sellerFees.tiers.map((tier, index) => (
              <Card key={index} className={`relative ${tier.popular ? 'border-yellow-500 shadow-lg' : ''}`}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-yellow-600 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      {selectedLanguage === 'en' ? 'Most Popular' : 'الأكثر شعبية'}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <div className="text-3xl font-bold text-yellow-600 mt-2">{tier.price}</div>
                  <p className="text-gray-600 text-sm mt-2">{tier.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                {selectedLanguage === 'en' ? 'Fee Examples' : 'أمثلة الرسوم'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {t.sellerFees.examples.map((example, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-900">{example.item}</div>
                    <div className="text-2xl font-bold text-gray-900 mt-2">{example.price}</div>
                    <div className="text-sm text-red-600 mt-1">
                      {selectedLanguage === 'en' ? 'Fee: ' : 'الرسوم: '}{example.fee}
                    </div>
                    <div className="text-lg font-semibold text-green-600 mt-2">
                      {selectedLanguage === 'en' ? 'You receive: ' : 'تستلم: '}{example.net}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for other fees */}
        <Tabs defaultValue="buyer" className="mb-12">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="buyer" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              {selectedLanguage === 'en' ? 'Buyer Fees' : 'رسوم المشتري'}
            </TabsTrigger>
            <TabsTrigger value="traveler" className="flex items-center gap-2">
              <Plane className="w-4 h-4" />
              {selectedLanguage === 'en' ? 'Traveler Fees' : 'رسوم المسافر'}
            </TabsTrigger>
            <TabsTrigger value="additional" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {selectedLanguage === 'en' ? 'Additional' : 'إضافي'}
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              {selectedLanguage === 'en' ? 'Payment' : 'الدفع'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buyer">
            <Card>
              <CardHeader>
                <CardTitle>{t.buyerFees.title}</CardTitle>
                <p className="text-gray-600">{t.buyerFees.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {t.buyerFees.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.type}</h4>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      </div>
                      <Badge variant="outline" className="text-lg font-semibold">
                        {item.fee}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="traveler">
            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{t.travelerFees.title}</CardTitle>
                  <p className="text-gray-600">{t.travelerFees.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {t.travelerFees.structure.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.type}</h4>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        </div>
                        <Badge variant="outline" className="font-semibold">
                          {item.amount}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    {selectedLanguage === 'en' ? 'Example Calculation' : 'مثال حساب'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-yellow-50 p-6 rounded-lg">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">{t.travelerFees.example.request}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>{selectedLanguage === 'en' ? 'Item Value:' : 'قيمة البند:'}</span>
                            <span className="font-semibold">{t.travelerFees.example.itemValue}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{selectedLanguage === 'en' ? 'Shopping Fee (10%):' : 'رسوم التسوق (10%):'}</span>
                            <span className="font-semibold">{t.travelerFees.example.shoppingFee}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-green-600">
                            <span>{selectedLanguage === 'en' ? 'You Earn:' : 'تكسب:'}</span>
                            <span className="font-bold text-lg">{t.travelerFees.example.travelerEarns}</span>
                          </div>
                          <div className="flex justify-between text-blue-600">
                            <span>{selectedLanguage === 'en' ? 'Buyer Pays:' : 'يدفع المشتري:'}</span>
                            <span className="font-bold text-lg">{t.travelerFees.example.buyerPays}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="additional">
            <Card>
              <CardHeader>
                <CardTitle>{t.additionalFees.title}</CardTitle>
                <p className="text-gray-600">{t.additionalFees.description}</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {t.additionalFees.services.map((service, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-gray-900">{service.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      <Badge variant="outline" className="mt-3">
                        {service.fee}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>{t.paymentProcessing.title}</CardTitle>
                <p className="text-gray-600">{t.paymentProcessing.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {t.paymentProcessing.methods.map((method, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-semibold text-gray-900">{method.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                      </div>
                      <Badge variant="outline" className="font-semibold">
                        {method.fee}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Tips Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.tips.title}</h3>
          <Card>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-3">
                {t.tips.items.map((tip, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">{tip}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">
            {selectedLanguage === 'en' ? 'Ready to Start Selling?' : 'هل أنت مستعد لبدء البيع؟'}
          </h2>
          <p className="text-lg mb-6 opacity-90">
            {selectedLanguage === 'en' 
              ? 'Join thousands of sellers earning more with our competitive rates' 
              : 'انضم إلى آلاف البائعين الذين يكسبون أكثر بأسعارنا التنافسية'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-yellow-700 hover:bg-gray-100">
              <Store className="w-4 h-4 mr-2" />
              {selectedLanguage === 'en' ? 'Start Selling' : 'ابدأ البيع'}
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-yellow-700">
              <Calculator className="w-4 h-4 mr-2" />
              {selectedLanguage === 'en' ? 'Fee Calculator' : 'آلة حاسبة الرسوم'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeesPricingPage;
