import { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import ImageGallery from '../components/product/ImageGallery';
import ProductInfo from '../components/product/ProductInfo';
import BuyBox from '../components/product/BuyBox';
import ProductTabs from '../components/product/ProductTabs';
import ProductGuaranteeBox from '../components/guarantees/ProductGuaranteeBox';
import guaranteesService from '../services/guaranteesService';

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
  },
  shipping: {
    cost: 'FREE',
    service: 'Standard Shipping',
    delivery: 'Wed, Jan 8 - Mon, Jan 13',
    location: 'Edison, New Jersey, United States',
    returns: '30 days returns',
  },
};

// Breadcrumb Component
function Breadcrumb() {
  const crumbs = ['Electronics', 'Cell Phones & Accessories', 'Cell Phones & Smartphones'];
  return (
    <nav className="max-w-[1200px] mx-auto px-4 py-4">
      <ol className="flex items-center gap-1 text-xs text-gray-600">
        {crumbs.map((crumb, i) => (
          <li key={i} className="flex items-center gap-1">
            <a href="#" className="hover:underline text-brand-blue">{crumb}</a>
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
      </div>
    </MainLayout>
  );
}
