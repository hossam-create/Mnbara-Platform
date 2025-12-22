import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface AgreementCheckboxProps {
  agreementType: 'user' | 'privacy' | 'trust' | 'dispute' | 'traveler' | 'buyer' | 'cookies' | 'transparency';
  onAgreementChange: (agreed: boolean, timestamp: Date) => void;
  required?: boolean;
  disabled?: boolean;
}

const agreementLabels = {
  user: {
    EN: 'I agree to the User Agreement',
    AR: 'أوافق على اتفاقية المستخدم'
  },
  privacy: {
    EN: 'I agree to the Privacy Policy',
    AR: 'أوافق على سياسة الخصوصية'
  },
  trust: {
    EN: 'I understand the Trust & Guarantee Policy',
    AR: 'أفهم سياسة الثقة والضمان'
  },
  dispute: {
    EN: 'I accept the Dispute Resolution Policy',
    AR: 'أقبل سياسة حل النزاعات'
  },
  traveler: {
    EN: 'I agree to the Traveler Agreement',
    AR: 'أوافق على اتفاقية المسافر'
  },
  buyer: {
    EN: 'I accept Buyer Responsibilities',
    AR: 'أقبل مسؤوليات المشتري'
  },
  cookies: {
    EN: 'I consent to Cookies Policy',
    AR: 'أوافق على سياسة ملفات التعريف'
  },
  transparency: {
    EN: 'I understand AI Transparency Policy',
    AR: 'أفهم سياسة الشفافية للذكاء الاصطناعي'
  }
};

const AgreementCheckbox: React.FC<AgreementCheckboxProps> = ({
  agreementType,
  onAgreementChange,
  required = true,
  disabled = false
}) => {
  const { language } = useLanguage();
  const [isAgreed, setIsAgreed] = useState(false);

  const handleAgreementChange = (checked: boolean) => {
    setIsAgreed(checked);
    onAgreementChange(checked, new Date());
  };

  return (
    <div className="flex items-start space-x-3 rtl:space-x-reverse">
      <input
        type="checkbox"
        id={`agreement-${agreementType}`}
        checked={isAgreed}
        onChange={(e) => handleAgreementChange(e.target.checked)}
        required={required}
        disabled={disabled}
        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      
      <label
        htmlFor={`agreement-${agreementType}`}
        className="text-sm text-gray-700 cursor-pointer"
      >
        {agreementLabels[agreementType][language]}
        {required && (
          <span className="text-red-500 ml-1 rtl:mr-1">*</span>
        )}
      </label>
    </div>
  );
};

export default AgreementCheckbox;