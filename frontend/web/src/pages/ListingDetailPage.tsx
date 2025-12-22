import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { productApi } from '../services/api';
import type { Product } from '../types';
import AdvisoryPanel from '../components/buyer/AdvisoryPanel';
import BuyerActionCTAs from '../components/buyer/BuyerActionCTAs';
import { buyerService } from '../services/buyer.service';

const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [listing, setListing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advisoryRecommendations, setAdvisoryRecommendations] = useState<any[]>([]);
  const [loadingAdvisory, setLoadingAdvisory] = useState(false);

  useEffect(() => {
    if (id) {
      loadListing(id);
    }
  }, [id]);

  useEffect(() => {
    if (listing?.id) {
      loadAdvisoryData(listing.id);
    }
  }, [listing?.id]);

  const loadListing = async (listingId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await productApi.get(listingId);
      if (response.data.success && response.data.data) {
        setListing(response.data.data);
      } else {
        setError('Listing not found');
      }
    } catch (err) {
      console.error('Failed to load listing:', err);
      setError('Failed to load listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAdvisoryData = async (productId: string) => {
    setLoadingAdvisory(true);
    try {
      const recommendations = await buyerService.getAdvisoryRecommendations(productId);
      setAdvisoryRecommendations(recommendations || []);
    } catch (err) {
      console.error('Failed to load advisory data:', err);
      // Use mock data as fallback for development
      try {
        setAdvisoryRecommendations(buyerService.getMockTrustData(productId).recommendations);
      } catch (fallbackErr) {
        console.error('Failed to load fallback advisory data:', fallbackErr);
        setAdvisoryRecommendations([]);
      }
    } finally {
      setLoadingAdvisory(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 animate-pulse rounded w-3/4" />
              <div className="h-6 bg-gray-200 animate-pulse rounded w-1/4" />
              <div className="h-24 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error || 'Listing not found'}</p>
            <button
              onClick={() => navigate('/products')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Products
            </button>
          </div>
        </main>
      </div>
    );
  }

  const images = listing.images && listing.images.length > 0 
    ? listing.images 
    : ['/api/placeholder/600/600'];
  
  const discount = listing.originalPrice 
    ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 mb-8">
          <span>{listing.category?.name || 'Products'} </span>
          {listing.category?.parent && (
            <>
              <span className="mx-2">›</span>
              <span>{listing.category.parent}</span>
            </>
          )}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div>
            {/* Main Image */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <img
                src={images[selectedImage]}
                alt={listing.title}
                className="w-full h-96 object-contain"
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`bg-white border rounded p-1 ${
                      selectedImage === index
                        ? 'border-blue-600 ring-2 ring-blue-600'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-16 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div>
            {/* Title and Condition */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {listing.title}
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {listing.condition || 'New'}
                </span>
                {listing.viewCount !== undefined && (
                  <span className="text-sm text-gray-600">
                    {listing.viewCount} views
                  </span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  ${Number(listing.price).toFixed(2)}
                </span>
                {discount > 0 && listing.originalPrice && (
                  <>
                    <span className="ml-3 text-xl text-gray-500 line-through">
                      ${Number(listing.originalPrice).toFixed(2)}
                    </span>
                    <span className="ml-3 bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-bold">
                      -{discount}%
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {listing.shipping?.type || 'Standard shipping'}
              </p>
            </div>

            {/* Buyer Action CTAs */}
            <BuyerActionCTAs
              price={listing.price}
              originalPrice={listing.originalPrice}
              quantity={quantity}
              onBuyNow={() => console.log('Buy Now clicked')}
              onAddToCart={() => console.log('Add to Cart clicked')}
              onSaveToList={() => console.log('Save to List clicked')}
              onContactSeller={() => console.log('Contact Seller clicked')}
              className="mb-6"
            />

            {/* Seller Info */}
            {listing.seller && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Seller information</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">
                      {listing.seller.firstName?.[0] || 'U'}
                      {listing.seller.lastName?.[0] || ''}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-blue-600">
                      {listing.seller.firstName} {listing.seller.lastName}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      {listing.seller.rating && (
                        <>
                          <span className="text-yellow-500">★</span>
                          <span className="ml-1">{listing.seller.rating}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button className="w-full mt-3 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 transition-colors text-sm">
                  Visit seller's store
                </button>
              </div>
            )}

            {/* Advisory Panel */}
            {advisoryRecommendations.length > 0 && (
              <div className="mb-6">
                <AdvisoryPanel
                  recommendations={advisoryRecommendations}
                  onActionClick={(action) => {
                    console.log('Advisory action clicked:', action);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Description and Specifications */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Description */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Item description</h3>
            <p className="text-gray-700 whitespace-pre-line">
              {listing.description || 'No description available.'}
            </p>
          </div>

          {/* Specifications */}
          {listing.specifications && listing.specifications.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Specifications</h3>
              <div className="space-y-2">
                {listing.specifications.map((spec: any, index: number) => (
                  <div key={index} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">{spec.name}:</span>
                    <span className="text-gray-900 font-medium">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ListingDetailPage;