import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function ProductPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Product Details</h1>
        <div className="text-gray-600">Product details coming soon...</div>
      </main>
      <Footer />
    </div>
  );
}
