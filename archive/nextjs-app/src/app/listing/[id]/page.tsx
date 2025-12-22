import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PaymentAdvisoryCard } from '@/components/payments/PaymentAdvisoryCard';

// Placeholder data - will be replaced with API calls
const MOCK_LISTING = {
  id: '1',
  title: 'iPhone 15 Pro Max 256GB - Natural Titanium',
  description: 'Brand new, sealed in box. US version with warranty. Looking for a traveler from USA to Egypt.',
  price: 1199,
  origin: 'USA',
  destination: 'Egypt',
  category: 'Electronics',
  condition: 'New',
  createdAt: '2024-12-15',
  seller: {
    name: 'Ahmed M.',
    rating: 4.8,
    reviews: 24,
    verified: true,
  },
  images: [],
};

interface PageProps {
  params: { id: string };
}

export default function ListingPage({ params }: PageProps) {
  // TODO: Replace with API call
  const listing = MOCK_LISTING;
  const isLoading = false;

  // Handle not found
  if (!listing && !isLoading) {
    notFound();
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="aspect-square loading-skeleton rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 loading-skeleton w-3/4" />
            <div className="h-6 loading-skeleton w-1/4" />
            <div className="h-24 loading-skeleton" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-gray-700">Home</Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/search" className="hover:text-gray-700">Search</Link>
          </li>
          <li>/</li>
          <li className="text-gray-900">{listing.title}</li>
        </ol>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-gray-400">No Image Available</span>
          </div>
          {/* Thumbnail strip - placeholder for multiple images */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary-500"
              >
                <span className="text-gray-400 text-xs">{i}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {listing.title}
          </h1>
          
          <div className="flex items-center gap-4 mb-4">
            <span className="text-3xl font-bold text-primary-600">
              ${listing.price}
            </span>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {listing.condition}
            </span>
          </div>

          {/* Route */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-sm text-gray-500">From</p>
                <p className="font-semibold text-gray-900">{listing.origin}</p>
              </div>
              <div className="flex-1 px-4">
                <div className="border-t-2 border-dashed border-gray-300 relative">
                  <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-50 px-2">
                    ✈️
                  </span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">To</p>
                <p className="font-semibold text-gray-900">{listing.destination}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-gray-600">{listing.description}</p>
          </div>

          {/* Details */}
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">Details</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Category</dt>
                <dd className="text-gray-900">{listing.category}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Condition</dt>
                <dd className="text-gray-900">{listing.condition}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Posted</dt>
                <dd className="text-gray-900">{listing.createdAt}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Listing ID</dt>
                <dd className="text-gray-900">#{params.id}</dd>
              </div>
            </dl>
          </div>

          {/* Seller Info */}
          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">
                    {listing.seller.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{listing.seller.name}</p>
                    {listing.seller.verified && (
                      <span className="text-primary-600" title="Verified">✓</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    ⭐ {listing.seller.rating} ({listing.seller.reviews} reviews)
                  </p>
                </div>
              </div>
              <button className="text-primary-600 text-sm font-medium hover:text-primary-700">
                View Profile
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition">
              Make an Offer
            </button>
            <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
              Contact Seller
            </button>
          </div>

          {/* Payment Advisory */}
          <div className="mt-6">
            <PaymentAdvisoryCard productPrice={listing.price} travelerCurrency="AED" />
          </div>

          {/* Trust Notice */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Funds are NOT collected.</strong> Mnbarh will enable payment execution after licensing and
              fraud controls are finalized. For now, all quotes are informational only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
