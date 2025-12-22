// ============================================
// 📦 Browse Requests - Find Delivery Opportunities
// ============================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import SearchFilters from '../../components/traveler/SearchFilters';
import RequestCard from '../../components/traveler/RequestCard';
import OfferSubmissionForm from '../../components/traveler/OfferSubmissionForm';
import TrustReadinessChecklist from '../../components/traveler/TrustReadinessChecklist';
import type { TravelerRequest, OfferFormData } from '../../services/traveler.service';

const BrowseRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<TravelerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TravelerRequest | null>(null);
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [filters, setFilters] = useState({
    originCountry: '',
    destinationCountry: '',
    minReward: 0,
    maxDistance: 1000,
    status: 'open' as const,
  });

  useEffect(() => {
    loadRequests();
  }, [filters]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      // Mock data - in real app, this would call travelerApi.getRequests()
      const mockRequests: TravelerRequest[] = [
        {
          id: '1',
          buyer: {
            id: 'buyer-1',
            email: 'buyer1@example.com',
            fullName: 'Ahmed Hassan',
            role: 'buyer',
            kycVerified: true,
            rating: 4.8,
            totalReviews: 47,
            createdAt: '2023-01-15',
          },
          productName: 'iPhone 15 Pro Max',
          productDescription: 'Brand new iPhone 15 Pro Max 256GB, sealed box',
          category: 'Electronics',
          originCountry: 'USA',
          locationHint: 'New York, NY',
          maxPrice: 1200,
          deliveryReward: 150,
          urgency: 'medium',
          status: 'open',
          matchedTrips: [],
          createdAt: '2024-12-20T10:00:00Z',
          expiresAt: '2024-12-27T10:00:00Z',
          estimatedEarnings: 150,
          distanceKm: 320,
          matchScore: 85,
          buyerRating: 4.8,
          buyerReviews: 47,
          buyerTrustScore: 92,
        },
        {
          id: '2',
          buyer: {
            id: 'buyer-2',
            email: 'buyer2@example.com',
            fullName: 'Sarah Johnson',
            role: 'buyer',
            kycVerified: true,
            rating: 4.9,
            totalReviews: 128,
            createdAt: '2022-08-10',
          },
          productName: 'Designer Handbag',
          productDescription: 'Louis Vuitton Neverfull MM, excellent condition',
          category: 'Fashion',
          originCountry: 'France',
          locationHint: 'Paris',
          maxPrice: 1800,
          deliveryReward: 200,
          urgency: 'low',
          status: 'open',
          matchedTrips: [],
          createdAt: '2024-12-19T14:30:00Z',
          expiresAt: '2024-12-26T14:30:00Z',
          estimatedEarnings: 200,
          distanceKm: 890,
          matchScore: 78,
          buyerRating: 4.9,
          buyerReviews: 128,
          buyerTrustScore: 95,
        },
        {
          id: '3',
          buyer: {
            id: 'buyer-3',
            email: 'buyer3@example.com',
            fullName: 'Mohammed Ali',
            role: 'buyer',
            kycVerified: false,
            rating: 3.2,
            totalReviews: 5,
            createdAt: '2024-10-05',
          },
          productName: 'Gaming Laptop',
          productDescription: 'ASUS ROG Strix G16, RTX 4060, 16GB RAM',
          category: 'Electronics',
          originCountry: 'UAE',
          locationHint: 'Dubai',
          maxPrice: 1400,
          deliveryReward: 120,
          urgency: 'high',
          status: 'open',
          matchedTrips: [],
          createdAt: '2024-12-20T08:15:00Z',
          expiresAt: '2024-12-22T08:15:00Z',
          estimatedEarnings: 120,
          distanceKm: 450,
          matchScore: 45,
          buyerRating: 3.2,
          buyerReviews: 5,
          buyerTrustScore: 65,
        },
      ];

      // Filter mock data based on actual filters
      const filteredRequests = mockRequests.filter(request => {
        if (filters.originCountry && request.originCountry !== filters.originCountry) return false;
        if (filters.destinationCountry) return true; // Would filter by traveler's destination
        if (filters.minReward > 0 && request.deliveryReward < filters.minReward) return false;
        return true;
      });

      setRequests(filteredRequests);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSubmitOffer = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (request) {
      setSelectedRequest(request);
      setShowOfferForm(true);
    }
  };

  const handleOfferFormSubmit = async (offerData: OfferFormData) => {
    if (!selectedRequest) return;
    
    setSubmittingOffer(true);
    try {
      // Mock API call - in real app, this would call travelerApi.submitOffer()
      console.log('Submitting offer for request:', selectedRequest.id, offerData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message and close form
      alert('Offer submitted successfully! The buyer will review your offer.');
      setShowOfferForm(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to submit offer:', error);
      alert('Failed to submit offer. Please try again.');
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleOfferFormCancel = () => {
    setShowOfferForm(false);
    setSelectedRequest(null);
    setSubmittingOffer(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Browse Delivery Requests</h1>
              <p className="text-gray-600 mt-2">
                Find opportunities to earn while traveling. All requests are verified and include trust scores.
              </p>
            </div>
            
            <button
              onClick={() => setShowChecklist(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="text-lg">🛡️</span>
              Trust Readiness
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <SearchFilters
              filters={filters}
              onChange={handleFilterChange}
              loading={loading}
            />
            
            {/* Trust Score Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your Trust Score</h3>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">87%</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Your trust score helps buyers feel confident in your delivery services.
                </p>
                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                  View breakdown
                </button>
              </div>
            </div>
          </div>

          {/* Requests List */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-gray-600">
                  {loading ? 'Loading...' : `${requests.length} requests found`}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <select className="border border-gray-300 rounded px-3 py-2 text-sm">
                  <option>Sort by: Best Match</option>
                  <option>Highest Reward</option>
                  <option>Urgency</option>
                  <option>Newest</option>
                </select>
                
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button className="p-2 text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && requests.length === 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or check back later for new delivery opportunities.
                </p>
                <button
                  onClick={() => setFilters({
                    originCountry: '',
                    destinationCountry: '',
                    minReward: 0,
                    maxDistance: 1000,
                    status: 'open',
                  })}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Requests Grid */}
            {!loading && requests.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {requests.map(request => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onOfferSubmit={handleSubmitOffer}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Offer Submission Modal */}
      {showOfferForm && selectedRequest && (
        <OfferSubmissionForm
          request={selectedRequest}
          onSubmit={handleOfferFormSubmit}
          onCancel={handleOfferFormCancel}
          isLoading={submittingOffer}
        />
      )}

      {/* Trust Readiness Modal */}
      {showChecklist && (
        <TrustReadinessChecklist
          onClose={() => setShowChecklist(false)}
          onComplete={() => {
            setShowChecklist(false);
            // Refresh requests or show success message
          }}
        />
      )}
    </div>
  );
};

export default BrowseRequestsPage;