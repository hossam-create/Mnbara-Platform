import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface ScrollGuardProps {
  onScrollComplete: () => void;
  children: React.ReactNode;
  minScrollPercentage?: number;
}

const ScrollGuard: React.FC<ScrollGuardProps> = ({
  onScrollComplete,
  children,
  minScrollPercentage = 95
}) => {
  const { language } = useLanguage();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const checkScrollCompletion = () => {
    if (!contentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const percentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
    setScrollPercentage(percentage);

    if (percentage >= minScrollPercentage && !hasScrolled) {
      setHasScrolled(true);
      onScrollComplete();
    }
  };

  useEffect(() => {
    const element = contentRef.current;
    if (element) {
      element.addEventListener('scroll', checkScrollCompletion);
      return () => element.removeEventListener('scroll', checkScrollCompletion);
    }
  }, [hasScrolled]);

  return (
    <div className="relative">
      <div
        ref={contentRef}
        className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4"
      >
        {children}
      </div>
      
      {!hasScrolled && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white to-transparent h-20 flex items-center justify-center">
          <div className="text-center text-sm text-gray-600 bg-white px-4 py-2 rounded-lg shadow-md">
            {language === 'AR' 
              ? `يرجى التمرير للأسفل لقراءة الاتفاقية بالكامل (${Math.round(scrollPercentage)}%)`
              : `Please scroll to read the full agreement (${Math.round(scrollPercentage)}%)`
            }
          </div>
        </div>
      )}
      
      {hasScrolled && (
        <div className="mt-4 text-center">
          <div className="text-green-600 text-sm">
            {language === 'AR' 
              ? '✓ لقد قرأت الاتفاقية بالكامل'
              : '✓ You have read the full agreement'
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrollGuard;