import { Link } from 'react-router-dom';
import ProductCard from '../common/ProductCard';
import { useTranslation } from 'react-i18next'; // Add import

// Product interface for CMS data
export interface DealProduct {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  shipping: string;
  condition: 'New' | 'Used' | 'Refurbished' | 'Open Box' | 'Certified Refurbished';
  sellerRating?: number;
  sellerReviews?: number;
  discount?: number;
}

export interface DealsSectionConfig {
  showBadges?: boolean;
  maxItems?: number;
}

interface DealsSectionProps {
  title?: string;
  products?: DealProduct[];
  config?: DealsSectionConfig;
}

// Default products (fallback if no CMS data)
const DEFAULT_PRODUCTS: DealProduct[] = [
  {
    id: 'deal-1',
    title: 'Apple iPhone 15 Pro Max 256GB',
    price: 949.99,
    originalPrice: 1099.99,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300',
    shipping: 'payment.shipping.free',
    condition: 'New',
    sellerRating: 4.9,
    sellerReviews: 15234,
    discount: 14,
  },
  {
    id: 'deal-2',
    title: 'Sony PlayStation 5 Disc Edition',
    price: 449.99,
    originalPrice: 499.99,
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300',
    shipping: 'payment.shipping.free',
    condition: 'New',
    sellerRating: 4.8,
    sellerReviews: 8921,
    discount: 10,
  },
  {
    id: 'deal-3',
    title: 'Samsung 65" 4K OLED Smart TV',
    price: 1497.99,
    originalPrice: 1997.99,
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300',
    shipping: 'payment.shipping.free',
    condition: 'New',
    sellerRating: 4.7,
    sellerReviews: 3456,
    discount: 25,
  },
  {
    id: 'deal-4',
    title: 'Apple MacBook Pro 14" M3 Pro',
    price: 1649.00,
    originalPrice: 1799.00,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300',
    shipping: 'payment.shipping.free',
    condition: 'New',
    sellerRating: 5.0,
    sellerReviews: 2341,
    discount: 8,
  },
  {
    id: 'deal-5',
    title: 'Dyson V15 Detect Cordless Vacuum',
    price: 549.99,
    originalPrice: 649.99,
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=300',
    shipping: 'payment.shipping.free',
    condition: 'Refurbished',
    sellerRating: 4.6,
    sellerReviews: 4521,
    discount: 15,
  },
];

export default function DealsSection({ title, products, config }: DealsSectionProps) {
  const { t } = useTranslation();
  const displayProducts = products && products.length > 0 ? products : DEFAULT_PRODUCTS;
  const showBadges = config?.showBadges !== false;
  const maxItems = config?.maxItems || displayProducts.length;
  const sectionTitle = title || t('homepage.deals.title');

  return (
    <section className="max-w-[1400px] mx-auto px-4 py-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{t(sectionTitle)}</h2>
          <p className="text-sm text-gray-600">{t('homepage.deals.subtitle')}</p>
        </div>
        <Link
          to="/deals"
          className="text-sm font-semibold text-brand-blue hover:text-brand-blueDark hover:underline transition-colors"
        >
          {t('homepage.deals.seeAll')}
        </Link>
      </div>

      {/* Horizontal Scrollable Grid */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-6 min-w-max">
          {displayProducts.slice(0, maxItems).map((product) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { discount, originalPrice, ...productProps } = product;
            return (
              <div key={product.id} className="w-[240px] flex-shrink-0">
                <div className="relative">
                  {/* Discount Badge */}
                  {showBadges && discount && (
                    <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
                      -{discount}%
                    </div>
                  )}
                  <ProductCard {...productProps} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="flex justify-center mt-4 gap-1">
        {[...Array(Math.ceil(displayProducts.slice(0, maxItems).length / 3))].map((_, index) => (
          <div
            key={index}
            className="w-8 h-1 bg-gray-200 rounded-full"
          />
        ))}
      </div>
    </section>
  );
}
