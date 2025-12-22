import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { legalService } from '../../services/legal.service';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = async () => {
    const oldLanguage = language;
    const newLanguage = language === 'AR' ? 'EN' : 'AR';
    
    setLanguage(newLanguage);
    
    try {
      await legalService.trackLanguageChange(oldLanguage, newLanguage);
    } catch (error) {
      console.warn('Failed to track language change:', error);
    }
  };

  return (
    <button
      onClick={toggleLanguage}
      className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1 border border-gray-600 rounded-md hover:border-gray-400"
    >
      {language === 'AR' ? 'English' : 'العربية'}
    </button>
  );
};

export default LanguageToggle;