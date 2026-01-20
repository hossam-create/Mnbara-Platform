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
  Users,
  Truck,
  Ban,
  Check,
  X,
  Star
} from 'lucide-react';

const SellerProtectionPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar'>('en');

  const content = {
    en: {
      title: "Seller Protection Policy",
      subtitle: "Sell with confidence on Mnbarh",
      description: "We've got your back with comprehensive protection for every sale",
      
      hero: {
        title: "Sell Safely, Sell Confidently",
        description: "Every sale on Mnbarh is protected from listing to payment",
        guarantee: "100% Seller Protection"
      },
      
      coverage: {
        title: "What's Covered",
        items: [
          {
            icon: <X className="w-5 h-5" />,
            title: "Unpaid Items",
            description: "When buyers commit to purchase but don't pay",
            covered: true
          },
          {
            icon: <Ban className="w-5 h-5" />,
            title: "Abusive Buyers",
            description: "Protection against false claims and abusive behavior",
            covered: true
          },
          {
            icon: <Package className="w-5 h-5" />,
            title: "Lost or Damaged in Transit",
            description: "Items lost or damaged during shipping when tracking is provided",
            covered: true
          },
          {
            icon: <CreditCard className="w-5 h-5" />,
            title: "Chargeback Protection",
            description: "Help with unjustified credit card chargebacks",
            covered: true
          },
          {
            icon: <AlertTriangle className="w-5 h-5" />,
            title: "Fake Returns",
            description: "Protection against fraudulent return attempts",
            covered: true
          },
          {
            icon: <Users className="w-5 h-5" />,
            title: "Buyer Harassment",
            description: "Protection from threatening or inappropriate buyer behavior",
            covered: true
          }
        ]
      },
      
      requirements: {
        title: "Eligibility Requirements",
        items: [
          {
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            title: "Transaction on Mnbarh",
            description: "The sale must be completed through our platform"
          },
          {
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            title: "Ship to Confirmed Address",
            description: "Send items only to the address in order details"
          },
          {
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            title: "Proof of Shipment",
            description: "Provide valid tracking information for all orders"
          },
          {
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            title: "Respond Promptly",
            description: "Answer buyer questions and resolve issues quickly"
          },
          {
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            title: "Accurate Descriptions",
            description: "Describe items honestly and with clear photos"
          }
        ]
      },
      
      notCovered: {
        title: "What's Not Covered",
        items: [
          "Sales outside Mnbarh platform",
          "Items shipped to unconfirmed addresses",
          "Digital goods without proper delivery confirmation",
          "Seller account violations",
          "Intentional misrepresentation of items",
          "Late shipping without valid reason"
        ]
      },
      
      process: {
        title: "How to File a Seller Claim",
        steps: [
          {
            step: "1",
            title: "Document Everything",
            description: "Keep all communication, photos, and transaction records",
            timeframe: "Immediately",
            action: "Save screenshots and tracking info"
          },
          {
            step: "2",
            title: "Contact Buyer First",
            description: "Try to resolve the issue directly with the buyer",
            timeframe: "Within 2 days",
            action: "Use platform messaging only"
          },
          {
            step: "3",
            title: "File a Claim",
            description: "Open a seller protection case through your account",
            timeframe: "Within 30 days of issue",
            action: "Go to Account → Seller Protection"
          },
          {
            step: "4",
            title: "Provide Evidence",
            description: "Submit all documentation to support your claim",
            timeframe: "Within 7 days",
            action: "Upload photos, tracking, communication"
          },
          {
            step: "5",
            title: "Review & Resolution",
            description: "Our team investigates and resolves the case",
            timeframe: "Within 14 days",
            action: "We'll protect your account and payment"
          }
        ]
      },
      
      tips: {
        title: "Seller Protection Tips",
        items: [
          "Always use platform messaging for buyer communication",
          "Take clear photos of items before shipping",
          "Use tracked shipping for all orders",
          "Describe items accurately, including any flaws",
          "Respond to buyer messages within 24 hours",
          "Keep all packaging until the return period ends"
        ]
      }
    },
    
    ar: {
      title: "سياسة حماية البائع",
      subtitle: "بع بثقة على منبره",
      description: "نحن ندعمك بحماية شاملة لكل عملية بيع",
      
      hero: {
        title: "بع بأمان، بع بثقة",
        description: "كل عملية بيع على منبره محمية من القائمة إلى الدفع",
        guarantee: "حماية البائع 100%"
      },
      
      coverage: {
        title: "ما هو المشمول",
        items: [
          {
            icon: <X className="w-5 h-5" />,
            title: "بنود غير مدفوعة",
            description: "عندما يلتزم المشترون بالشراء ولكن لا يدفعون",
            covered: true
          },
          {
            icon: <Ban className="w-5 h-5" />,
            title: "المشترون المسيئون",
            description: "الحماية ضد الادعاءات الكاذبة والسلوك المسيء",
            covered: true
          },
          {
            icon: <Package className="w-5 h-5" />,
            title: "ضائع أو تالف أثناء النقل",
            description: "بنود ضائعة أو تالفة أثناء الشحن عند توفير التتبع",
            covered: true
          },
          {
            icon: <CreditCard className="w-5 h-5" />,
            title: "حماية الاسترداد",
            description: "مساعدة في استردادات بطاقات الائتمان غير المبررة",
            covered: true
          },
          {
            icon: <AlertTriangle className="w-5 h-5" />,
            title: "مرتجعات مزيفة",
            description: "الحماية ضد محاولات الإرجاع الاحتيالية",
            covered: true
          },
          {
            icon: <Users className="w-5 h-5" />,
            title: "مضايقة المشتري",
            description: "الحماية من السلوك المهدد أو غير اللائق للمشتري",
            covered: true
          }
        ]
      },
      
      requirements: {
        title: "متطلبات الأهلية",
        items: [
          {
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            title: "معاملة على منبره",
            description: "يجب إتمام البيع عبر منصتنا"
          },
          {
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            title: "شحن إلى العنوان المؤكد",
            description: "أرسل البنود فقط إلى العنوان في تفاصيل الطلب"
          },
          {
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            title: "إثبات الشحن",
            description: "قدم معلومات تتبع صالحة لجميع الطلبات"
          },
          {
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            title: "استجب بسرعة",
            description: "أجب على أسئلة المشترين وحل المشاكل بسرعة"
          },
          {
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            title: "أوصاف دقيقة",
            description: "صف البنود بصدق وبصور واضحة"
          }
        ]
      },
      
      notCovered: {
        title: "ما هو غير مشمول",
        items: [
          "المبيعات خارج منصة منبره",
          "البنود المشحونة إلى عناوين غير مؤكدة",
          "السلع الرقمية بدون تأكيد تسليم مناسب",
          "انتهاكات حساب البائع",
          "التمثيل المتعمد للبنود",
          "التأخير في الشحن بدون سبب وجيه"
        ]
      },
      
      process: {
        title: "كيفية تقديم مطالبة بائع",
        steps: [
          {
            step: "1",
            title: "وثق كل شيء",
            description: "احتفظ بكل التواصل والصور وسجلات المعاملات",
            timeframe: "فوراً",
            action: "احفظ لقطات الشاشة ومعلومات التتبع"
          },
          {
            step: "2",
            title: "تواصل مع المشتري أولاً",
            description: "حاول حل المشكلة مباشرة مع المشتري",
            timeframe: "خلال يومين",
            action: "استخدم رسائل المنصة فقط"
          },
          {
            step: "3",
            title: "قدم مطالبة",
            description: "افتح قضية حماية البائع عبر حسابك",
            timeframe: "خلال 30 يوماً من المشكلة",
            action: "اذهب إلى الحساب → حماية البائع"
          },
          {
            step: "4",
            title: "قدم الأدلة",
            description: "قدم جميع الوثائق لدعم مطالبتك",
            timeframe: "خلال 7 أيام",
            action: "ارفع صوراً وتتبعاً وتواصلاً"
          },
          {
            step: "5",
            title: "المراجعة والحل",
            description: "فريقنا يحقق ويحل القضية",
            timeframe: "خلال 14 يوماً",
            action: "سنحمي حسابك ودفعك"
          }
        ]
      },
      
      tips: {
        title: "نصائح حماية البائع",
        items: [
          "استخدم دائماً رسائل المنصة لتواصل المشتري",
          "التقط صوراً واضحة للبنود قبل الشحن",
          "استخدم الشحن المتعقب لجميع الطلبات",
          "صف البنود بدقة، بما في ذلك أي عيوب",
          "استجب لرسائل المشترين خلال 24 ساعة",
          "احتفظ بكل التغليف حتى تنتهي فترة الإرجاع"
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

        {/* Requirements Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.requirements.title}</h3>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {t.requirements.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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

        {/* Process Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.process.title}</h3>
          <Card>
            <CardContent className="p-6">
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
        </div>

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
            {selectedLanguage === 'en' ? 'Ready to Sell Safely?' : 'هل أنت مستعد للبيع بأمان؟'}
          </h2>
          <p className="text-lg mb-6 opacity-90">
            {selectedLanguage === 'en' 
              ? 'Join thousands of protected sellers on Mnbarh' 
              : 'انضم إلى آلاف البائعين المحميين على منبره'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-yellow-700 hover:bg-gray-100">
              <Star className="w-4 h-4 mr-2" />
              {selectedLanguage === 'en' ? 'Start Selling' : 'ابدأ البيع'}
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-yellow-700">
              <Mail className="w-4 h-4 mr-2" />
              {selectedLanguage === 'en' ? 'Seller Support' : 'دعم البائعين'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
