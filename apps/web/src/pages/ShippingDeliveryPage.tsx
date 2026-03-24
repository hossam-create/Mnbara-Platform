import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Truck, 
  Package, 
  Shield, 
  Clock, 
  MapPin,
  CheckCircle,
  AlertTriangle,
  Globe,
  Plane,
  Ship,
  Train,
  Info,
  Users,
  FileText,
  Timer
} from 'lucide-react';

const ShippingDeliveryPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar'>('en');

  const content = {
    en: {
      title: "Shipping & Delivery",
      subtitle: "Clear responsibilities for smooth deliveries",
      description: "Understanding who handles what in the shipping process",
      
      hero: {
        title: "Shipping Made Simple",
        description: "Clear guidelines for sellers, buyers, and travelers to ensure smooth deliveries",
        guarantee: "Delivery Protection Included"
      },
      
      responsibilities: {
        title: "Shipping Responsibilities",
        description: "Who handles what in the shipping process",
        roles: [
          {
            role: "Seller Responsibilities",
            icon: <Package className="w-5 h-5" />,
            items: [
              "Package items securely and appropriately",
              "Provide accurate weight and dimensions",
              "Generate shipping labels correctly",
              "Upload tracking information promptly",
              "Choose appropriate shipping service",
              "Respond to shipping inquiries quickly"
            ]
          },
          {
            role: "Buyer Responsibilities",
            icon: <Users className="w-5 h-5" />,
            items: [
              "Provide accurate delivery address",
              "Be available for delivery",
              "Inspect items upon arrival",
              "Report issues immediately",
              "Follow return procedures if needed",
              "Keep communication on platform"
            ]
          },
          {
            role: "Traveler Responsibilities",
            icon: <Plane className="w-5 h-5" />,
            items: [
              "Verify item authenticity before purchase",
              "Protect items during travel",
              "Maintain proof of purchase",
              "Follow customs regulations",
              "Coordinate delivery with buyer",
              "Update travel status regularly"
            ]
          }
        ]
      },
      
      shippingMethods: {
        title: "Shipping Methods",
        description: "Available shipping options and their characteristics",
        methods: [
          {
            name: "Standard Shipping",
            icon: <Truck className="w-5 h-5" />,
            timeframe: "5-7 business days",
            cost: "Economical",
            tracking: "Basic tracking included",
            insurance: "Up to $100",
            bestFor: "Non-urgent items, standard products"
          },
          {
            name: "Express Shipping",
            icon: <Timer className="w-5 h-5" />,
            timeframe: "2-3 business days",
            cost: "Premium",
            tracking: "Real-time tracking",
            insurance: "Up to $500",
            bestFor: "Urgent deliveries, important items"
          },
          {
            name: "International Shipping",
            icon: <Globe className="w-5 h-5" />,
            timeframe: "10-20 business days",
            cost: "Variable",
            tracking: "Full tracking",
            insurance: "Up to $1000",
            bestFor: "Cross-border purchases"
          },
          {
            name: "Local Pickup",
            icon: <MapPin className="w-5 h-5" />,
            timeframe: "Same day",
            cost: "Free",
            tracking: "N/A",
            insurance: "Buyer responsibility",
            bestFor: "Local transactions, large items"
          }
        ]
      },
      
      deliveryProcess: {
        title: "Delivery Process",
        description: "Step-by-step delivery workflow",
        steps: [
          {
            step: "1",
            title: "Order Confirmation",
            description: "Seller receives order and prepares item for shipping",
            timeframe: "Within 24 hours",
            responsible: "Seller"
          },
          {
            step: "2",
            title: "Packaging & Labeling",
            description: "Item is securely packaged and shipping label generated",
            timeframe: "1-2 business days",
            responsible: "Seller"
          },
          {
            step: "3",
            title: "Carrier Pickup",
            description: "Shipping carrier collects the package",
            timeframe: "1-2 business days",
            responsible: "Carrier"
          },
          {
            step: "4",
            title: "Transit",
            description: "Package is in transit to destination",
            timeframe: "Varies by method",
            responsible: "Carrier"
          },
          {
            step: "5",
            title: "Delivery Attempt",
            description: "Carrier attempts delivery to recipient",
            timeframe: "Scheduled delivery day",
            responsible: "Carrier"
          },
          {
            step: "6",
            title: "Confirmation",
            description: "Delivery confirmed and buyer notified",
            timeframe: "Within 24 hours",
            responsible: "Platform"
          }
        ]
      },
      
      tracking: {
        title: "Package Tracking",
        description: "Stay informed about your delivery status",
        features: [
          {
            feature: "Real-time Updates",
            description: "Live tracking information updated every few hours"
          },
          {
            feature: "Delivery Notifications",
            description: "Email and push notifications for status changes"
          },
          {
            feature: "Estimated Delivery",
            description: "AI-powered delivery date predictions"
          },
          {
            feature: "Delivery Photos",
            description: "Photo proof of delivery when available"
          }
        ]
      },
      
      issues: {
        title: "Common Shipping Issues",
        description: "How to handle shipping problems",
        scenarios: [
          {
            issue: "Delayed Delivery",
            solution: "Check tracking, contact carrier, then seller",
            timeframe: "After 3 days past estimated date"
          },
          {
            issue: "Lost Package",
            solution: "File claim with carrier, involve platform if needed",
            timeframe: "After 7 days with no movement"
          },
          {
            issue: "Damaged Item",
            solution: "Document damage, refuse delivery if severe",
            timeframe: "Immediately upon discovery"
          },
          {
            issue: "Wrong Address",
            solution: "Contact seller immediately, may incur fees",
            timeframe: "Before shipment or immediately after"
          }
        ]
      },
      
      international: {
        title: "International Shipping",
        description: "Special considerations for cross-border deliveries",
        topics: [
          {
            topic: "Customs & Duties",
            details: "Buyer responsible for import duties and taxes"
          },
          {
            topic: "Restricted Items",
            details: "Check local regulations for prohibited items"
          },
          {
            topic: "Documentation",
            details: "Commercial invoice may be required for high-value items"
          },
          {
            topic: "Delivery Time",
            details: "Longer delivery times due to customs processing"
          }
        ]
      },
      
      tips: {
        title: "Shipping Best Practices",
        items: [
          "Double-check addresses before shipping",
          "Use appropriate packaging materials",
          "Take photos of items before shipping",
          "Keep all shipping documents",
          "Insure high-value items",
          "Communicate proactively about delays"
        ]
      }
    },
    
    ar: {
      title: "الشحن والتسليم",
      subtitle: "مسؤوليات واضحة للتسليمات السلسة",
      description: "فهم من يتعامل مع ما في عملية الشحن",
      
      hero: {
        title: "الشحن بسيط",
        description: "إرشادات واضحة للبائعين والمشترين والمسافرين لضمان التسليمات السلسة",
        guarantee: "حماية التسليم مشمولة"
      },
      
      responsibilities: {
        title: "مسؤوليات الشحن",
        description: "من يتعامل مع ما في عملية الشحن",
        roles: [
          {
            role: "مسؤوليات البائع",
            icon: <Package className="w-5 h-5" />,
            items: [
              "عبئ البنود بأمان وبشكل مناسب",
              "قدم الوزن والأبعاد الدقيقة",
              "ولد ملصقات الشحن بشكل صحيح",
              "ارفع معلومات التتبع بسرعة",
              "اختر خدمة الشحن المناسبة",
              "استجب لاستفسارات الشحن بسرعة"
            ]
          },
          {
            role: "مسؤوليات المشتري",
            icon: <Users className="w-5 h-5" />,
            items: [
              "قدم عنوان تسليم دقيق",
              "كن متاحاً للتسليم",
              "افحص البنود عند الوصول",
              "أبلغ عن المشاكل فوراً",
              "اتبع إجراءات الإرجاع إذا لزم الأمر",
              "احتفظ بالتواصل على المنصة"
            ]
          },
          {
            role: "مسؤوليات المسافر",
            icon: <Plane className="w-5 h-5" />,
            items: [
              "تحقق من أصالة البنود قبل الشراء",
              "احمِ البنود أثناء السفر",
              "حافظ على إثبات الشراء",
              "اتبع لوائح الجمارك",
              "نسق التسليم مع المشتري",
              "حدث حالة السفر بانتظام"
            ]
          }
        ]
      },
      
      shippingMethods: {
        title: "طرق الشحن",
        description: "خيارات الشحن المتاحة وخصائصها",
        methods: [
          {
            name: "الشحن القياسي",
            icon: <Truck className="w-5 h-5" />,
            timeframe: "5-7 أيام عمل",
            cost: "اقتصادي",
            tracking: "تتبع أساسي مشمول",
            insurance: "حتى 100 دولار",
            bestFor: "البنود غير العاجلة، المنتجات القياسية"
          },
          {
            name: "الشحن السريع",
            icon: <Timer className="w-5 h-5" />,
            timeframe: "2-3 أيام عمل",
            cost: "مميز",
            tracking: "تتبع في الوقت الفعلي",
            insurance: "حتى 500 دولار",
            bestFor: "التسليمات العاجلة، البنود المهمة"
          },
          {
            name: "الشحن الدولي",
            icon: <Globe className="w-5 h-5" />,
            timeframe: "10-20 يوم عمل",
            cost: "متغير",
            tracking: "تتبع كامل",
            insurance: "حتى 1000 دولار",
            bestFor: "المشتريات عبر الحدود"
          },
          {
            name: "الاستلام المحلي",
            icon: <MapPin className="w-5 h-5" />,
            timeframe: "نفس اليوم",
            cost: "مجاني",
            tracking: "غير متاح",
            insurance: "مسؤولية المشتري",
            bestFor: "المعاملات المحلية، البنود الكبيرة"
          }
        ]
      },
      
      deliveryProcess: {
        title: "عملية التسليم",
        description: "سير عمل التسليم خطوة بخطوة",
        steps: [
          {
            step: "1",
            title: "تأكيد الطلب",
            description: "البائع يتلقى الطلب ويحضر البند للشحن",
            timeframe: "خلال 24 ساعة",
            responsible: "البائع"
          },
          {
            step: "2",
            title: "التعبئة والتوسيم",
            description: "البند يعبأ بأمان ويتم إنشاء ملصق الشحن",
            timeframe: "1-2 يوم عمل",
            responsible: "البائع"
          },
          {
            step: "3",
            title: "استلام الناقل",
            description: "ناقل الشحن يجمع الطرد",
            timeframe: "1-2 يوم عمل",
            responsible: "الناقل"
          },
          {
            step: "4",
            title: "العبور",
            description: "الطرد في العبور إلى الوجهة",
            timeframe: "يتغير حسب الطريقة",
            responsible: "الناقل"
          },
          {
            step: "5",
            title: "محاولة التسليم",
            description: "الناقل يحاول التسليم إلى المستلم",
            timeframe: "يوم التسليم المجدول",
            responsible: "الناقل"
          },
          {
            step: "6",
            title: "التأكيد",
            description: "التسليم مؤكد والمشتري مبلغ",
            timeframe: "خلال 24 ساعة",
            responsible: "المنصة"
          }
        ]
      },
      
      tracking: {
        title: "تتبع الطرد",
        description: "ابق على اطلاع بحالة التسليم الخاصة بك",
        features: [
          {
            feature: "التحديثات في الوقت الفعلي",
            description: "معلومات تتبع حية محدثة كل بضع ساعات"
          },
          {
            feature: "إشعارات التسليم",
            description: "إشعارات البريد الإلكتروني والدفع لتغييرات الحالة"
          },
          {
            feature: "تاريخ التسليم المقدر",
            description: "تنبؤات تاريخ التسليم المدعومة بالذكاء الاصطناعي"
          },
          {
            feature: "صور التسليم",
            description: "صورة إثبات التسليم عند توفرها"
          }
        ]
      },
      
      issues: {
        title: "مشاكل الشحن الشائعة",
        description: "كيفية التعامل مع مشاكل الشحن",
        scenarios: [
          {
            issue: "تأخير التسليم",
            solution: "تحقق من التتبع، تواصل مع الناقل، ثم البائع",
            timeframe: "بعد 3 أيام من التاريخ المقدر"
          },
          {
            issue: "الطرد المفقود",
            solution: "قدم مطالبة مع الناقل، شارك المنصة إذا لزم الأمر",
            timeframe: "بعد 7 أيام بدون حركة"
          },
          {
            issue: "البند التالف",
            solution: "وثق الضرر، ارفض التسليم إذا كان شديداً",
            timeframe: "فوراً عند الاكتشاف"
          },
          {
            issue: "العنوان الخاطئ",
            solution: "تواصل مع البائع فوراً، قد تتكبد رسوماً",
            timeframe: "قبل الشحن أو فوراً بعده"
          }
        ]
      },
      
      international: {
        title: "الشحن الدولي",
        description: "اعتبارات خاصة للتسليمات عبر الحدود",
        topics: [
          {
            topic: "الجمارك والرسوم",
            details: "المشتري مسؤول عن رسوم الاستيراد والضرائب"
          },
          {
            topic: "البنود المقيدة",
            details: "تحقق من اللوائح المحلية للبنود المحظورة"
          },
          {
            topic: "الوثائق",
            details: "قد يتطلب فاتورة تجارية للبنود عالية القيمة"
          },
          {
            topic: "وقت التسليم",
            details: "أوقات تسليم أطول بسبب معالجة الجمارك"
          }
        ]
      },
      
      tips: {
        title: "أفضل ممارسات الشحن",
        items: [
          "تحقق من العناوين مرتين قبل الشحن",
          "استخدم مواد التعبئة المناسبة",
          "التقط صوراً للبنود قبل الشحن",
          "احتفظ بجميع وثائق الشحن",
          "أمّن البنود عالية القيمة",
          "تواصل بشكل استباقي حول التأخيرات"
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
            <Truck className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4">{t.hero.title}</h2>
            <p className="text-xl mb-6 opacity-90">{t.hero.description}</p>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
              <Shield className="w-6 h-6" />
              <span className="text-lg font-semibold">{t.hero.guarantee}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Responsibilities Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.responsibilities.title}</h3>
          <p className="text-gray-600 mb-8">{t.responsibilities.description}</p>
          <div className="grid lg:grid-cols-3 gap-6">
            {t.responsibilities.roles.map((role, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {role.icon}
                    {role.role}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {role.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Shipping Methods */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.shippingMethods.title}</h3>
          <p className="text-gray-600 mb-8">{t.shippingMethods.description}</p>
          <div className="grid md:grid-cols-2 gap-4">
            {t.shippingMethods.methods.map((method, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg">{method.name}</h4>
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            {selectedLanguage === 'en' ? 'Timeframe:' : 'الإطار الزمني:'}
                          </span>
                          <Badge variant="outline">{method.timeframe}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            {selectedLanguage === 'en' ? 'Cost:' : 'التكلفة:'}
                          </span>
                          <Badge variant="secondary">{method.cost}</Badge>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">
                            {selectedLanguage === 'en' ? 'Tracking:' : 'التتبع:'}
                          </span>
                          <span className="text-gray-900 ml-1">{method.tracking}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">
                            {selectedLanguage === 'en' ? 'Insurance:' : 'التأمين:'}
                          </span>
                          <span className="text-gray-900 ml-1">{method.insurance}</span>
                        </div>
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <span className="text-gray-600">
                            {selectedLanguage === 'en' ? 'Best for:' : 'الأفضل لـ:'}
                          </span>
                          <span className="text-gray-900">{method.bestFor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="process" className="mb-12">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="process">
              {selectedLanguage === 'en' ? 'Process' : 'العملية'}
            </TabsTrigger>
            <TabsTrigger value="tracking">
              {selectedLanguage === 'en' ? 'Tracking' : 'التتبع'}
            </TabsTrigger>
            <TabsTrigger value="issues">
              {selectedLanguage === 'en' ? 'Issues' : 'المشاكل'}
            </TabsTrigger>
            <TabsTrigger value="international">
              {selectedLanguage === 'en' ? 'International' : 'الدولي'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="process">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {t.deliveryProcess.title}
                </CardTitle>
                <p className="text-gray-600">{t.deliveryProcess.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {t.deliveryProcess.steps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{step.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {step.timeframe}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {step.responsible}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {t.tracking.title}
                </CardTitle>
                <p className="text-gray-600">{t.tracking.description}</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {t.tracking.features.map((feature, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">{feature.feature}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {t.issues.title}
                </CardTitle>
                <p className="text-gray-600">{t.issues.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {t.issues.scenarios.map((scenario, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{scenario.issue}</h4>
                        <Badge variant="outline" className="text-xs">
                          {scenario.timeframe}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{scenario.solution}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="international">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  {t.international.title}
                </CardTitle>
                <p className="text-gray-600">{t.international.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {t.international.topics.map((topic, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">{topic.topic}</h4>
                      <p className="text-sm text-gray-600">{topic.details}</p>
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
            {selectedLanguage === 'en' ? 'Ready to Ship?' : 'هل أنت مستعد للشحن؟'}
          </h2>
          <p className="text-lg mb-6 opacity-90">
            {selectedLanguage === 'en' 
              ? 'Follow our guidelines for smooth, successful deliveries' 
              : 'اتبع إرشاداتنا للتسليمات السلسة والناجحة'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-yellow-700 hover:bg-gray-100">
              <Package className="w-4 h-4 mr-2" />
              {selectedLanguage === 'en' ? 'Start Shipping' : 'ابدأ الشحن'}
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-yellow-700">
              <FileText className="w-4 h-4 mr-2" />
              {selectedLanguage === 'en' ? 'Shipping Guidelines' : 'إرشادات الشحن'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingDeliveryPage;
