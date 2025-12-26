'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  originalPrice?: number;
  currency: string;
  image: string;
  rating: number;
  reviewCount: number;
  category: string;
  isFeatured: boolean;
  discount?: number;
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Smartphone X Pro',
    nameAr: 'هاتف ذكي X Pro',
    price: 2999,
    originalPrice: 3499,
    currency: 'SAR',
    image: '/images/products/phone1.jpg',
    rating: 4.8,
    reviewCount: 124,
    category: 'electronics',
    isFeatured: true,
    discount: 15
  },
  {
    id: '2',
    name: 'Designer Handbag',
    nameAr: 'حقيبة يد مصمم',
    price: 899,
    originalPrice: 1299,
    currency: 'SAR',
    image: '/images/products/bag1.jpg',
    rating: 4.6,
    reviewCount: 89,
    category: 'fashion',
    isFeatured: true,
    discount: 30
  },
  {
    id: '3',
    name: 'Wireless Headphones',
    nameAr: 'سماعات لاسلكية',
    price: 499,
    originalPrice: 699,
    currency: 'SAR',
    image: '/images/products/headphones1.jpg',
    rating: 4.7,
    reviewCount: 203,
    category: 'electronics',
    isFeatured: true,
    discount: 29
  },
  {
    id: '4',
    name: 'Smart Watch Series',
    nameAr: 'ساعة ذكية',
    price: 799,
    originalPrice: 999,
    currency: 'SAR',
    image: '/images/products/watch1.jpg',
    rating: 4.9,
    reviewCount: 156,
    category: 'electronics',
    isFeatured: true,
    discount: 20
  },
  {
    id: '5',
    name: 'Running Shoes',
    nameAr: 'حذاء رياضي',
    price: 349,
    originalPrice: 499,
    currency: 'SAR',
    image: '/images/products/shoes1.jpg',
    rating: 4.5,
    reviewCount: 78,
    category: 'sports',
    isFeatured: true,
    discount: 30
  },
  {
    id: '6',
    name: 'Coffee Maker',
    nameAr: 'ماكينة قهوة',
    price: 599,
    originalPrice: 799,
    currency: 'SAR',
    image: '/images/products/coffee1.jpg',
    rating: 4.4,
    reviewCount: 92,
    category: 'home',
    isFeatured: true,
    discount: 25
  }
];

const FeaturedProductsSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visibleProducts, setVisibleProducts] = useState(4);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const updateVisibleProducts = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) {
        setVisibleProducts(1);
      } else if (window.innerWidth < 768) {
        setVisibleProducts(2);
      } else if (window.innerWidth < 1024) {
        setVisibleProducts(3);
      } else {
        setVisibleProducts(4);
      }
    }
  };

  useEffect(() => {
    updateVisibleProducts();
    window.addEventListener('resize', updateVisibleProducts);
    return () => window.removeEventListener('resize', updateVisibleProducts);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => 
        prev + 1 >= Math.ceil(mockProducts.length / visibleProducts) ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, visibleProducts]);

  const nextSlide = () => {
    setCurrentSlide((prev) => 
      prev + 1 >= Math.ceil(mockProducts.length / visibleProducts) ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => 
      prev - 1 < 0 ? Math.ceil(mockProducts.length / visibleProducts) - 1 : prev - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  const startIndex = currentSlide * visibleProducts;
  const endIndex = startIndex + visibleProducts;
  const currentProducts = mockProducts.slice(startIndex, endIndex);
  const totalSlides = Math.ceil(mockProducts.length / visibleProducts);

  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Featured Products
          </h2>
          <p className="text-gray-600 text-lg">
            اكتشف أفضل المنتجات المميزة
          </p>
        </div>

        {/* Slider Container */}
        <div 
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group"
              >
                {/* Product Image */}
                <div className="relative h-48 overflow-hidden rounded-t-xl">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/300x300/0071CE/FFFFFF?text=Product+Image';
                    }}
                  />
                  
                  {/* Discount Badge */}
                  {product.discount && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      {product.discount}% OFF
                    </div>
                  )}
                  
                  {/* Quick View Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <button className="bg-white text-blue-600 px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-semibold">
                      عرض سريع
                    </button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2 font-arabic">
                    {product.nameAr}
                  </p>
                  
                  {/* Price */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-bold text-blue-600">
                      {product.price.toLocaleString()} {product.currency}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        {product.originalPrice.toLocaleString()} {product.currency}
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      ({product.reviewCount})
                    </span>
                  </div>

                  {/* Add to Cart Button */}
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200">
                    أضف إلى السلة
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {totalSlides > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-white shadow-lg rounded-full hover:bg-gray-50 transition-colors duration-200"
                aria-label="Previous slide"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-white shadow-lg rounded-full hover:bg-gray-50 transition-colors duration-200"
                aria-label="Next slide"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Indicators */}
          {totalSlides > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              {[...Array(totalSlides)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-blue-600 w-8' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All Products Button */}
        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            عرض جميع المنتجات
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProductsSlider;