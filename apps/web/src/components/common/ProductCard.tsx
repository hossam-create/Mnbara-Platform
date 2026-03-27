import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  shipping: string;
  condition?: 'New' | 'Used' | 'Refurbished' | 'Open Box' | 'Certified Refurbished';
  sellerRating?: number; // 0-5
  sellerReviews?: number;
}

// ... (StarRating and ConditionBadge components remain unchanged) ...

export default function ProductCard({ 
  id, 
  title, 
  price, 
  image, 
  shipping, 
  condition = 'New',
  sellerRating = 4.5,
  sellerReviews = 1234
}: ProductCardProps) {
  const { t } = useTranslation();
  return (
    <Link to={`/product/${id}`} className="group block">
      {/* Product Image - RETAIL PRIORITY #1 */}
      {/* ... (Image rendering remains unchanged) ... */}

      {/* Product Title - RETAIL PRIORITY #2 */}
      {/* ... (Title rendering remains unchanged) ... */}

      {/* Price - RETAIL PRIORITY #3 */}
      {/* ... (Price rendering remains unchanged) ... */}

      {/* Shipping Info - RETAIL PRIORITY #4 */}
      <p className="text-xs text-gray-600 mb-3 font-normal">
        {t(shipping)}
      </p>

      {/* Seller Rating - SECONDARY (de-emphasized) */}
      {/* ... (Rating rendering remains unchanged) ... */}
    </Link>
  );
}
