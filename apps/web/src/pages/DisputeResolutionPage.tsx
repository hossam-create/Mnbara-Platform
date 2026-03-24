import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Scale, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  DollarSign,
  Package,
  CreditCard,
  FileText,
  Mail,
  Users,
  Gavel,
  MessageSquare,
  ArrowRight,
  Calendar,
  Shield,
  Eye,
  Upload
} from 'lucide-react';

const DisputeResolutionPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar'>('en');

  const content = {
    en: {
      title: "Dispute Resolution Process",
      subtitle: "Fair and transparent dispute handling",
      description: "We ensure every dispute is resolved fairly and efficiently",
      
      hero: {
        title: "Resolving Disputes Fairly",
        description: "Our structured process ensures fair outcomes for both buyers and sellers",
        guarantee: "Impartial Resolution Guaranteed"
      },
      
      overview: {
        title: "How It Works",
        description: "Our dispute resolution process is designed to be fair, transparent, and efficient",
        steps: [
          {
            icon: <MessageSquare className="w-5 h-5" />,
            title: "Communication First",
            description: "We encourage parties to resolve issues directly through our messaging system"
          },
          {
            icon: <FileText className="w-5 h-5" />,
            title: "Formal Dispute",
            description: "If direct resolution fails, either party can file a formal dispute"
          },
          {
            icon: <Eye className="w-5 h-5" />,
            title: "Evidence Review",
            description: "Our team reviews all evidence from both parties thoroughly"
          },
          {
            icon: <Gavel className="w-5 h-5" />,
            title: "Fair Decision",
            description: "We make impartial decisions based on platform policies and evidence"
          }
        ]
      },
      
      timeline: {
        title: "Dispute Timeline",
        description: "Clear timeframes for each stage of the dispute process",
        phases: [
          {
            phase: "Initial Contact",
            timeframe: "Within 24 hours",
            description: "Acknowledge receipt of dispute and request initial information"
          },
          {
            phase: "Evidence Collection",
            timeframe: "3-5 business days",
            description: "Both parties submit evidence and documentation"
          },
          {
            phase: "Review Period",
            timeframe: "7-10 business days",
            description: "Our team thoroughly reviews all submitted evidence"
          },
          {
            phase: "Decision & Resolution",
            timeframe: "Within 14 days total",
            description: "Final decision communicated and resolution implemented"
          }
        ]
      },
      
      process: {
        title: "Step-by-Step Process",
        steps: [
          {
            step: "1",
            title: "File Dispute",
            description: "Submit a dispute through your account with order details",
            timeframe: "Anytime",
            action: "Go to Order → Report Issue",
            details: [
              "Provide order number and reason for dispute",
              "Upload initial evidence if available",
              "Specify desired resolution"
            ]
          },
          {
            step: "2",
            title: "Other Party Notified",
            description: "The other party receives notification and can respond",
            timeframe: "Within 24 hours",
            action: "Wait for response",
            details: [
              "Other party receives dispute details",
              "They have 3 days to respond",
              "They can submit counter-evidence"
            ]
          },
          {
            step: "3",
            title: "Evidence Submission",
            description: "Both parties submit all relevant evidence",
            timeframe: "3-5 business days",
            action: "Upload all documentation",
            details: [
              "Photos and videos of the issue",
              "Communication screenshots",
              "Tracking information and receipts",
              "Any other relevant documentation"
            ]
          },
          {
            step: "4",
            title: "Mediation Attempt",
            description: "We may attempt to mediate a mutually agreeable solution",
            timeframe: "2-3 business days",
            action: "Consider proposed solutions",
            details: [
              "Review proposed resolution options",
              "Respond to mediation offers",
              "Both parties must agree to mediation outcome"
            ]
          },
          {
            step: "5",
            title: "Final Decision",
            description: "If mediation fails, we make a final binding decision",
            timeframe: "Within 14 days total",
            action: "Accept final decision",
            details: [
              "Decision based on platform policies",
              "Evidence and communication reviewed",
              "Decision is final and binding"
            ]
          }
        ]
      },
      
      evidence: {
        title: "Evidence Guidelines",
        description: "What evidence helps resolve disputes faster",
        types: [
          {
            icon: <Package className="w-5 h-5" />,
            title: "Product Photos/Videos",
            description: "Clear images showing the issue from multiple angles"
          },
          {
            icon: <MessageSquare className="w-5 h-5" />,
            title: "Communication Records",
            description: "Screenshots of all platform conversations"
          },
          {
            icon: <FileText className="w-5 h-5" />,
            title: "Documentation",
            description: "Receipts, invoices, shipping labels, tracking info"
          },
          {
            icon: <Calendar className="w-5 h-5" />,
            title: "Timestamps",
            description: "Dates and times of key events and communications"
          }
        ]
      },
      
      outcomes: {
        title: "Possible Outcomes",
        description: "Resolutions we may implement based on dispute findings",
        scenarios: [
          {
            title: "Full Refund",
            description: "Buyer receives complete refund, seller keeps item",
            when: "Item not as described, damaged, or not received"
          },
          {
            title: "Partial Refund",
            description: "Buyer receives partial refund, keeps item",
            when: "Minor issues that don't warrant full refund"
          },
          {
            title: "Return & Refund",
            description: "Buyer returns item for full refund",
            when: "Item significantly different from description"
          },
          {
            title: "No Refund",
            description: "Transaction stands as completed",
            when: "No valid dispute reason found"
          },
          {
            title: "Platform Credit",
            description: "Credit issued for future purchases",
            when: "Compromise solution beneficial to both parties"
          }
        ]
      },
      
      tips: {
        title: "Best Practices",
        items: [
          "Document everything from the start of the transaction",
          "Communicate clearly and professionally through the platform",
          "Respond promptly to all messages and requests",
          "Submit clear, high-quality evidence",
          "Be reasonable in your expectations and requests",
          "Keep all communication on the platform only"
        ]
      }
    },
    
    ar: {
      title: "عملية حل النزاعات",
      subtitle: "التعامل مع النزاعات بشفافية وعدالة",
      description: "نضمن حل كل نزاع بشكل عادل وفعال",
      
      hero: {
        title: "حل النزاعات بعدالة",
        description: "عمليتنا المنظمة تضمن نتائج عادلة للمشترين والبائعين",
        guarantee: "ضمان الحل المحايد"
      },
      
      overview: {
        title: "كيف تعمل",
        description: "عملية حل النزاعات مصممة لتكون عادلة وشفافة وفعالة",
        steps: [
          {
            icon: <MessageSquare className="w-5 h-5" />,
            title: "التواصل أولاً",
            description: "نشجع الأطراف على حل المشاكل مباشرة عبر نظام المراسلة الخاص بنا"
          },
          {
            icon: <FileText className="w-5 h-5" />,
            title: "نزاع رسمي",
            description: "إذا فشل الحل المباشر، يمكن لأي طرف تقديم نزاع رسمي"
          },
          {
            icon: <Eye className="w-5 h-5" />,
            title: "مراجعة الأدلة",
            description: "فريقنا يراجع جميع الأدلة من كلا الطرفين بعناية"
          },
          {
            icon: <Gavel className="w-5 h-5" />,
            title: "قرار عادل",
            description: "نتخذ قرارات محايدة بناءً على سياسات المنصة والأدلة"
          }
        ]
      },
      
      timeline: {
        title: "الجدول الزمني للنزاع",
        description: "إطارات زمنية واضحة لكل مرحلة من مراحل عملية النزاع",
        phases: [
          {
            phase: "التواصل الأولي",
            timeframe: "خلال 24 ساعة",
            description: "الإقرار باستلام النزاع وطلب المعلومات الأولية"
          },
          {
            phase: "جمع الأدلة",
            timeframe: "3-5 أيام عمل",
            description: "كلا الطرفين يقدمان الأدلة والوثائق"
          },
          {
            phase: "فترة المراجعة",
            timeframe: "7-10 أيام عمل",
            description: "فريقنا يراجع بعناية جميع الأدلة المقدمة"
          },
          {
            phase: "القرار والحل",
            timeframe: "خلال 14 يوماً إجمالاً",
            description: "القرار النهائي متواصل ويتم تنفيذ الحل"
          }
        ]
      },
      
      process: {
        title: "العملية خطوة بخطوة",
        steps: [
          {
            step: "1",
            title: "قدم نزاعاً",
            description: "قدم نزاعاً عبر حسابك مع تفاصيل الطلب",
            timeframe: "في أي وقت",
            action: "اذهب إلى الطلب → أبلغ عن مشكلة",
            details: [
              "قدم رقم الطلب وسبب النزاع",
              "ارفع الأدلة الأولية إذا كانت متاحة",
              "حدد الحل المطلوب"
            ]
          },
          {
            step: "2",
            title: "إعلام الطرف الآخر",
            description: "الطرف الآخر يتلقى الإشعار ويمكنه الرد",
            timeframe: "خلال 24 ساعة",
            action: "انتظر الرد",
            details: [
              "الطرف الآخر يتلقى تفاصيل النزاع",
              "لديهم 3 أيام للرد",
              "يمكنهم تقديم أدلة مضادة"
            ]
          },
          {
            step: "3",
            title: "تقديم الأدلة",
            description: "كلا الطرفين يقدمان جميع الأدلة ذات الصلة",
            timeframe: "3-5 أيام عمل",
            action: "ارفع جميع الوثائق",
            details: [
              "صور وفيديوهات للمشكلة",
              "لقطات شاشة من التواصل",
              "معلومات التتبع والإيصالات",
              "أي وثائق ذات صلة أخرى"
            ]
          },
          {
            step: "4",
            title: "محاولة الوساطة",
            description: "قد نحاول التوسط في حل متفق عليه بشكل متبادل",
            timeframe: "2-3 أيام عمل",
            action: "فكر في الحلول المقترحة",
            details: [
              "راجع خيارات الحل المقترحة",
              "رد على عروض الوساطة",
              "يجب أن يوافق كلا الطرفين على نتيجة الوساطة"
            ]
          },
          {
            step: "5",
            title: "القرار النهائي",
            description: "إذا فشلت الوساطة، نتخذ قراراً نهائياً ملزماً",
            timeframe: "خلال 14 يوماً إجمالاً",
            action: "اقبل القرار النهائي",
            details: [
              "القرار بناءً على سياسات المنصة",
              "مراجعة الأدلة والتواصل",
              "القرار نهائي وملزم"
            ]
          }
        ]
      },
      
      evidence: {
        title: "إرشادات الأدلة",
        description: "ما هي الأدلة التي تساعد في حل النزاعات بشكل أسرع",
        types: [
          {
            icon: <Package className="w-5 h-5" />,
            title: "صور/فيديوهات المنتج",
            description: "صور واضحة تظهر المشكلة من زوايا متعددة"
          },
          {
            icon: <MessageSquare className="w-5 h-5" />,
            title: "سجلات التواصل",
            description: "لقطات شاشة من جميع المحادثات على المنصة"
          },
          {
            icon: <FileText className="w-5 h-5" />,
            title: "الوثائق",
            description: "إيصالات، فواتير، ملصقات الشحن، معلومات التتبع"
          },
          {
            icon: <Calendar className="w-5 h-5" />,
            title: "الطوابع الزمنية",
            description: "التواريخ والأوقات للأحداث والتواصل الرئيسية"
          }
        ]
      },
      
      outcomes: {
        title: "النتائج الممكنة",
        description: "الحلول التي قد ننفذها بناءً على نتائج النزاع",
        scenarios: [
          {
            title: "استرداد كامل",
            description: "المشتري يستلم استرداداً كاملاً، البائع يحتفظ بالمنتج",
            when: "المنتج ليس كما هو موصوف، تالف، أو لم يتم استلامه"
          },
          {
            title: "استرداد جزئي",
            description: "المشتري يستلم استرداداً جزئياً، يحتفظ بالمنتج",
            when: "مشاكل طفيرة لا تستحق استرداداً كاملاً"
          },
          {
            title: "إرجاع واسترداد",
            description: "المشتري يعيد المنتج مقابل استرداد كامل",
            when: "المنتج يختلف بشكل كبير عن الوصف"
          },
          {
            title: "لا استرداد",
            description: "المعاملة تقف كما هي مكتملة",
            when: "لم يتم العثور على سبب نزاع صالح"
          },
          {
            title: "رصيد المنصة",
            description: "رصيد صادر للمشتريات المستقبلية",
            when: "حل وسط مفيد لكلا الطرفين"
          }
        ]
      },
      
      tips: {
        title: "أفضل الممارسات",
        items: [
          "وثق كل شيء من بداية المعاملة",
          "تواصل بوضوح واحترافية عبر المنصة",
          "استجب بسرعة لجميع الرسائل والطلبات",
          "قدم أدلة واضحة وعالية الجودة",
          "كن معقولاً في توقعاتك وطلباتك",
          "احتفظ بكل التواصل على المنصة فقط"
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
            <Scale className="w-16 h-16 mx-auto mb-4" />
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
        {/* Overview Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.overview.title}</h3>
          <p className="text-gray-600 mb-6">{t.overview.description}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.overview.steps.map((step, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {step.icon}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Timeline Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.timeline.title}</h3>
          <p className="text-gray-600 mb-6">{t.timeline.description}</p>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {t.timeline.phases.map((phase, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{phase.phase}</h4>
                      <p className="text-gray-600 text-sm mt-1">{phase.description}</p>
                      <Badge variant="outline" className="mt-2">
                        <Clock className="w-3 h-3 mr-1" />
                        {phase.timeframe}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Process Tabs */}
        <Tabs defaultValue="process" className="mb-12">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="process">
              {selectedLanguage === 'en' ? 'Process' : 'العملية'}
            </TabsTrigger>
            <TabsTrigger value="evidence">
              {selectedLanguage === 'en' ? 'Evidence' : 'الأدلة'}
            </TabsTrigger>
            <TabsTrigger value="outcomes">
              {selectedLanguage === 'en' ? 'Outcomes' : 'النتائج'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="process">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="w-5 h-5" />
                  {t.process.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {t.process.steps.map((step, index) => (
                    <div key={index} className="border-l-4 border-yellow-600 pl-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg">{step.title}</h4>
                          <p className="text-gray-600 mt-2">{step.description}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {step.timeframe}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              <ArrowRight className="w-3 h-3 mr-1" />
                              {step.action}
                            </Badge>
                          </div>
                          <ul className="mt-3 space-y-1">
                            {step.details.map((detail, detailIndex) => (
                              <li key={detailIndex} className="text-sm text-gray-600 flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evidence">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.evidence.title}</h3>
              <p className="text-gray-600 mb-6">{t.evidence.description}</p>
              <div className="grid md:grid-cols-2 gap-4">
                {t.evidence.types.map((type, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {type.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{type.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="outcomes">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.outcomes.title}</h3>
              <p className="text-gray-600 mb-6">{t.outcomes.description}</p>
              <div className="space-y-4">
                {t.outcomes.scenarios.map((scenario, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{scenario.title}</h4>
                          <p className="text-gray-600 text-sm mt-1">{scenario.description}</p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {scenario.when}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
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
            {selectedLanguage === 'en' ? 'Need to File a Dispute?' : 'هل تحتاج إلى تقديم نزاع؟'}
          </h2>
          <p className="text-lg mb-6 opacity-90">
            {selectedLanguage === 'en' 
              ? 'Our dispute resolution team is here to help' 
              : 'فريق حل النزاعات لدينا هنا لمساعدتك'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-yellow-700 hover:bg-gray-100">
              <FileText className="w-4 h-4 mr-2" />
              {selectedLanguage === 'en' ? 'File Dispute' : 'قدم نزاعاً'}
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-yellow-700">
              <Mail className="w-4 h-4 mr-2" />
              {selectedLanguage === 'en' ? 'Contact Support' : 'تواصل مع الدعم'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputeResolutionPage;
