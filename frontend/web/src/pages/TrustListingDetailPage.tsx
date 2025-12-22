

import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import TrustExplanationPanel from '../components/buyer/TrustExplanationPanel';
import AdvisoryPanel from '../components/buyer/AdvisoryPanel';
import RiskIndicator from '../components/buyer/RiskIndicator';
import buyerService, { type BuyerListing } from '../services/buyer.service';
import type { Category, User } from '../types';

const buildFallbackListing = (): BuyerListing => {
  const { trustScore, riskAssessment, recommendations } = buyerService.getMockTrustData('mock-listing');

  const fallbackCategory: Category = {
    id: 'electronics',
    name: 'Electronics',
    icon: '📱',
    color: '#1f2937',
    subcategories: [],
  };

  const fallbackSeller: User = {
    id: 'seller-1',
    email: 'seller@example.com',
    fullName: 'Apple Enthusiast',
    avatarUrl: '/api/placeholder/64/64',
    role: 'seller',
    kycVerified: true,
    rating: 4.9,
    totalReviews: 234,
    createdAt: new Date('2020-01-01').toISOString(),
    phone: '+1-202-555-0123',
  };

  return {
    id: 'mock-listing-1',
    name: 'iPhone 13 Pro Max - 256GB - Unlocked - Excellent Condition',
    description:
      'This iPhone 13 Pro Max is in excellent condition with minimal signs of use. Includes original box and accessories.',
    images: ['/api/placeholder/600/600', '/api/placeholder/600/601'],
    price: 799.99,
    currency: 'USD',
    category: fallbackCategory,
    subcategory: undefined,
    condition: 'used',
    listingType: 'buy_now',
    seller: fallbackSeller,
    originCountry: 'USA',
    brand: 'Apple',
    tags: ['iphone', 'apple', 'smartphone'],
    stock: 1,
    rating: 4.9,
    totalReviews: 234,
    views: 1200,
    createdAt: new Date('2024-01-05').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString(),
    trustScore,
    riskAssessment,
    recommendations,
    sellerStats: {
      totalSales: 287,
      responseRate: 95,
      avgResponseTime: '2 hours',
      disputeRate: 2,
    },
  };
};

const TrustListingDetailPage: React.FC = () => {
  const fallbackListing = useMemo(buildFallbackListing, []);
  const [listing, setListing] = useState<BuyerListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadListing = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await buyerService.getProductWithTrust('mock-listing-1');
        setListing(result);
      } catch (loadError) {
        console.error('Failed to load trust listing', loadError);
        setError('Unable to load listing details right now.');
        setListing(fallbackListing);
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [fallbackListing]);

  const activeListing = listing ?? fallbackListing;
  const trustData = activeListing.trustScore ?? fallbackListing.trustScore;
  const riskAssessment = activeListing.riskAssessment ?? fallbackListing.riskAssessment;
  const recommendations = activeListing.recommendations ?? fallbackListing.recommendations;

  const summary = useMemo(() => {
    if (!activeListing) return {};
    return {
      title: activeListing.name,
      price: `$${activeListing.price.toFixed(2)}`,
      condition: activeListing.condition,
      seller: activeListing.seller,
    };
  }, [activeListing]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-5xl mx-auto py-24 px-4">
          <p className="text-lg font-semibold text-gray-600">Loading trust details…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto py-20 px-4 space-y-10">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{summary.title}</h1>
          <p className="text-2xl font-semibold text-pink-600">{summary.price}</p>
          <p className="text-sm text-gray-500 mt-2">Condition: {summary.condition}</p>
          <p className="text-sm text-gray-500">Seller: {summary.seller?.fullName}</p>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <TrustExplanationPanel
              overallScore={trustData.overall}
              breakdown={trustData.breakdown}
              comparison={{
                categoryAverage: Math.max(0, trustData.overall - 5),
                platformAverage: 80,
              }}
            />
            <RiskIndicator level={riskAssessment.level} score={riskAssessment.score} />
          </div>
          <div className="space-y-6">
            <AdvisoryPanel recommendations={recommendations} />
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Specifications</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {[
                  { name: 'Storage', value: '256GB' },
                  { name: 'Color', value: 'Sierra Blue' },
                  { name: 'Network', value: 'Unlocked' },
                  { name: 'Battery Health', value: '95%' },
                  { name: 'Screen Size', value: '6.7"' },
                ].map((spec) => (
                  <li key={spec.name}>
                    <span className="font-semibold text-gray-800">{spec.name}:</span> {spec.value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {error && (
          <section className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-md">
            {error}
          </section>
        )}
      </main>
    </div>
  );
};

export default TrustListingDetailPage;