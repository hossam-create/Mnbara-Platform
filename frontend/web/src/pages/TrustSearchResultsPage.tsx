import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import TrustListingCard from '../components/buyer/TrustListingCard';
import TrustExplanationPanel from '../components/buyer/TrustExplanationPanel';
import AdvisoryPanel from '../components/buyer/AdvisoryPanel';
import RiskIndicator from '../components/buyer/RiskIndicator';

type RiskLevel = 'low' | 'medium' | 'high' | 'very_high';

interface TrustScore {
  overall: number;
  seller: number;
  product: number;
  delivery: number;
  breakdown: {
    sellerRating: number;
    responseTime: number;
    disputeRate: number;
    verificationLevel: number;
  };
}

interface TrustListing {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  condition: string;
  seller: string;
  rating: number;
  reviews: number;
  shipping: string;
  timeLeft: string;
  trustScore: TrustScore;
  riskAssessment: {
    level: RiskLevel;
    score: number;
  };
  verifiedSeller: boolean;
}

interface SearchFilters {
  query: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string[];
  minTrustScore?: number;
  maxRiskLevel?: RiskLevel;
  verifiedSellerOnly?: boolean;
  sortBy: 'relevance' | 'price_low' | 'price_high' | 'trust_score' | 'newest';
}

const TrustSearchResultsPage: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: 'iphone',
    sortBy: 'relevance',
    minTrustScore: 70,
    maxRiskLevel: 'medium',
  });
  
  const [results, setResults] = useState<TrustListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<TrustListing | null>(null);

  useEffect(() => {
    loadResults();
  }, [filters]);

  const loadResults = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API
      // const searchResults = await buyerService.searchProducts(filters.query, filters);
      
      // Mock data for demonstration
      const mockResults = [
        {
          id: '1',
          title: 'iPhone 13 Pro Max - 256GB - Unlocked - Excellent Condition',
          price: 799.99,
          originalPrice: 1099.99,
          image: '/api/placeholder/300/300',
          condition: 'Excellent',
          seller: 'apple_enthusiast',
          rating: 4.9,
          reviews: 234,
          shipping: 'Free shipping',
          timeLeft: '4h 15m',
          trustScore: {
            overall: 87,
            seller: 92,
            product: 85,
            delivery: 78,
            breakdown: {
              sellerRating: 95,
              responseTime: 88,
              disputeRate: 92,
              verificationLevel: 100,
            },
          },
          riskAssessment: {
            level: 'low' as const,
            score: 12,
          },
          verifiedSeller: true,
        },
        {
          id: '2',
          title: 'iPhone 12 - 128GB - Good Condition - Unlocked',
          price: 499.99,
          originalPrice: 699.99,
          image: '/api/placeholder/300/300',
          condition: 'Good',
          seller: 'tech_deals_123',
          rating: 4.2,
          reviews: 89,
          shipping: '$5.99 shipping',
          timeLeft: '1d 2h',
          trustScore: {
            overall: 72,
            seller: 68,
            product: 75,
            delivery: 65,
            breakdown: {
              sellerRating: 82,
              responseTime: 65,
              disputeRate: 78,
              verificationLevel: 90,
            },
          },
          riskAssessment: {
            level: 'medium' as const,
            score: 38,
          },
          verifiedSeller: false,
        },
        {
          id: '3',
          title: 'iPhone 11 Pro - 64GB - Fair Condition - Carrier Locked',
          price: 299.99,
          image: '/api/placeholder/300/300',
          condition: 'Fair',
          seller: 'budget_phones',
          rating: 3.8,
          reviews: 45,
          shipping: '$8.99 shipping',
          timeLeft: '2d 5h',
          trustScore: {
            overall: 58,
            seller: 52,
            product: 62,
            delivery: 48,
            breakdown: {
              sellerRating: 65,
              responseTime: 52,
              disputeRate: 45,
              verificationLevel: 70,
            },
          },
          riskAssessment: {
            level: 'high' as const,
            score: 62,
          },
          verifiedSeller: false,
        },
      ];
      
      setResults(mockResults);
    } catch (error) {
      console.error('Failed to load search results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleTrustFilterChange = (minScore: number) => {
    setFilters(prev => ({ ...prev, minTrustScore: minScore }));
  };

  const handleRiskFilterChange = (maxLevel: RiskLevel) => {
    setFilters(prev => ({ ...prev, maxRiskLevel: maxLevel }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-80 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Search results for "{filters.query}"
          </h1>
          <p className="text-gray-600">
            {results.length} results found • Filtered by trust score ≥ {filters.minTrustScore}% 
            and risk level ≤ {filters.maxRiskLevel}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Trust Score Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Trust Score</h3>
              <div className="space-y-2">
                {[90, 70, 50, 0].map((score) => (
                  <label key={score} className="flex items-center">
                    <input
                      type="radio"
                      name="trustScore"
                      checked={filters.minTrustScore === score}
                      onChange={() => handleTrustFilterChange(score)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {score === 0 ? 'Any score' : `≥ ${score}%`}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Risk Level Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Risk Level</h3>
              <div className="space-y-2">
                {(['low', 'medium', 'high', 'very_high'] as RiskLevel[]).map((level) => (
                  <label key={level} className="flex items-center">
                    <input
                      type="radio"
                      name="riskLevel"
                      checked={filters.maxRiskLevel === level}
                      onChange={() => handleRiskFilterChange(level)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      ≤ <RiskIndicator level={level} score={0} showLabel={true} size="sm" />
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Trust Explanation */}
            <TrustExplanationPanel
              overallScore={85}
              breakdown={{
                sellerRating: 92,
                responseTime: 78,
                disputeRate: 88,
                verificationLevel: 95,
              }}
              comparison={{
                categoryAverage: 72,
                platformAverage: 68,
              }}
            />
          </aside>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            {/* Sort and Results Count */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-gray-600">
                Showing {results.length} of {results.length} results
              </span>
              
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value as SearchFilters['sortBy'])}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="trust_score">Trust Score</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((listing) => (
                <TrustListingCard
                  key={listing.id}
                  {...listing}
                  onClick={() => setSelectedListing(listing)}
                />
              ))}
            </div>

            {/* No Results */}
            {results.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Advisory Panel Modal */}
        {selectedListing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Advisory Recommendations</h3>
                  <button
                    onClick={() => setSelectedListing(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <AdvisoryPanel
                  recommendations={[
                    {
                      type: 'trust',
                      priority: 'high',
                      title: 'Highly Trusted Seller',
                      description: 'This seller has excellent ratings and verification status.',
                      icon: 'shield-check',
                    },
                    {
                      type: 'safety',
                      priority: 'medium',
                      title: 'Consider Escrow Payment',
                      description: 'Use escrow for added purchase protection on high-value items.',
                      action: 'Learn about escrow',
                      icon: 'lock',
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TrustSearchResultsPage;