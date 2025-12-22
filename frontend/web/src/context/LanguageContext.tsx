import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'EN' | 'AR';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Mock Translations
const translations: Record<Language, Record<string, string>> = {
  EN: {
    'nav.home': 'Home',
    'nav.shop': 'Shop',
    'nav.signin': 'Sign In',
    'hero.title.1': 'Shop Global,',
    'hero.title.2': 'Ship Personal',
    'hero.desc': 'Connect with travelers bringing products from around the world.',
    'common.currency': 'USD'
  },
  AR: {
    'nav.home': 'الرئيسية',
    'nav.shop': 'تسوق',
    'nav.signin': 'تجيل الدخول',
    'hero.title.1': 'تسوق عالمياً،',
    'hero.title.2': 'اشحن شخصياً',
    'hero.desc': 'تواصل مع مسافرين يجلبون لك منتجات من جميع أنحاء العالم.',
    'common.currency': 'ر.س'
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('EN');

  useEffect(() => {
    // Handle RTL
    document.documentElement.dir = language === 'AR' ? 'rtl' : 'ltr';
    document.documentElement.lang = language === 'AR' ? 'ar' : 'en';
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL: language === 'AR' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
