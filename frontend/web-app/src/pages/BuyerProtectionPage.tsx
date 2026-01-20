import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  DollarSign,
  Package,
  CreditCard,
  FileText,
  Mail,
  Phone,
  HelpCircle,
  Check,
  X,
  ArrowRight
} from 'lucide-react';

const BuyerProtectionPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar'>('en');

  const content = {
    en: {
      title: "Buyer Protection Policy",
      subtitle: "Shop with confidence on Mnbarh",
      description: "We've got your back with comprehensive protection for every purchase",
      
      hero: {
        title: "Shop Safely, Shop Confidently",
        description: "Every purchase on Mnbarh is protected from click to delivery",
        guarantee: "100% Purchase Protection"
      },
      
      coverage: {
        title: "What's Covered",
        items: [
          {
            icon: <Package className="w-5 h-5" />,
            title: "Item Not Received",
            description: "If your order doesn't arrive within the estimated delivery time",
            covered: true
          },
          {
            icon: <X className="w-5 h-5" />,
            title: "Item Not as Described",
            description: "Product significantly different from seller's description",
            covered: true
          },
          {
            icon: <AlertTriangle className="w-5 h-5" />,
            title: "Damaged or Defective",
            description: "Items arrive damaged or stop working within return period",
            covered: true
          },
          {
            icon: <CreditCard className="w-5 h-5" />,
            title: "Unauthorized Charges",
            description: "Charges you didn't authorize on your payment method",
            covered: true
          },
          {
            icon: <FileText className="w-5 h-5" />,
            title: "Counterfeit Items",
            description: "Fake or inauthentic products misrepresented as genuine",
            covered: true
          },
          {
            icon: <AlertTriangle className="w-5 h-5" />,
            title: "Wrong Item Shipped",
            description: "Completely different product from what you ordered",
            covered: true
          }
        ]
      },
      
      notCovered: {
        title: "What's Not Covered",
        items: [
          "Buyer's remorse or change of mind",
          "Normal wear and tear",
          "Damage after delivery acceptance",
          "Customs or import fees",
          "Items damaged during return shipping",
          "Digital goods after successful delivery"
        ]
      },
      
      process: {
        title: "How to File a Claim",
        steps: [
          {
            step: "1",
            title: "Contact Seller First",
            description: "Try to resolve the issue directly with the seller within 3 days",
            timeframe: "3 days",
            action: "Message seller through order details"
          },
          {
            step: "2",
            title: "File a Dispute",
            description: "If seller doesn't respond or resolve, open a dispute with us",
            timeframe: "Within 30 days of delivery",
            action: "Go to order details → Report issue"
          },
          {
            step: "3",
            title: "Provide Evidence",
            description: "Submit photos, videos, and documentation to support your claim",
            timeframe: "Within 7 days of filing",
            action: "Upload clear photos and descriptions"
          },
          {
            step: "4",
            title: "Review & Decision",
            description: "Our team reviews both sides and makes a fair decision",
            timeframe: "Within 14 days",
            action: "We'll notify you of the outcome"
          },
          {
            step: "5",
            title: "Resolution",
            description: "Get your refund or return instructions if approved",
            timeframe: "3-5 business days",
            action: "Refund processed to original payment"
          }
        ]
      },
      
      timeline: {
        title: "Important Timelines",
        items: [
          {
            event: "Report item not received",
            timeline: "Within 30 days of estimated delivery"
          },
          {
            event: "Report item not as described",
            timeline: "Within 3 days of delivery"
          },
          {
            event: "File dispute after seller contact",
            timeline: "Within 30 days of delivery"
          },
          {
            event: "Submit evidence for claim",
            timeline: "Within 7 days of dispute filing"
          },
          {
            event: "Claim decision",
            timeline: "Within 14 days of evidence submission"
          }
        ]
      },
      
      tips: {
        title: "Protection Tips",
        items: [
          "Always read product descriptions carefully",
          "Check seller ratings and reviews",
          "Take photos/videos of items upon arrival",
          "Keep all communication on the platform",
          "Save packaging until you're sure you're keeping the item",
          "Report issues immediately"
        ]
      }
    },
    
    ar: {
      title: "سياسة حماية المشتري",
      subtitle: "تسوق بثقة على منبره",
      description: "نحن ندعمك بحماية شاملة لكل عملية شراء",
      
      hero: {
        title: "تسوق بأمان، تسوق بثقة",
        description: "كل عملية شراء على منبره محمية من النقرة إلى التسليم",
        guarantee: "حماية الشراء 100%"
      },
      
      coverage: {
        title: "ما هو المشمول",
        items: [
          {
            icon: <Package className="w-5 h-5" />,
            title: "عدم استلام المنتج",
            description: "إذا لم يصل طلبك خلال وقت التسليم المقدر",
            covered: true
          },
          {
            icon: <X className="w-5 h-5" />,
            title: "المنتج ليس كما هو موصوف",
            description: "المنتج يختلف بشكل كبير عن وصف البائع",
            covered: true
          },
          {
            icon: <AlertTriangle className="w-5 h-5" />,
            title: "تالف أو معيب",
            description: "المنتجات تصل تالفة أو تتوقف عن العمل خلال فترة الإرجاع",
            covered: true
          },
          {
            icon: <CreditCard className="w-5 h-5" />,
            title: "رسوم غير مصرح بها",
            description: "رسوم لم تفوضها على طريقة الدفع الخاصة بك",
            covered: true
          },
          {
            icon: <FileText className="w-5 h-5" />,
            title: "منتجات مقلدة",
            description: "منتجات مزيفة أو غير أصلية ممثلة بأنها أصلية",
            covered: true
          },
          {
            icon: <AlertTriangle className="w-5 h-5" />,
            title: "شحن منتج خاطئ",
            description: "منتج مختلف تماماً عما طلبت",
            covered: true
          }
        ]
      },
      
      notCovered: {
        title: "ما هو غير مشمول",
        items: [
          "ندم المشتري أو تغيير الرأي",
          "البلى الطبيعي والتآكل",
          "الضرر بعد قبول التسليم",
          "رسوم الجمارك أو الاستيراد",
          "المنتجات التالفة أثناء شحن الإرجاع",
          "السلع الرقمية بعد التسليم الناجح"
        ]
      },
      
      process: {
        title: "كيفية تقديم مطالبة",
        steps: [
          {
            step: "1",
            title: "تواصل مع البائع أولاً",
            description: "حل المشكلة مباشرة مع البائع خلال 3 أيام",
            timeframe: "3 أيام",
            action: "أرسل رسالة للبائع عبر تفاصيل الطلب"
          },
          {
            step: "2",
            title: "قدم نزاعاً",
            description: "إذا لم يستجب البائع أو يحل المشكلة، افتح نزاعاً معنا",
            timeframe: "خلال 30 يوماً من التسليم",
            action: "اذهب إلى تفاصيل الطلب → أبلغ عن مشكلة"
          },
          {
            step: "3",
            title: "قدم الأدلة",
            description: "قدم صوراً وفيديوهات ووثائق لدعم مطالبتك",
            timeframe: "خلال 7 أيام من التقديم",
            action: "ارفع صوراً وأوصافاً واضحة"
          },
          {
            step: "4",
            title: "المراجعة والقرار",
            description: "فريقنا يراجع كلا الجانبين ويتخذ قراراً عادلاً",
            timeframe: "خلال 14 يوماً",
            action: "سنبلغك بالنتيجة"
          },
          {
            step: "5",
            title: "الحل",
            description: "احصل على استرداد أموالك أو تعليمات الإرجاع إذا تمت الموافقة",
            timeframe: "3-5 أيام عمل",
            action: "معالجة الاسترداد للدفع الأصلي"
          }
        ]
      },
      
      timeline: {
        title: "الجداول الزمنية الهامة",
        items: [
          {
            event: "الإبلاغ عن عدم استلام المنتج",
            timeline: "خلال 30 يوماً من التسليم المقدر"
          },
          {
            event: "الإبلاغ عن أن المنتج ليس كما هو موصوف",
            timeline: "خلال 3 أيام من التسليم"
          },
          {
            event: "تقديم نزاع بعد تواصل البائع",
            timeline: "خلال 30 يوماً من التسليم"
          },
          {
            event: "تقديم الأدلة للمطالبة",
            timeline: "خلال 7 أيام من تقديم النزاع"
          },
          {
            event: "قرار المطالبة",
            timeline: "خلال 14 يوماً من تقديم الأدلة"
          }
        ]
      },
      
      tips: {
        title: "نصائح الحماية",
        items: [
          "اقرأ دائماً أوصاف المنتجات بعناية",
          "تحقق من تقييمات ومراجعات البائعين",
          "التقط صوراً/فيديوهات للمنتجات عند الوصول",
          "احتفظ بكل التواصل على المنصة",
          "احفظ التغليف حتى تتأكد من أنك ستحتفظ بالمنتج",
          "أبلغ عن المشاكل فوراً"
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
            <Shield className="w-16 h-16 mx-auto mb-4" />
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
        {/* Coverage Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.coverage.title}</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.coverage.items.map((item, index) => (
              <Card key={index} className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                    {item.covered && (
                      <Badge className="bg-green-600 text-white">
                        <Check className="w-3 h-3 mr-1" />
                        Covered
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Not Covered Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.notCovered.title}</h3>
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <div className="grid md:grid-cols-2 gap-2 mt-2">
                {t.notCovered.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-500" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        </div>

        {/* Process Tabs */}
        <Tabs defaultValue="process" className="mb-12">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="process">
              {selectedLanguage === 'en' ? 'Claim Process' : 'عملية المطالبة'}
            </TabsTrigger>
            <TabsTrigger value="timeline">
              {selectedLanguage === 'en' ? 'Important Timelines' : 'الجداول الزمنية الهامة'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="process">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t.process.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {t.process.steps.map((step, index) => (
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
                            {step.action}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {t.timeline.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {t.timeline.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{item.event}</span>
                      <Badge variant="outline">{item.timeline}</Badge>
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
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
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
            {selectedLanguage === 'en' ? 'Need Help with a Purchase?' : 'تحتاج مساعدة في عملية شراء؟'}
          </h2>
          <p className="text-lg mb-6 opacity-90">
            {selectedLanguage === 'en' 
              ? 'Our support team is here to help you every step of the way' 
              : 'فريق الدعم لدينا هنا لمساعدتك في كل خطوة'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-yellow-700 hover:bg-gray-100">
              <Mail className="w-4 h-4 mr-2" />
              {selectedLanguage === 'en' ? 'Contact Support' : 'تواصل مع الدعم'}
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-yellow-700">
              <HelpCircle className="w-4 h-4 mr-2" />
              {selectedLanguage === 'en' ? 'View FAQ' : 'عرض الأسئلة الشائعة'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
