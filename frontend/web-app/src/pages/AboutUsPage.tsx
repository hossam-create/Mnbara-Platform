import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Users, 
  Globe, 
  Shield, 
  Target,
  Lightbulb,
  Award,
  TrendingUp,
  Star,
  CheckCircle,
  Mail,
  Twitter,
  Linkedin,
  Instagram
} from 'lucide-react';
import { getCmsContent } from '@/services/crafterContent.service';

const AboutUsPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar'>('en');
  const [cmsHero, setCmsHero] = useState<{ title?: string; description?: string } | null>(null);

  useEffect(() => {
    const loadCmsHero = async () => {
      const locale = selectedLanguage === 'ar' ? 'ar' : 'en';
      const response = await getCmsContent('about-us', {
        siteId: 'mnbara',
        locale,
      });

      if (response?.success && response.data?.content) {
        const c = response.data.content as any;
        const title =
          c.heroTitle ||
          c.title ||
          c.hero?.title;
        const description =
          c.heroDescription ||
          c.description ||
          c.hero?.description;

        if (title || description) {
          setCmsHero({ title, description });
        }
      }
    };

    loadCmsHero();
  }, [selectedLanguage]);

  const content = {
    en: {
      title: "About Mnbarh",
      subtitle: "Connecting people through trusted commerce",
      description: "Building the world's most trusted marketplace",
      
      hero: {
        title: cmsHero?.title || "Welcome to Mnbarh",
        description: cmsHero?.description || "We're on a mission to make online buying, selling, and global shopping simple, secure, and accessible to everyone.",
        tagline: "Your Trusted Marketplace"
      },
      
      mission: {
        title: "Our Mission",
        description: "To create a global marketplace where trust, transparency, and opportunity come together to benefit everyone.",
        pillars: [
          {
            icon: <Shield className="w-6 h-6" />,
            title: "Trust First",
            description: "Every transaction is protected, every user is verified, every dispute is resolved fairly."
          },
          {
            icon: <Globe className="w-6 h-6" />,
            title: "Global Access",
            description: "Breaking down barriers to international commerce and connecting buyers and sellers worldwide."
          },
          {
            icon: <Users className="w-6 h-6" />,
            title: "Community Driven",
            description: "Built by our community, for our community - your feedback shapes our future."
          }
        ]
      },
      
      story: {
        title: "Our Story",
        description: "Mnbarh was born from a simple observation: online marketplaces should be simpler and more trustworthy.",
        timeline: [
          {
            year: "2020",
            title: "The Beginning",
            description: "Started with a simple idea: make online shopping safer for everyone."
          },
          {
            year: "2021",
            title: "First Launch",
            description: "Launched our beta platform with 1,000 initial users and basic buying/selling features."
          },
          {
            year: "2022",
            title: "Growth & Innovation",
            description: "Introduced traveler shopping program and expanded to 10 countries with 50,000 users."
          },
          {
            year: "2023",
            title: "Platform Evolution",
            description: "Launched mobile app, advanced protection features, and reached 500,000 users globally."
          },
          {
            year: "2024",
            title: "Global Expansion",
            description: "Now serving millions of users across 50+ countries with comprehensive trust and safety features."
          }
        ]
      },
      
      values: {
        title: "Our Values",
        description: "The principles that guide everything we do",
        values: [
          {
            value: "Integrity",
            description: "We do what's right, even when no one is watching.",
            icon: <CheckCircle className="w-5 h-5" />
          },
          {
            value: "Innovation",
            description: "We constantly improve and evolve to serve our community better.",
            icon: <Lightbulb className="w-5 h-5" />
          },
          {
            value: "Inclusivity",
            description: "Everyone deserves access to global commerce opportunities.",
            icon: <Users className="w-5 h-5" />
          },
          {
            value: "Excellence",
            description: "We strive for exceptional quality in everything we deliver.",
            icon: <Award className="w-5 h-5" />
          }
        ]
      },
      
      impact: {
        title: "Our Impact",
        description: "Numbers that show our growth and community trust",
        stats: [
          {
            number: "5M+",
            label: "Active Users",
            description: "Trusted buyers and sellers worldwide"
          },
          {
            number: "50+",
            label: "Countries",
            description: "Global marketplace presence"
          },
          {
            number: "10M+",
            label: "Transactions",
            description: "Successfully completed trades"
          },
          {
            number: "99.8%",
            label: "Success Rate",
            description: "Satisfied customers globally"
          }
        ]
      },
      
      team: {
        title: "Meet Our Team",
        description: "The passionate people behind Mnbarh",
        departments: [
          {
            name: "Engineering",
            size: "50+ members",
            focus: "Building secure, scalable technology"
          },
          {
            name: "Trust & Safety",
            size: "25+ members", 
            focus: "Keeping our marketplace safe and fair"
          },
          {
            name: "Customer Support",
            size: "100+ members",
            focus: "24/7 help for our global community"
          },
          {
            name: "Operations",
            size: "30+ members",
            focus: "Ensuring smooth platform operations"
          }
        ]
      },
      
      future: {
        title: "Our Future",
        description: "Where we're headed next",
        vision: [
          {
            title: "AI-Powered Commerce",
            description: "Smart recommendations, fraud detection, and personalized experiences"
          },
          {
            title: "Blockchain Integration",
            description: "Enhanced security and transparency through blockchain technology"
          },
          {
            title: "Global Expansion",
            description: "Reaching every corner of the world with localized experiences"
          },
          {
            title: "Sustainability Focus",
            description: "Promoting eco-friendly shipping and sustainable business practices"
          }
        ]
      }
    },
    
    ar: {
      title: "عن منبره",
      subtitle: "ربط الناس من خلال التجارة الموثوقة",
      description: "بناء سوق العالم الأكثر ثقة",
      
      hero: {
        title: cmsHero?.title || "مرحباً بك في منبره",
        description: cmsHero?.description || "مهمتنا هي جعل الشراء والبيع والتسوق العالمي عبر الإنترنت بسيطاً وآمناً ومتاحاً للجميع.",
        tagline: "سوقك الموثوق"
      },
      
      mission: {
        title: "مهمتنا",
        description: "إنشاء سوق عالمي حيث تلتقي الثقة والشفافية والفرص معاً لتفيد الجميع.",
        pillars: [
          {
            icon: <Shield className="w-6 h-6" />,
            title: "الثقة أولاً",
            description: "كل معاملة محمية، كل مستخدم موثق، كل نزاع يحل بعدالة."
          },
          {
            icon: <Globe className="w-6 h-6" />,
            title: "الوصول العالمي",
            description: "كسر الحواجز أمام التجارة الدولية وربط المشترين والبائعين حول العالم."
          },
          {
            icon: <Users className="w-6 h-6" />,
            title: "مدفوع بالمجتمع",
            description: "مبني من قبل مجتمعنا، لمجتمعنا - ملاحظاتك تشكل مستقبلنا."
          }
        ]
      },
      
      story: {
        title: "قصتنا",
        description: "ولدت منبره من ملاحظة بسيطة: يجب أن تكون الأسواق عبر الإنترنت أبسط وأكثر ثقة.",
        timeline: [
          {
            year: "2020",
            title: "البداية",
            description: "بدأنا بفكرة بسيطة: جعل التسوق عبر الإنترنت أكثر أماناً للجميع."
          },
          {
            year: "2021",
            title: "الإطلاق الأول",
            description: "أطلقنا منصتنا التجريبية مع 1000 مستخدم أولي وميزات الشراء والبيع الأساسية."
          },
          {
            year: "2022",
            title: "النمو والابتكار",
            description: "قدمنا برنامج تسوق المسافرين وتوسعنا إلى 10 دول مع 50000 مستخدم."
          },
          {
            year: "2023",
            title: "تطور المنصة",
            description: "أطلقنا تطبيق الجوال وميزات الحماية المتقدمة ووصلنا إلى 500000 مستخدم حول العالم."
          },
          {
            year: "2024",
            title: "التوسع العالمي",
            description: "نخدم الآن ملايين المستخدمين عبر 50+ دولة مع ميزات شاملة للثقة والسلامة."
          }
        ]
      },
      
      values: {
        title: "قيمنا",
        description: "المبادئ التي توجه كل ما نفعل",
        values: [
          {
            value: "النزاهة",
            description: "نفعل ما هو صحيح، حتى عندما لا أحد يراقب.",
            icon: <CheckCircle className="w-5 h-5" />
          },
          {
            value: "الابتكار",
            description: "نحسن ونتطور باستمرار لخدمة مجتمعنا بشكل أفضل.",
            icon: <Lightbulb className="w-5 h-5" />
          },
          {
            value: "الشمولية",
            description: "الجميع يستحق الوصول إلى فرص التجارة العالمية.",
            icon: <Users className="w-5 h-5" />
          },
          {
            value: "التميز",
            description: "نسعى لجودة استثنائية في كل ما نقدمه.",
            icon: <Award className="w-5 h-5" />
          }
        ]
      },
      
      impact: {
        title: "تأثيرنا",
        description: "أرقام تظهر نمونا وثقة المجتمع",
        stats: [
          {
            number: "5 مليون+",
            label: "المستخدمون النشطون",
            description: "مشترين وبائعين موثوقين حول العالم"
          },
          {
            number: "50+",
            label: "الدول",
            description: "وجود سوق عالمي"
          },
          {
            number: "10 مليون+",
            label: "المعاملات",
            description: "صفقات مكتملة بنجاح"
          },
          {
            number: "99.8%",
            label: "معدل النجاح",
            description: "عملاء راضون حول العالم"
          }
        ]
      },
      
      team: {
        title: "التق بفريقنا",
        description: "الأشخاص المتحمسون وراء منبره",
        departments: [
          {
            name: "الهندسة",
            size: "50+ عضو",
            focus: "بناء تكنولوجيا آمنة وقابلة للتوسع"
          },
          {
            name: "الثقة والسلامة",
            size: "25+ عضو",
            focus: "الحفاظ على أمان سوقنا وعدالته"
          },
          {
            name: "دعم العملاء",
            size: "100+ عضو",
            focus: "مساعدة 24/7 لمجتمعنا العالمي"
          },
          {
            name: "العمليات",
            size: "30+ عضو",
            focus: "ضمان عمليات منصة سلسة"
          }
        ]
      },
      
      future: {
        title: "مستقبلنا",
        description: "إلى أين نتجه بعد ذلك",
        vision: [
          {
            title: "التجارة المدعومة بالذكاء الاصطناعي",
            description: "توصيات ذكية، كشف الاحتيال، وتجارب مخصصة"
          },
          {
            title: "تكامل البلوك تشين",
            description: "أمان وشفافية معززة عبر تقنية البلوك تشين"
          },
          {
            title: "التوسع العالمي",
            description: "الوصول إلى كل زاوية في العالم بتجارب محلية"
          },
          {
            title: "التركيز على الاستدامة",
            description: "تعزيز الشحن الصديق للبيئة وممارسات العمل المستدامة"
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
            <Heart className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4">{t.hero.title}</h2>
            <p className="text-xl mb-6 opacity-90 max-w-3xl mx-auto">{t.hero.description}</p>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
              <Star className="w-6 h-6" />
              <span className="text-lg font-semibold">{t.hero.tagline}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mission Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">{t.mission.title}</h3>
          <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl mx-auto">{t.mission.description}</p>
          <div className="grid lg:grid-cols-3 gap-6">
            {t.mission.pillars.map((pillar, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {pillar.icon}
                  </div>
                  <h4 className="font-semibold text-gray-900 text-lg mb-2">{pillar.title}</h4>
                  <p className="text-gray-600">{pillar.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Story Timeline */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">{t.story.title}</h3>
          <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl mx-auto">{t.story.description}</p>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-yellow-200"></div>
            <div className="space-y-8">
              {t.story.timeline.map((item, index) => (
                <div key={index} className="flex items-center gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold">
                    {item.year}
                  </div>
                  <div className="flex-1 bg-white p-6 rounded-lg border shadow-sm">
                    <h4 className="font-semibold text-gray-900 text-lg">{item.title}</h4>
                    <p className="text-gray-600 mt-2">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">{t.values.title}</h3>
          <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl mx-auto">{t.values.description}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.values.values.map((value, index) => (
              <Card key={index}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {value.icon}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{value.value}</h4>
                  <p className="text-sm text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Impact Stats */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">{t.impact.title}</h3>
          <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl mx-auto">{t.impact.description}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.impact.stats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-yellow-600 mb-2">{stat.number}</div>
                  <div className="font-semibold text-gray-900 mb-1">{stat.label}</div>
                  <p className="text-sm text-gray-600">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">{t.team.title}</h3>
          <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl mx-auto">{t.team.description}</p>
          <div className="grid md:grid-cols-2 gap-6">
            {t.team.departments.map((dept, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-gray-900 text-lg">{dept.name}</h4>
                    <Badge variant="outline">{dept.size}</Badge>
                  </div>
                  <p className="text-gray-600">{dept.focus}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Future Vision */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">{t.future.title}</h3>
          <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl mx-auto">{t.future.description}</p>
          <div className="grid md:grid-cols-2 gap-6">
            {t.future.vision.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">
            {selectedLanguage === 'en' ? 'Join Our Community' : 'انضم إلى مجتمعنا'}
          </h2>
          <p className="text-xl mb-6 opacity-90">
            {selectedLanguage === 'en' 
              ? 'Be part of the trusted marketplace that\'s changing global commerce' 
              : 'كن جزءاً من السوق الموثوق الذي يغير التجارة العالمية'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-yellow-700 hover:bg-gray-100">
              <Users className="w-4 h-4 mr-2" />
              {selectedLanguage === 'en' ? 'Get Started' : 'ابدأ الآن'}
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-yellow-700">
              <Mail className="w-4 h-4 mr-2" />
              {selectedLanguage === 'en' ? 'Contact Us' : 'تواصل معنا'}
            </Button>
          </div>
          
          {/* Social Links */}
          <div className="mt-8 flex justify-center gap-4">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Twitter className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Linkedin className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Instagram className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
