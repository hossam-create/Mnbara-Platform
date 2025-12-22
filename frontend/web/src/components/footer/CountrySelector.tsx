import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { legalService } from '../../services/legal.service';

const countries = [
  { code: 'US', name: 'United States', nameAr: 'الولايات المتحدة' },
  { code: 'SA', name: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية' },
  { code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة' },
  { code: 'KW', name: 'Kuwait', nameAr: 'الكويت' },
  { code: 'QA', name: 'Qatar', nameAr: 'قطر' },
  { code: 'BH', name: 'Bahrain', nameAr: 'البحرين' },
  { code: 'OM', name: 'Oman', nameAr: 'عمان' },
  { code: 'EG', name: 'Egypt', nameAr: 'مصر' },
  { code: 'JO', name: 'Jordan', nameAr: 'الأردن' },
  { code: 'LB', name: 'Lebanon', nameAr: 'لبنان' }
];

const CountrySelector: React.FC = () => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);

  const handleCountrySelect = async (country: typeof countries[0]) => {
    const oldCountry = selectedCountry;
    setSelectedCountry(country);
    setIsOpen(false);
    
    try {
      await legalService.logAuditEvent('COUNTRY_CHANGE', {
        old_country: oldCountry.code,
        new_country: country.code,
        old_country_name: language === 'AR' ? oldCountry.nameAr : oldCountry.name,
        new_country_name: language === 'AR' ? country.nameAr : country.name
      });
    } catch (error) {
      console.warn('Failed to track country change:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1 border border-gray-600 rounded-md hover:border-gray-400"
      >
        <span className="fi fi-${selectedCountry.code.toLowerCase()}"></span>
        <span>{language === 'AR' ? selectedCountry.nameAr : selectedCountry.name}</span>
        <span>▼</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-48 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-50">
          <div className="py-1">
            {countries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleCountrySelect(country)}
                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 w-full text-left rtl:text-right"
              >
                <span className="fi fi-${country.code.toLowerCase()}"></span>
                <span>{language === 'AR' ? country.nameAr : country.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelector;