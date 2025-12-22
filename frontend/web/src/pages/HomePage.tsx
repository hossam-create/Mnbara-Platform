import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/footer/Footer';
import SearchBar from '../components/search/SearchBar';
import CategoryGrid from '../components/categories/CategoryGrid';
import FeaturedListings from '../components/listings/FeaturedListings';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Find exactly what you're looking for
          </h1>

          <div className="max-w-2xl mx-auto px-4 sm:px-0">
            <SearchBar />
          </div>

          <p className="text-sm text-gray-600 mt-3 sm:mt-4 text-center">
            Search from millions of items worldwide
          </p>
        </div>

        <div className="mb-8 sm:mb-12 lg:mb-16">
          <CategoryGrid />
        </div>

        <FeaturedListings />
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;
