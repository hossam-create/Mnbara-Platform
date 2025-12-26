'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  link: string;
  buttonText: string;
  theme: 'light' | 'dark';
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'اكتشف عالم التسوق',
    subtitle: 'أكثر من مليون منتج',
    description: 'من الإلكترونيات إلى الموضة، كل ما تحتاجه في مكان واحد',
    image: '/images/slider/slide1.jpg',
    link: '/products',
    buttonText: 'تسوق الآن',
    theme: 'light'
  },
  {
    id: '2',
    title: 'عروض خاصة محدودة',
    subtitle: 'خصومات تصل إلى 70%',
    description: 'استفد من العروض الحصرية على أفضل المنتجات',
    image: '/images/slider/slide2.jpg',
    link: '/deals',
    buttonText: 'شاهد العروض',
    theme: 'dark'
  },
  {
    id: '3',
    title: 'منتجات جديدة',
    subtitle: 'أحدث الموديلات',
    description: 'كن أول من يحصل على أحدث المنتجات في السوق',
    image: '/images/slider/slide3.jpg',
    link: '/new-arrivals',
    buttonText: 'استكشاف الجديد',
    theme: 'light'
  },
  {
    id: '4',
    title: 'التوصيات الشخصية',
    subtitle: 'مخصصة لك فقط',
    description: 'منتجات مختارة بناءً على اهتماماتك وتصفحك',
    image: '/images/slider/slide4.jpg',
    link: '/recommendations',
    buttonText: 'اكتشف التوصيات',
    theme: 'dark'
  }
];

const MainSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  return (
    <div 
      className="relative w-full h-[500px] overflow-hidden rounded-2xl shadow-xl"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slides */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <div className="w-full h-full bg-gradient-to-r from-black/50 to-transparent">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/1200x500/0071CE/FFFFFF?text=MNBARH+Slider';
                  }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-center h-full">
              <div className="container mx-auto px-6">
                <div className="max-w-2xl">
                  <div className={`space-y-4 ${
                    slide.theme === 'light' ? 'text-white' : 'text-gray-900'
                  }`}>
                    <h1 className="text-5xl font-bold leading-tight">
                      {slide.title}
                    </h1>
                    <h2 className="text-2xl font-semibold text-blue-400">
                      {slide.subtitle}
                    </h2>
                    <p className="text-lg opacity-90">
                      {slide.description}
                    </p>
                    <div className="pt-6">
                      <Link
                        href={slide.link}
                        className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        {slide.buttonText}
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors duration-200"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors duration-200"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-blue-500 w-8' 
                : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 z-20">
        <div
          className="h-full bg-blue-500 transition-all duration-5000 ease-linear"
          style={{
            width: isAutoPlaying ? '100%' : '0%',
            transition: isAutoPlaying ? 'width 5s linear' : 'none'
          }}
        />
      </div>
    </div>
  );
};

export default MainSlider;