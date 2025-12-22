import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import TrustBadge from '../../components/trust/TrustBadge';
import RiskIndicator from '../../components/trust/RiskIndicator';
import type { TravelerRequest } from '../../services/traveler.service';

const RequestDetailsPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<TravelerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOfferForm, setShowOfferForm] = useState(false);

  useEffect(() => {
    loadRequestDetails();
  }, [requestId]);

  const loadRequestDetails = async () => {
    setLoading(true);
    try {
      // Mock data - in real app, this would call travelerApi.getRequest(requestId)
      const mockRequest: TravelerRequest = {
        id: requestId || '1',
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
        productDescription: 'Brand new iPhone 15 Pro Max 256GB, sealed box with original accessories. Never opened, purchased from Apple Store. Includes 1-year warranty.',
        category: 'Electronics',
        originCountry: 'USA',
        locationHint: 'New York, NY (Upper East Side)',
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
        productImages: [
          'https://images.unsplash.com/photo-1616348436168-b43c512b3768?w=400',
          'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400',
          'https://images.unsplash.com/photo-1616348436168-b43c512b3768?w=400'
        ],
        specialInstructions: 'Please handle with care. Keep the box sealed until delivery. Contact buyer for pickup location details.',
        insuranceRequired: true,
        maxDeliveryDays: 7,
        preferredCarrier: 'DHL or FedEx',
        customsDocumentation: 'Invoice required for customs'
      };

      setRequest(mockRequest);
    } catch (error) {
      console.error('Failed to load request details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOffer = () => {
    setShowOfferForm(true);
  };

  const handleBack = () => {
    navigate('/traveler/requests');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading request details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Request Not Found</h2>
            <p className="text-gray-600 mb-6">The requested delivery opportunity could not be found.</p>
            <button
              onClick={handleBack}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Requests
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <Link to="/traveler" className="hover:text-blue-600">Dashboard</Link>
            </li>
            <li className="before:content-['/'] before:mx-2">
              <Link to="/traveler/requests" className="hover:text-blue-600">Requests</Link>
            </li>
            <li className="before:content-['/'] before:mx-2">
              <span className="text-gray-900">{request.productName}</span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Product Info */}
          <div className="lg:col-span-2">
            {/* Product Images */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {request.productImages?.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${request.productName} ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ))}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {request.productName}
              </h1>

              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">{request.productDescription}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <span className="text-sm text-gray-600">Category:</span>
                    <p className="font-medium">{request.category}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Max Price:</span>
                    <p className="font-medium">${request.maxPrice}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Delivery Reward:</span>
                    <p className="font-medium text-green-600">${request.deliveryReward}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Urgency:</span>
                    <p className="font-medium capitalize">{request.urgency}</p>
                  </div>
                </div>

                {request.specialInstructions && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-yellow-800 mb-2">Special Instructions</h3>
                    <p className="text-yellow-700">{request.specialInstructions}</p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Delivery Requirements</h3>
                  <ul className="text-blue-700 space-y-1">
                    <li>• Insurance: {request.insuranceRequired ? 'Required' : 'Not required'}</li>
                    <li>• Max delivery time: {request.maxDeliveryDays} days</li>
                    <li>• Preferred carrier: {request.preferredCarrier}</li>
                    <li>• Customs documentation: {request.customsDocumentation}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Buyer Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Buyer Information</h2>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">
                    {request.buyer.fullName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900">{request.buyer.fullName}</h3>
                  <p className="text-sm text-gray-600">Verified Buyer</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-600">Trust Score:</span>
                  <TrustBadge score={request.buyerTrustScore} />
                </div>
                <div>
                  <span className="text-sm text-gray-600">Rating:</span>
                  <div className="flex items-center">
                    <span className="text-yellow-400">⭐</span>
                    <span className="ml-1 font-medium">{request.buyerRating}</span>
                    <span className="text-gray-500 text-sm ml-1">({request.buyerReviews} reviews)</span>
                  </div>
                </div>
              </div>

              <RiskIndicator level="low" message="This buyer has excellent trust metrics and positive transaction history" />
            </div>
          </div>

          {/* Right Column - Action Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Opportunity</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Reward:</span>
                  <span className="font-bold text-green-600">${request.deliveryReward}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Earnings:</span>
                  <span className="font-bold">${request.estimatedEarnings}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-bold">{request.distanceKm} km</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Match Score:</span>
                  <span className="font-bold text-blue-600">{request.matchScore}%</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Expires:</span>
                  <span className="font-bold">
                    {new Date(request.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <span className="text-green-600 text-lg mr-2">✓</span>
                  <span className="text-green-800 text-sm font-medium">
                    Great match for your travel plans
                  </span>
                </div>
              </div>

              <button
                onClick={handleSubmitOffer}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Submit Delivery Offer
              </button>

              <button
                onClick={handleBack}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 font-medium transition-colors mt-3"
              >
                Back to Requests
              </button>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Need help?</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Our team is here to assist you with any questions about this delivery request.
                </p>
                <Link
                  to="/help"
                  className="text-blue-600 text-sm hover:text-blue-700 font-medium"
                >
                  Contact Support →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RequestDetailsPage;