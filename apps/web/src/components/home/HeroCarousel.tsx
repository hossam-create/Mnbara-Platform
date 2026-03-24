import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Slide interface for CMS data
export interface SlideData {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  bgColor: string;
  textColor: string;
}

export interface HeroCarouselConfig {
  autoplay?: boolean;
  interval?: number;
  showDots?: boolean;
  showArrows?: boolean;
}

interface HeroCarouselProps {
  slides?: SlideData[];
  config?: HeroCarouselConfig;
}

// Default slides (fallback if no CMS data)
const DEFAULT_SLIDES: SlideData[] = [
  {
    title: 'homepage.hero.slide1.title',
    subtitle: 'homepage.hero.slide1.subtitle',
    ctaText: 'homepage.hero.slide1.cta',
    ctaLink: '/search',
    bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: 'white',
  },
  {
    title: 'homepage.hero.slide2.title',
    subtitle: 'homepage.hero.slide2.subtitle',
    ctaText: 'homepage.hero.slide2.cta',
    ctaLink: '#paste-link',
    bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    textColor: 'white',
  },
  {
    title: 'homepage.hero.slide3.title',
    subtitle: 'homepage.hero.slide3.subtitle',
    ctaText: 'homepage.hero.slide3.cta',
    ctaLink: '#traveler',
    bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    textColor: 'white',
  },
  {
    title: 'homepage.hero.slide4.title',
    subtitle: 'homepage.hero.slide4.subtitle',
    ctaText: 'homepage.hero.slide4.cta',
    ctaLink: '/deals',
    bgColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    textColor: 'white',
  },
];

export default function HeroCarousel({ slides, config }: HeroCarouselProps) {
  const { t } = useTranslation();
  const displaySlides = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;
  const autoplayInterval = config?.interval || 5000;
  const showDots = config?.showDots !== false;
  const showArrows = config?.showArrows !== false;
  const autoplay = config?.autoplay !== false;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Autoplay
  useEffect(() => {
    if (!autoplay || isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displaySlides.length);
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [isPaused, autoplay, autoplayInterval, displaySlides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % displaySlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + displaySlides.length) % displaySlides.length);
  };

  return (
    <div
      className="relative w-full h-[400px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      dir="ltr"
    >
      {/* Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: displaySlides[currentSlide].bgColor }}
        >
          <div className="max-w-[1400px] w-full mx-auto px-4 py-16 text-center">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ color: displaySlides[currentSlide].textColor }}
            >
              {t(displaySlides[currentSlide].title)}
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl mb-8 opacity-90"
              style={{ color: displaySlides[currentSlide].textColor }}
            >
              {t(displaySlides[currentSlide].subtitle)}
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Link
                to={displaySlides[currentSlide].ctaLink}
                className="inline-block px-8 py-3 bg-white text-gray-900 font-semibold rounded-full hover:shadow-lg transition-all transform hover:scale-105"
              >
                {t(displaySlides[currentSlide].ctaText)}
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {showArrows && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {showDots && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {displaySlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
