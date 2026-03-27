import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  Camera,
  FileText,
  Shield,
  Star,
  CheckCircle,
  ArrowRight,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

const HelpSellingPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar'>('en');

  const content = {
    en: {
      title: "Selling Help & Guide",
      subtitle: "Master the art of selling",
      description: "Everything you need to know to become a successful seller on Mnbarh",
      
      hero: {
        title: "Become a Successful Seller",
        description: "Learn the best practices and strategies to maximize your sales"
      },
      
      gettingStarted: {
        title: "Getting Started",
        description: "Your journey to successful selling starts here",
        steps: [
          {
            icon: <Users className="w-6 h-6" />,
            title: "Create Your Account",
            description: "Sign up and complete your profile verification to start selling"
          },
          {
            icon: <Camera className="w-6 h-6" />,
            title: "Take Great Photos",
            description: "Clear, well-lit photos from multiple angles increase sales"
          },
          {
            icon: <FileText className="w-6 h-6" />,
            title: "Write Compelling Descriptions",
            description: "Detailed, honest descriptions build trust and reduce returns"
          },
          {
            icon: <DollarSign className="w-6 h-6" />,
            title: "Set Competitive Prices",
            description: "Research similar items and price competitively to attract buyers"
          }
        ]
      },
      
      bestPractices: {
        title: "Best Practices",
        description: "Proven strategies from top sellers",
        practices: [
          {
            title: "Product Photography",
            icon: <Camera className="w-8 h-8 text-blue-600" />,
            tips: [
              "Use natural lighting whenever possible",
              "Show item from multiple angles",
              "Include scale reference (coin, ruler)",
              "Highlight any flaws or wear honestly",
              "Use clean, clutter-free backgrounds"
            ]
          },
          {
            title: "Pricing Strategy",
            icon: <DollarSign className="w-8 h-8 text-green-600" />,
            tips: [
              "Research completed listings for similar items",
              "Consider starting with auction-style pricing",
              "Factor in shipping costs",
              "Set a reasonable reserve price",
              "Be competitive but profitable"
            ]
          },
          {
            title: "Description Writing",
            icon: <FileText className="w-8 h-8 text-purple-600" />,
            tips: [
              "Include all relevant specifications",
              "Be honest about condition and flaws",
              "Use keywords buyers search for",
              "Tell the item's story when relevant",
              "Include measurements and sizing"
            ]
          },
          {
            title: "Customer Service",
            icon: <Users className="w-8 h-8 text-yellow-600" />,
            tips: [
              "Respond to questions quickly",
              "Be professional and courteous",
              "Ship items promptly after payment",
              "Provide tracking information",
              "Handle issues professionally"
            ]
          }
        ]
      },
      
      shippingGuide: {
        title: "Shipping Guide",
        description: "Get your items to buyers safely and efficiently",
        sections: [
          {
            title: "Packaging Tips",
            tips: [
              "Use appropriate box size for the item",
              "Wrap items securely with bubble wrap",
              "Fill empty spaces to prevent movement",
              "Use waterproof packaging for sensitive items",
              "Include packing slip with order details"
            ]
          },
          {
            title: "Shipping Options",
            options: [
              { name: "Standard Shipping", time: "3-5 days", cost: "Low", best: "Everyday items" },
              { name: "Express Shipping", time: "1-2 days", cost: "Medium", best: "Urgent deliveries" },
              { name: "International", time: "7-14 days", cost: "High", best: "Global buyers" },
              { name: "Local Pickup", time: "Same day", cost: "Free", best: "Large items" }
            ]
          },
          {
            title: "Tracking & Insurance",
            tips: [
              "Always use tracked shipping for valuable items",
              "Keep shipping receipts until delivery confirmed",
              "Consider insurance for high-value items",
              "Upload tracking information promptly",
              "Communicate tracking details to buyers"
            ]
          }
        ]
      },
      
      commonIssues: {
        title: "Common Issues & Solutions",
        description: "Handle challenges like a pro",
        issues: [
          {
            problem: "Item Not Selling",
            solutions: [
              "Review and improve your photos",
              "Check if pricing is competitive",
              "Enhance your description with more details",
              "Consider promoting your listing",
              "Try different listing times"
            ]
          },
          {
            problem: "Payment Issues",
            solutions: [
              "Verify your payment account is active",
              "Check for payment holds or restrictions",
              "Ensure bank details are correct",
              "Contact support for payment delays",
              "Keep payment information updated"
            ]
          },
          {
            problem: "Shipping Problems",
            solutions: [
              "Double-check addresses before shipping",
              "Use reliable shipping carriers",
              "Package items securely",
              "Get insurance for valuable items",
              "Track shipments until delivery"
            ]
          },
          {
            problem: "Difficult Buyers",
            solutions: [
              "Maintain professional communication",
              "Document all interactions",
              "Know your rights as a seller",
              "Use platform dispute resolution",
              "Block problematic buyers if necessary"
            ]
          }
        ]
      },
      
      tools: {
        title: "Seller Tools & Features",
        description: "Tools to help you sell more effectively",
        features: [
          {
            name: "Seller Dashboard",
            description: "Track sales, manage listings, and view analytics",
            icon: <TrendingUp className="w-6 h-6" />
          },
          {
            name: "Bulk Listing",
            description: "List multiple items quickly with templates",
            icon: <Package className="w-6 h-6" />
          },
          {
            name: "Promoted Listings",
            description: "Boost visibility of your items",
            icon: <Star className="w-6 h-6" />
          },
          {
            name: "Mobile App",
            description: "Manage your store on the go",
            icon: <Users className="w-6 h-6" />
          }
        ]
      },
      
      faq: {
        title: "Frequently Asked Questions",
        questions: [
          {
            q: "How much does it cost to sell?",
            a: "We charge a 5% commission on successful sales. No listing fees for standard accounts."
          },
          {
            q: "When do I get paid?",
            a: "Payments are released 3 days after buyer confirms receipt, or 7 days after delivery if not confirmed."
          },
          {
            q: "What if a buyer returns an item?",
            a: "Follow our return policy guidelines. Document the item's condition and communicate clearly with the buyer."
          },
          {
            q: "How do I handle international shipping?",
            a: "Use our integrated international shipping partners or arrange your own. Include customs forms when required."
          },
          {
            q: "Can I sell used items?",
            a: "Yes! Used items are welcome. Just be honest about condition and include clear photos of any wear."
          }
        ]
      }
    },
    
    ar: {
      title: "مساعدة البيع",
      subtitle: "أتقن فن البيع",
      description: "كل ما تحتاج لمعرفته لتصبح بائعاً ناجحاً على منبره",
      
      hero: {
        title: "كن بائعاً ناجحاً",
        description: "تعلم أفضل الممارسات والاستراتيجيات لزيادة مبيعاتك"
      },
      
      gettingStarted: {
        title: "البدء",
        description: "رحلتك نحو البيع الناجح تبدأ هنا",
        steps: [
          {
            icon: <Users className="w-6 h-6" />,
            title: "إنشاء حسابك",
            description: "سجل وأكمل التحقق من ملفك لبدء البيع"
          },
          {
            icon: <Camera className="w-6 h-6" />,
            title: "التقط صوراً رائعة",
            description: "الصور الواضحة والمضاءة جيداً من زوايا متعددة تزيد المبيعات"
          },
          {
            icon: <FileText className="w-6 h-6" />,
            title: "اكتب أوصافاً مقنعة",
            description: "الأوصاف التفصيلية والصادقة تبني الثقة وتقلل الإرجاعات"
          },
          {
            icon: <DollarSign className="w-6 h-6" />,
            title: "حدد أسعاراً تنافسية",
            description: "ابحث عن عناصر مماثلة وسعر تنافسياً لجذب المشترين"
          }
        ]
      },
      
      bestPractices: {
        title: "أفضل الممارسات",
        description: "استراتيجيات مثبتة من أفضل البائعين",
        practices: [
          {
            title: "تصوير المنتجات",
            icon: <Camera className="w-8 h-8 text-blue-600" />,
            tips: [
              "استخدم الإضاءة الطبيعية كلما أمكن",
              "أظهر العنصر من زوايا متعددة",
              "أضف مرجعاً للمقياس (عملة، مسطرة)",
              "سلط الضوء بصدق على أي عيوب أو استهلاك",
              "استخدم خلفيات نظيفة وخالية من الفوضى"
            ]
          },
          {
            title: "استراتيجية التسعير",
            icon: <DollarSign className="w-8 h-8 text-green-600" />,
            tips: [
              "ابحث عن القوائم المكتملة لعناصر مماثلة",
              "فكر في البدء بالتسعير على طراز المزاد",
              "خذ في الاعتبار تكاليف الشحن",
              "حدد سعر احتياطي معقول",
              "كن تنافسياً ولكن مربحاً"
            ]
          },
          {
            title: "كتابة الأوصاف",
            icon: <FileText className="w-8 h-8 text-purple-600" />,
            tips: [
              "أضف جميع المواصفات ذات الصلة",
              "كن صادقاً حول الحالة والعيوب",
              "استخدم كلمات مفتاحية يبحث عنها المشترين",
              "احكِ قصة العنصر عند الاقتضاء",
              "أضف القياسات والمقاسات"
            ]
          },
          {
            title: "خدمة العملاء",
            icon: <Users className="w-8 h-8 text-yellow-600" />,
            tips: [
              "رد على الأسئلة بسرعة",
              "كن محترفاً ومهذباً",
              "شحن العناصر بسرعة بعد الدفع",
              "قدم معلومات التتبع",
              "تعامل مع المشاكل باحترافية"
            ]
          }
        ]
      },
      
      shippingGuide: {
        title: "دليل الشحن",
        description: "وصل عناصرك إلى المشترين بأمان وكفاءة",
        sections: [
          {
            title: "نصائح التغليف",
            tips: [
              "استخدم حجم الصندوق المناسب للعنصر",
              "لف العناصر بأمان مع غلاف الفقاعات",
              "املأ الفراغات لمنع الحركة",
              "استخدم تغليفاً مقاوماً للماء للعناصر الحساسة",
              "أضف قسيمة الشحن مع تفاصيل الطلب"
            ]
          },
          {
            title: "خيارات الشحن",
            options: [
              { name: "الشحن القياسي", time: "3-5 أيام", cost: "منخفض", best: "العناصر اليومية" },
              { name: "الشحن السريع", time: "1-2 يوم", cost: "متوسط", best: "التوصيلات العاجلة" },
              { name: "دولي", time: "7-14 يوم", cost: "مرتفع", best: "المشترون العالميون" },
              { name: "الاستلام المحلي", time: "نفس اليوم", cost: "مجاني", best: "العناصر الكبيرة" }
            ]
          },
          {
            title: "التتبع والتأمين",
            tips: [
              "استخدم دائماً الشحن المتتبع للعناصر القيمة",
              "احتفظ بإيصالات الشحن حتى تأكيد التسليم",
              "فكر في التأمين للعناصر عالية القيمة",
              "ارفع معلومات التتبع بسرعة",
              "تواصل تفاصيل التتبع مع المشترين"
            ]
          }
        ]
      },
      
      commonIssues: {
        title: "المشاكل الشائعة والحلول",
        description: "تعامل مع التحديات كمحترف",
        issues: [
          {
            problem: "العنصر لا يباع",
            solutions: [
              "راجع وحسن صورك",
              "تحقق إذا كان التسعير تنافسياً",
              "عزز وصفك بمزيد من التفاصيل",
              "فكر في الترويج لقائمتك",
              "جرب أوقات قائمة مختلفة"
            ]
          },
          {
            problem: "مشاكل الدفع",
            solutions: [
              "تحقق من أن حساب الدفع نشط",
              "تحقق من احتجازات أو قيود الدفع",
              "تأكد من تفاصيل البنك صحيحة",
              "تواصل مع الدعم لتأخيرات الدفع",
              "حافظ على معلومات الدفع محدثة"
            ]
          },
          {
            problem: "مشاكل الشحن",
            solutions: [
              "تحقق مزدوج من العناوين قبل الشحن",
              "استخدم شركات شحن موثوقة",
              "غلف العناصر بأمان",
              "احصل على تأمين للعناصر القيمة",
              "تتبع الشحنات حتى التسليم"
            ]
          },
          {
            problem: "المشترون الصعبون",
            solutions: [
              "حافظ على التواصل الاحترافي",
              "وثق جميع التفاعلات",
              "اعرف حقوقك كبائع",
              "استخدم حل النزاعات على المنصة",
              "احظر المشترين المثيرين للمشاكل إذا لزم الأمر"
            ]
          }
        ]
      },
      
      tools: {
        title: "أدوات البائعين والميزات",
        description: "أدوات لمساعدتك على البيع بفعالية أكبر",
        features: [
          {
            name: "لوحة تحكم البائعين",
            description: "تتبع المبيعات، إدارة القوائم، وعرض التحليلات",
            icon: <TrendingUp className="w-6 h-6" />
          },
          {
            name: "القوائم المجمعة",
            description: "سرد عناصر متعددة بسرعة مع القوالب",
            icon: <Package className="w-6 h-6" />
          },
          {
            name: "القوائم المروجة",
            description: "تعزيز رؤية عناصرك",
            icon: <Star className="w-6 h-6" />
          },
          {
            name: "تطبيق الجوال",
            description: "إدارة متجرك أثناء التنقل",
            icon: <Users className="w-6 h-6" />
          }
        ]
      },
      
      faq: {
        title: "الأسئلة الشائعة",
        questions: [
          {
            q: "كم يكلف البيع؟",
            a: "نحن نحصل على عمولة 5% على المبيعات الناجحة. لا توجد رسوم قائمة للحسابات القياسية."
          },
          {
            q: "متى أحصل على الدفع؟",
            a: "يتم إطلاق الدفعات بعد 3 أيام من تأكيد المشتري الاستلام، أو 7 أيام بعد التسليم إذا لم يتم التأكيد."
          },
          {
            q: "ماذا لو أعاد المشتري عنصراً؟",
            a: "اتبع إرشادات سياسة الإرجاع الخاصة بنا. وثق حالة العنصر وتواصل بوضوح مع المشتري."
          },
          {
            q: "كيف أتعامل مع الشحن الدولي؟",
            a: "استخدم شركاء الشحن الدوليين المتكاملين أو رتب الخاص بك. أضف نماذج الجمارك عند الاقتضاء."
          },
          {
            q: "هل يمكنني بيع العناصر المستعملة؟",
            a: "نعم! العناصر المستعملة مرحب بها. فقط كن صادقاً حول الحالة وأضف صوراً واضحة لأي استهلاك."
          }
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
            <BookOpen className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4">{t.hero.title}</h2>
            <p className="text-xl mb-6 opacity-90 max-w-3xl mx-auto">{t.hero.description}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Getting Started */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">{t.gettingStarted.title}</h2>
          <p className="text-lg text-gray-600 mb-8">{t.gettingStarted.description}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.gettingStarted.steps.map((step, index) => (
              <Card key={index}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {step.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">{t.bestPractices.title}</h2>
          <p className="text-lg text-gray-600 mb-8">{t.bestPractices.description}</p>
          <div className="space-y-8">
            {t.bestPractices.practices.map((practice, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {practice.icon}
                    {practice.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-3">
                    {practice.tips.map((tip, tipIndex) => (
                      <div key={tipIndex} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{tip}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Shipping Guide */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">{t.shippingGuide.title}</h2>
          <p className="text-lg text-gray-600 mb-8">{t.shippingGuide.description}</p>
          <div className="space-y-8">
            {t.shippingGuide.sections.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {section.tips && (
                    <div className="grid md:grid-cols-2 gap-3">
                      {section.tips.map((tip, tipIndex) => (
                        <div key={tipIndex} className="flex items-start gap-2">
                          <Package className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {section.options && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Option</th>
                            <th className="text-left p-3">Time</th>
                            <th className="text-left p-3">Cost</th>
                            <th className="text-left p-3">Best For</th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.options.map((option, optIndex) => (
                            <tr key={optIndex} className="border-b">
                              <td className="p-3 font-medium">{option.name}</td>
                              <td className="p-3">{option.time}</td>
                              <td className="p-3">{option.cost}</td>
                              <td className="p-3">{option.best}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Common Issues */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">{t.commonIssues.title}</h2>
          <p className="text-lg text-gray-600 mb-8">{t.commonIssues.description}</p>
          <div className="grid md:grid-cols-2 gap-6">
            {t.commonIssues.issues.map((issue, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-red-600">{issue.problem}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    {issue.solutions.map((solution, solIndex) => (
                      <div key={solIndex} className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{solution}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">{t.tools.title}</h2>
          <p className="text-lg text-gray-600 mb-8">{t.tools.description}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.tools.features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.name}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">{t.faq.title}</h2>
          <div className="space-y-4">
            {t.faq.questions.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                      <p className="text-gray-600">{faq.a}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">
            {selectedLanguage === 'en' ? 'Ready to Start Selling?' : 'هل أنت مستعد لبدء البيع؟'}
          </h2>
          <p className="text-lg mb-6 opacity-90">
            {selectedLanguage === 'en' 
              ? 'Apply these strategies and watch your sales grow!' 
              : 'طبق هذه الاستراتيجيات وشاهد مبيعاتك تنمو!'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-yellow-700 hover:bg-gray-100">
              <Package className="w-4 h-4 mr-2" />
              {selectedLanguage === 'en' ? 'Start Selling' : 'ابدأ البيع'}
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-yellow-700">
              <BookOpen className="w-4 h-4 mr-2" />
              {selectedLanguage === 'en' ? 'More Resources' : 'المزيد من الموارد'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSellingPage;
