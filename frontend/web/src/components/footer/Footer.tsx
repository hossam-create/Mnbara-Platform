import React from 'react';
import FooterColumn from './FooterColumn';
import LanguageToggle from './LanguageToggle';
import CountrySelector from './CountrySelector';
import { useLanguage } from '../../context/LanguageContext';
import { legalService } from '../../services/legal.service';

const Footer: React.FC = () => {
  const { language, isRTL } = useLanguage();

  const handleFooterLinkClick = async (linkName: string, section: string) => {
    try {
      await legalService.trackFooterClick(linkName, section);
    } catch (error) {
      console.warn('Failed to track footer click:', error);
      // Don't block user navigation for tracking failures
    }
  };

  const footerContent = {
    buy: {
      title: language === 'AR' ? 'شراء' : 'Buy',
      links: [
        { label: language === 'AR' ? 'التسجيل' : 'Registration', path: '/register', icon: '📝' },
        { label: language === 'AR' ? 'كيفية الشراء' : 'How buying works', path: '/how-buying-works', icon: '🛒' },
        { label: language === 'AR' ? 'حماية المشتري' : 'Buyer protection', path: '/buyer-protection', icon: '🛡️' },
        { label: language === 'AR' ? 'ضمانات المشتري' : 'Buyer guarantees', path: '/buyer-guarantees', icon: '✅' },
        { label: language === 'AR' ? 'حل النزاعات' : 'Dispute resolution', path: '/dispute-resolution', icon: '⚖️' },
        { label: language === 'AR' ? 'الطلبات وقوائم الرغبات' : 'Requests & wishlists', path: '/requests-wishlists', icon: '📋' }
      ]
    },
    sell: {
      title: language === 'AR' ? 'بيع/سفر' : 'Sell/Travel',
      links: [
        { label: language === 'AR' ? 'كن مسافراً' : 'Become a traveler', path: '/become-traveler', icon: '✈️' },
        { label: language === 'AR' ? 'كيفية عمل التوصيل' : 'How traveler delivery works', path: '/traveler-delivery', icon: '📦' },
        { label: language === 'AR' ? 'ضمانات المسافر' : 'Traveler guarantees', path: '/traveler-guarantees', icon: '🔒' },
        { label: language === 'AR' ? 'عملية الثقة والتحقق' : 'Trust & verification process', path: '/trust-verification', icon: '🔍' },
        { label: language === 'AR' ? 'الأرباح والمسؤوليات' : 'Earnings & responsibilities', path: '/earnings-responsibilities', icon: '💰' }
      ]
    },
    platform: {
      title: language === 'AR' ? 'المنصة' : 'Platform',
      links: [
        { label: language === 'AR' ? 'الثقة والأمان' : 'Trust & Safety', path: '/trust-safety', icon: '🔐' },
        { label: language === 'AR' ? 'مركز الأمان' : 'Security center', path: '/security-center', icon: '🏢' },
        { label: language === 'AR' ? 'منع الاحتيال' : 'How we prevent fraud', path: '/fraud-prevention', icon: '🚫' },
        { label: language === 'AR' ? 'الشفافية والمشورة' : 'Transparency & AI advisory', path: '/transparency-ai', icon: '🤖' },
        { label: language === 'AR' ? 'نظرة عامة على السجلات' : 'Audit & logs overview', path: '/audit-logs', icon: '📊' }
      ]
    },
    company: {
      title: language === 'AR' ? 'الشركة' : 'Company',
      links: [
        { label: language === 'AR' ? 'عنّا' : 'About us', path: '/about', icon: '🏢' },
        { label: language === 'AR' ? 'كيف نعمل' : 'How we operate', path: '/how-we-operate', icon: '⚙️' },
        { label: language === 'AR' ? 'الحوكمة والامتثال' : 'Governance & compliance', path: '/governance', icon: '📋' },
        { label: language === 'AR' ? 'الوظائف' : 'Careers', path: '/careers', icon: '💼' },
        { label: language === 'AR' ? 'المركز الصحفي' : 'Press', path: '/press', icon: '📰' },
        { label: language === 'AR' ? 'المستثمرون' : 'Investors', path: '/investors', icon: '📈' },
        { label: language === 'AR' ? 'الشركاء' : 'Partners', path: '/partners', icon: '🤝' },
        { label: language === 'AR' ? 'المسوقين بالعمولة' : 'Affiliates', path: '/affiliates', icon: '📢' }
      ]
    },
    help: {
      title: language === 'AR' ? 'المساعدة' : 'Help & Contact',
      links: [
        { label: language === 'AR' ? 'مركز المساعدة' : 'Help Center', path: '/help-center', icon: '❓' },
        { label: language === 'AR' ? 'اتصل بالدعم' : 'Contact support', path: '/contact-support', icon: '📞' },
        { label: language === 'AR' ? 'المطالبات والنزاعات' : 'Disputes & claims', path: '/disputes-claims', icon: '⚖️' },
        { label: language === 'AR' ? 'مساعدة المشتري' : 'Buyer help', path: '/buyer-help', icon: '🛒' },
        { label: language === 'AR' ? 'مساعدة المسافر' : 'Traveler help', path: '/traveler-help', icon: '✈️' }
      ]
    }
  };

  const legalLinks = [
    { label: language === 'AR' ? 'اتفاقية المستخدم' : 'User Agreement', path: '/legal/user-agreement' },
    { label: language === 'AR' ? 'سياسة الخصوصية' : 'Privacy Policy', path: '/legal/privacy-policy' },
    { label: language === 'AR' ? 'سياسة الثقة والضمان' : 'Trust & Guarantee Policy', path: '/legal/trust-guarantee' },
    { label: language === 'AR' ? 'سياسة ملفات التعريف' : 'Cookies Policy', path: '/legal/cookies' }
  ];

  return (
    <footer className="bg-gray-900 text-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          <FooterColumn 
            title={footerContent.buy.title} 
            links={footerContent.buy.links}
            onLinkClick={handleFooterLinkClick}
          />
          <FooterColumn 
            title={footerContent.sell.title} 
            links={footerContent.sell.links}
            onLinkClick={handleFooterLinkClick}
          />
          <FooterColumn 
            title={footerContent.platform.title} 
            links={footerContent.platform.links}
            onLinkClick={handleFooterLinkClick}
          />
          <FooterColumn 
            title={footerContent.company.title} 
            links={footerContent.company.links}
            onLinkClick={handleFooterLinkClick}
          />
          <FooterColumn 
            title={footerContent.help.title} 
            links={footerContent.help.links}
            onLinkClick={handleFooterLinkClick}
          />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6 rtl:space-x-reverse">
              <CountrySelector />
              <LanguageToggle />
            </div>
            
            <div className="flex items-center space-x-6 rtl:space-x-reverse text-sm text-gray-400">
              <span>© {new Date().getFullYear()} MNBARH. {language === 'AR' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</span>
            </div>

            <div className="flex items-center space-x-6 rtl:space-x-reverse">
              {legalLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.path}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                  onClick={async (e) => {
                    e.preventDefault();
                    await handleFooterLinkClick(link.label, 'legal');
                    window.location.href = link.path;
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;