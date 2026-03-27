import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ImageGallery from '../components/product/ImageGallery';
import ProductInfo from '../components/product/ProductInfo';
import BuyBox from '../components/product/BuyBox';
import ProductTabs from '../components/product/ProductTabs';
import ProductGuaranteeBox from '../components/guarantees/ProductGuaranteeBox';
import guaranteesService from '../services/guaranteesService';
import { Reviews } from '../components/reviews/Reviews';
import { Shield, Truck, User, MapPin, Clock, DollarSign } from 'lucide-react';
import { Badge } from '../components/ui/badge';

/**
 * Product Page - Mnbara marketplace product detail view
 */

// Static product data - NO API calls
const PRODUCT = {
  title: 'Apple iPhone 15 Pro Max 256GB Natural Titanium - Factory Unlocked - Excellent',
  itemNumber: '395012847563',
  condition: 'New',
  price: 1099.99,
  originalPrice: 1199.00,
  quantity: 10,
  sold: 847,
  watchers: 156,
  weight: 0.2,
  images: [
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800',
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800',
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbf1?w=800',
    'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800',
  ],
  seller: {
    name: 'techsuperstore',
    feedback: 99.2,
    feedbackCount: 125847,
    itemsSold: 98000,
    location: 'Dubai, UAE'
  },
  shipping: {
    cost: 'FREE',
    service: 'Standard Shipping',
    delivery: 'Wed, Jan 8 - Mon, Jan 13',
    location: 'Edison, New Jersey, United States',
    returns: '30 days returns',
  },
  travelerOptions: [
    {
      id: '1',
      travelerName: 'Ahmed Hassan',
      rating: 4.8,
      route: 'Dubai → London',
      departureDate: '2024-02-25',
      arrivalDate: '2024-02-26',
      pricePerKg: 15,
      totalPrice: 3.00,
      deliveryTime: '1-2 days'
    },
    {
      id: '2',
      travelerName: 'Sarah Wilson',
      rating: 4.9,
      route: 'Dubai → Paris',
      departureDate: '2024-02-28',
      arrivalDate: '2024-03-01',
      pricePerKg: 18,
      totalPrice: 3.60,
      deliveryTime: '2-3 days'
    }
  ]
};

// Breadcrumb Component
function Breadcrumb() {
  const crumbs = ['Electronics', 'Cell Phones & Accessories', 'Cell Phones & Smartphones'];
  return (
    <nav className="max-w-[1200px] mx-auto px-4 py-4">
      <ol className="flex items-center gap-1 text-xs text-gray-600">
        {crumbs.map((crumb, i) => (
          <li key={i} className="flex items-center gap-1">
            <Link to="/category/electronics" className="hover:underline text-brand-blue">{crumb}</Link>
            {i < crumbs.length - 1 && <span className="text-gray-400">{'>'}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function ProductPage() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'about' | 'shipping' | 'payments'>('about');
  const [guarantees, setGuarantees] = useState<any>(null);
  const [guaranteesLoading, setGuaranteesLoading] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState<'direct' | 'traveler'>('direct');
  const [selectedTraveler, setSelectedTraveler] = useState<string | null>(null);

  // Fetch guarantees data
  useEffect(() => {
    const fetchGuarantees = async () => {
      try {
        setGuaranteesLoading(true);
        const data = await guaranteesService.getGuaranteesSummary();
        setGuarantees(data);
      } catch (error) {
        console.error('Failed to fetch guarantees:', error);
        // Don't show error, just hide the guarantee box
      } finally {
        setGuaranteesLoading(false);
      }
    };

    fetchGuarantees();
  }, []);

  return (
    <MainLayout>
      {/* Breadcrumb */}
      <Breadcrumb />
      
      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Escrow Protection Banner */}
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Shield className="w-6 h-6 text-green-600" />
          <div>
            <div className="font-semibold text-green-900">Escrow Protected</div>
            <div className="text-sm text-green-700">Your payment is held securely until you confirm delivery</div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Left Column - Image Gallery */}
          <div className="w-[500px] flex-shrink-0">
            <ImageGallery 
              images={PRODUCT.images} 
              selected={selectedImage} 
              onSelect={setSelectedImage} 
            />
          </div>

          {/* Middle Column - Product Info */}
          <div className="flex-1 min-w-0">
            <ProductInfo product={PRODUCT} />
            
            {/* Delivery Method Selector */}
            <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Delivery Method</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeliveryMethod('direct')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    deliveryMethod === 'direct'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Truck className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <div className="font-medium text-gray-900">Direct Shipping</div>
                  <div className="text-sm text-gray-600">Standard delivery</div>
                </button>
                <button
                  onClick={() => setDeliveryMethod('traveler')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    deliveryMethod === 'traveler'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <div className="font-medium text-gray-900">Traveler Delivery</div>
                  <div className="text-sm text-gray-600">Faster & cheaper</div>
                </button>
              </div>

              {deliveryMethod === 'traveler' && (
                <div className="mt-4 space-y-3">
                  <h4 className="font-medium text-gray-900">Available Travelers</h4>
                  {PRODUCT.travelerOptions.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => setSelectedTraveler(option.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedTraveler === option.id
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-gray-600" />
                          <span className="font-medium text-gray-900">{option.travelerName}</span>
                          <Badge variant="success" size="sm">★ {option.rating}</Badge>
                        </div>
                        <div className="text-sm text-gray-600">{option.deliveryTime}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {option.route}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-4 h-4" />
                          {option.departureDate}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-sm font-medium text-green-600">
                        <DollarSign className="w-4 h-4" />
                        ${option.totalPrice.toFixed(2)} delivery fee
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Buy Box */}
          <div className="w-[300px] flex-shrink-0">
            <BuyBox 
              product={PRODUCT} 
              quantity={quantity} 
              setQuantity={setQuantity} 
            />
            
            {/* Guarantee Box */}
            <div className="mt-4">
              <ProductGuaranteeBox variant="product" />
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <ProductTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Reviews Section */}
        <div className="mt-8">
          <Reviews productId={PRODUCT.itemNumber} />
        </div>
      </div>
    </MainLayout>
  );
}
