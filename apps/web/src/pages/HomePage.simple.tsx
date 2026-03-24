import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import FeaturedProducts from '../components/home/FeaturedProducts';
import CategoriesGrid from '../components/home/CategoriesGrid';
import TrendingDeals from '../components/home/TrendingDeals';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <FeaturedProducts />
        <CategoriesGrid />
        <TrendingDeals />
      </main>
      <Footer />
    </div>
  );
}
