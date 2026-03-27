import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  Clock, 
  Users,
  HelpCircle,
  Send,
  Globe,
  Shield,
  CheckCircle,
  AlertTriangle,
  FileText,
  Calendar,
  MapPin,
  Star
} from 'lucide-react';

const ContactSupportPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar'>('en');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });

  const content = {
    en: {
      title: "Contact & Support",
      subtitle: "We're here to help",
      description: "Get in touch with our support team for any questions or assistance",
      
      hero: {
        title: "How Can We Help You?",
        description: "Our support team is available 24/7 to assist you with any questions, concerns, or technical issues.",
        responseTime: "Average response time: 2-4 hours"
      },
      
      contactMethods: {
        title: "Contact Methods",
        description: "Choose the best way to reach us based on your needs",
        methods: [
          {
            icon: <Mail className="w-6 h-6" />,
            title: "Email Support",
            description: "Send us a detailed message and we'll respond within 24 hours",
            contact: "support@mnbarh.com",
            responseTime: "Within 24 hours",
            bestFor: "Detailed inquiries, documentation requests"
          },
          {
            icon: <MessageSquare className="w-6 h-6" />,
            title: "Live Chat",
            description: "Get instant help from our support agents during business hours",
            contact: "Available on website",
            responseTime: "Instant during business hours",
            bestFor: "Quick questions, urgent issues"
          },
          {
            icon: <Phone className="w-6 h-6" />,
            title: "Phone Support",
            description: "Speak directly with our support team for complex issues",
            contact: "+1-800-MNBARH",
            responseTime: "Mon-Fri, 9AM-6PM EST",
            bestFor: "Urgent matters, complex problems"
          }
        ]
      },
      
      categories: {
        title: "Help Categories",
        description: "Select the category that best describes your issue",
        options: [
          {
            value: "general",
            label: "General Inquiry",
            description: "General questions about Mnbarh services",
            icon: <HelpCircle className="w-4 h-4" />
          },
          {
            value: "account",
            label: "Account Issues",
            description: "Login, registration, profile problems",
            icon: <Users className="w-4 h-4" />
          },
          {
            value: "payment",
            label: "Payment & Billing",
            description: "Transactions, refunds, fee questions",
            icon: <Shield className="w-4 h-4" />
          },
          {
            value: "technical",
            label: "Technical Support",
            description: "Website errors, app issues, bugs",
            icon: <AlertTriangle className="w-4 h-4" />
          },
          {
            value: "dispute",
            label: "Dispute Resolution",
            description: "Order problems, seller/buyer conflicts",
            icon: <FileText className="w-4 h-4" />
          },
          {
            value: "safety",
            label: "Safety & Security",
            description: "Report suspicious activity, security concerns",
            icon: <Shield className="w-4 h-4" />
          }
        ]
      },
      
      responseTimes: {
        title: "Response Times",
        description: "When you can expect to hear back from us",
        times: [
          {
            category: "Email Support",
            time: "Within 24 hours",
            details: "Most inquiries answered within 2-4 hours"
          },
          {
            category: "Live Chat",
            time: "Instant",
            details: "Available during business hours"
          },
          {
            category: "Phone Support",
            time: "Immediate",
            details: "Average wait time under 2 minutes"
          },
          {
            category: "Urgent Issues",
            time: "Within 1 hour",
            details: "Priority handling for critical problems"
          }
        ]
      },
      
      faq: {
        title: "Frequently Asked Questions",
        description: "Quick answers to common questions",
        questions: [
          {
            question: "How do I track my order?",
            answer: "Go to 'My Orders' in your account dashboard to see real-time tracking information."
          },
          {
            question: "What is your return policy?",
            answer: "Most items can be returned within 30 days if they're not as described."
          },
          {
            question: "How do I report a problem with my order?",
            answer: "Contact the seller first through the platform messaging system, then file a dispute if needed."
          },
          {
            question: "Is my payment information secure?",
            answer: "Yes, we use industry-standard encryption and never store your payment details."
          },
          {
            question: "How do I become a seller?",
            answer: "Click 'Start Selling' on our homepage and complete the quick verification process."
          }
        ]
      },
      
      offices: {
        title: "Our Offices",
        description: "Global presence to serve you better",
        locations: [
          {
            city: "Headquarters",
            address: "123 Commerce Street, Dubai, UAE",
            phone: "+971-4-123-4567",
            email: "hq@mnbarh.com"
          },
          {
            city: "North America",
            address: "456 Market Avenue, New York, NY 10013",
            phone: "+1-800-MNBARH",
            email: "usa@mnbarh.com"
          },
          {
            city: "Europe",
            address: "789 Trade Road, London, UK EC1A 1BB",
            phone: "+44-20-7123-4567",
            email: "europe@mnbarh.com"
          },
          {
            city: "Asia Pacific",
            address: "321 Commerce Tower, Singapore 238895",
            phone: "+65-6234-5678",
            email: "asia@mnbarh.com"
          }
        ]
      },
      
      tips: {
        title: "Tips for Faster Support",
        items: [
          "Include your order number in all communications",
          "Provide screenshots for technical issues",
          "Be specific about your problem or question",
          "Check our FAQ section before contacting support",
          "Use the most appropriate contact method for your issue"
        ]
      }
    },
    
    ar: {
      title: "التواصل والدعم",
      subtitle: "نحن هنا لمساعدتك",
      description: "تواصل مع فريق الدعم لدينا لأي أسئلة أو مساعدة",
      
      hero: {
        title: "كيف يمكننا مساعدتك؟",
        description: "فريق الدعم لدينا متاح 24/7 لمساعدتك في أي أسئلة أو مخاوف أو مشاكل تقنية.",
        responseTime: "متوسط وقت الاستجابة: 2-4 ساعات"
      },
      
      contactMethods: {
        title: "طرق التواصل",
        description: "اختر أفضل طريقة للوصول إلينا بناءً على احتياجاتك",
        methods: [
          {
            icon: <Mail className="w-6 h-6" />,
            title: "الدعم عبر البريد الإلكتروني",
            description: "أرسل لنا رسالة مفصلة وسنرد خلال 24 ساعة",
            contact: "support@mnbarh.com",
            responseTime: "خلال 24 ساعة",
            bestFor: "الاستفسارات المفصلة، طلبات الوثائق"
          },
          {
            icon: <MessageSquare className="w-6 h-6" />,
            title: "الدردشة الحية",
            description: "احصل على مساعدة فورية من وكلاء الدعم خلال ساعات العمل",
            contact: "متاح على الموقع",
            responseTime: "فورية خلال ساعات العمل",
            bestFor: "الأسئلة السريعة، المشاكل العاجلة"
          },
          {
            icon: <Phone className="w-6 h-6" />,
            title: "الدعم الهاتفي",
            description: "تحدث مباشرة مع فريق الدعم لدينا للمشاكل المعقدة",
            contact: "+1-800-MNBARH",
            responseTime: "الإثنين-الجمعة، 9ص-6م توقيت شرق الولايات المتحدة",
            bestFor: "المسائل العاجلة، المشاكل المعقدة"
          }
        ]
      },
      
      categories: {
        title: "فئات المساعدة",
        description: "اختر الفئة التي تصف مشكلتك بشكل أفضل",
        options: [
          {
            value: "general",
            label: "استفسار عام",
            description: "أسئلة عامة حول خدمات منبره",
            icon: <HelpCircle className="w-4 h-4" />
          },
          {
            value: "account",
            label: "مشاكل الحساب",
            description: "مشاكل تسجيل الدخول، التسجيل، الملف الشخصي",
            icon: <Users className="w-4 h-4" />
          },
          {
            value: "payment",
            label: "الدفع والفواتير",
            description: "المعاملات، الاستردادات، أسئلة الرسوم",
            icon: <Shield className="w-4 h-4" />
          },
          {
            value: "technical",
            label: "الدعم التقني",
            description: "أخطاء الموقع، مشاكل التطبيق، الأخطاء",
            icon: <AlertTriangle className="w-4 h-4" />
          },
          {
            value: "dispute",
            label: "حل النزاعات",
            description: "مشاكل الطلبات، نزاعات البائع/المشتري",
            icon: <FileText className="w-4 h-4" />
          },
          {
            value: "safety",
            label: "السلامة والأمان",
            description: "الإبلاغ عن نشاط مشبوه، مخاوف الأمان",
            icon: <Shield className="w-4 h-4" />
          }
        ]
      },
      
      responseTimes: {
        title: "أوقات الاستجابة",
        description: "متى تتوقع الرد منا",
        times: [
          {
            category: "الدعم عبر البريد الإلكتروني",
            time: "خلال 24 ساعة",
            details: "معظم الاستفسارات ترد خلال 2-4 ساعات"
          },
          {
            category: "الدردشة الحية",
            time: "فورية",
            details: "متاحة خلال ساعات العمل"
          },
          {
            category: "الدعم الهاتفي",
            time: "فورية",
            details: "متوسط وقت الانتظار أقل من دقيقتين"
          },
          {
            category: "المشاكل العاجلة",
            time: "خلال ساعة واحدة",
            details: "معالجة أولوية للمشاكل الحرجة"
          }
        ]
      },
      
      faq: {
        title: "الأسئلة الشائعة",
        description: "إجابات سريعة للأسئلة الشائعة",
        questions: [
          {
            question: "كيف أتعقب طلبي؟",
            answer: "اذهب إلى 'طلباتي' في لوحة تحكم حسابك لرؤية معلومات التتبع في الوقت الفعلي."
          },
          {
            question: "ما هي سياسة الإرجاع الخاصة بكم؟",
            answer: "معظم البنود يمكن إرجاعها خلال 30 يوماً إذا لم تكن كما هو موصوفة."
          },
          {
            question: "كيف أبلغ عن مشكلة في طلبي؟",
            answer: "تواصل مع البائع أولاً عبر نظام المراسلة على المنصة، ثم قدم نزاعاً إذا لزم الأمر."
          },
          {
            question: "هل معلومات الدفع الخاصة بي آمنة؟",
            answer: "نعم، نستخدم تشفير معياري في الصناعة ولا نخزن تفاصيل الدفع الخاصة بك أبداً."
          },
          {
            question: "كيف أصبح بائعاً؟",
            answer: "انقر 'ابدأ البيع' على صفحتنا الرئيسية وأكمل عملية التحقق السريعة."
          }
        ]
      },
      
      offices: {
        title: "مكاتبنا",
        description: "وجود عالمي لخدمتك بشكل أفضل",
        locations: [
          {
            city: "المقر الرئيسي",
            address: "123 شارع التجارة، دبي، الإمارات",
            phone: "+971-4-123-4567",
            email: "hq@mnbarh.com"
          },
          {
            city: "أمريكا الشمالية",
            address: "456 جادة السوق، نيويورك، نيويورك 10013",
            phone: "+1-800-MNBARH",
            email: "usa@mnbarh.com"
          },
          {
            city: "أوروبا",
            address: "789 طريق التجارة، لندن، المملكة المتحدة EC1A 1BB",
            phone: "+44-20-7123-4567",
            email: "europe@mnbarh.com"
          },
          {
            city: "آسيا والمحيط الهادئ",
            address: "321 برج التجارة، سنغافورة 238895",
            phone: "+65-6234-5678",
            email: "asia@mnbarh.com"
          }
        ]
      },
      
      tips: {
        title: "نصائح لدعم أسرع",
        items: [
          "تضمين رقم طلبك في جميع الاتصالات",
          "قدم لقطات شاشة للمشاكل التقنية",
          "كن محدداً حول مشكلتك أو سؤالك",
          "تحقق من قسم الأسئلة الشائعة قبل الاتصال بالدعم",
          "استخدم طريقة الاتصال الأنسب لمشكلتك"
        ]
      }
    }
  };

  const t = content[selectedLanguage];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted:', formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
            <HelpCircle className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4">{t.hero.title}</h2>
            <p className="text-xl mb-6 opacity-90 max-w-3xl mx-auto">{t.hero.description}</p>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
              <Clock className="w-6 h-6" />
              <span className="text-lg font-semibold">{t.hero.responseTime}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Contact Methods */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">{t.contactMethods.title}</h3>
          <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl mx-auto">{t.contactMethods.description}</p>
          <div className="grid md:grid-cols-3 gap-6">
            {t.contactMethods.methods.map((method, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {method.icon}
                  </div>
                  <h4 className="font-semibold text-gray-900 text-lg mb-2">{method.title}</h4>
                  <p className="text-gray-600 mb-4">{method.description}</p>
                  <div className="space-y-2">
                    <div className="font-medium text-blue-600">{method.contact}</div>
                    <Badge variant="outline" className="text-xs">
                      {method.responseTime}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {selectedLanguage === 'en' ? 'Best for:' : 'الأفضل لـ:'} {method.bestFor}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                <Send className="w-5 h-5 inline mr-2" />
                {selectedLanguage === 'en' ? 'Send us a Message' : 'أرسل لنا رسالة'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {selectedLanguage === 'en' ? 'Your Name' : 'اسمك'}
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {selectedLanguage === 'en' ? 'Email Address' : 'البريد الإلكتروني'}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedLanguage === 'en' ? 'Category' : 'الفئة'}
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    {t.categories.options.map((option, index) => (
                      <option key={index} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedLanguage === 'en' ? 'Subject' : 'الموضوع'}
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedLanguage === 'en' ? 'Message' : 'الرسالة'}
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                </div>
                
                <div className="text-center">
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-yellow-600 text-white hover:bg-yellow-700 px-8"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {selectedLanguage === 'en' ? 'Send Message' : 'إرسال الرسالة'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Response Times */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.responseTimes.title}</h3>
          <p className="text-gray-600 mb-8">{t.responseTimes.description}</p>
          <div className="grid md:grid-cols-2 gap-4">
            {t.responseTimes.times.map((time, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{time.category}</h4>
                  <div className="text-2xl font-bold text-yellow-600 mb-1">{time.time}</div>
                  <p className="text-sm text-gray-600">{time.details}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.faq.title}</h3>
          <p className="text-gray-600 mb-8">{t.faq.description}</p>
          <div className="space-y-4">
            {t.faq.questions.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mb-16">
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
            {selectedLanguage === 'en' ? 'Still Need Help?' : 'هل لا تزال بحاجة إلى مساعدة؟'}
          </h2>
          <p className="text-lg mb-6 opacity-90">
            {selectedLanguage === 'en' 
              ? 'Our dedicated support team is ready to assist you' 
              : 'فريق الدعم المخصص لدينا جاهز لمساعدتك'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-yellow-700 hover:bg-gray-100">
              <Mail className="w-4 h-4 mr-2" />
              {selectedLanguage === 'en' ? 'Email Support' : 'الدعم عبر البريد'}
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-yellow-700">
              <MessageSquare className="w-4 h-4 mr-2" />
              {selectedLanguage === 'en' ? 'Start Live Chat' : 'ابدأ الدردشة الحية'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSupportPage;
