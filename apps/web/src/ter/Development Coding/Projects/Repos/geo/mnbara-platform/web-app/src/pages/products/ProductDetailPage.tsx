import React, { useState } from 'react';
import { ProductGallery } from '../../components/products/ProductGallery';
import { ProductDetail } from '../../components/products/ProductDetail';
import { ProductBreadcrumbs } from '../../components/products/ProductBreadcrumbs';
import { WinnerAnnouncement } from '../../components/auction/WinnerAnnouncement';
import type { Product, Bid, AuctionDetails } from '../../types/product';
import './ProductDetailPage.css';

// Mock product for demonstration
const mockProduct: Product = {
  id: '2',
  title: 'Vintage Rolex Submariner Watch - 1975 Edition',
  slug: 'vintage-rolex-submariner',
  description: '<p>This is an authentic vintage Rolex Submariner from 1975 in excellent condition. The watch features the original dial, hands, and crown. It has been recently serviced and is keeping excellent time.</p><p>Includes original box and papers from the era.</p>',
  shortDescription: 'Rare vintage Rolex Submariner from 1975',
  price: 15000,
  currency: 'USD',
  condition: 'good',
  status: 'active',
  categoryId: '5',
  seller: {
    id: 's2',
    name: 'Luxury Watches',
    rating: 4.8,
    reviewCount: 450,
    verified: true,
    memberSince: '2019-05-01',
  },
  images: [
    { id: 'img1', url: '/images/rolex-1.jpg', thumbnailUrl: '/images/rolex-1-thumb.jpg', isPrimary: true, sortOrder: 0 },
    { id: 'img2', url: '/images/rolex-2.jpg', thumbnailUrl: '/images/rolex-2-thumb.jpg', isPrimary: false, sortOrder: 1 },
    { id: 'img3', url: '/images/rolex-3.jpg', thumbnailUrl: '/images/rolex-3-thumb.jpg', isPrimary: false, sortOrder: 2 },
    { id: 'img4', url: '/images/rolex-4.jpg', thumbnailUrl: '/images/rolex-4-thumb.jpg', isPrimary: false, sortOrder: 3 },
  ],
  location: { country: 'USA', city: 'Los Angeles' },
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  viewCount: 4500,
  favoriteCount: 234,
  isFavorite: false,
  auction: {
    id: 'auction1',
    productId: '2',
    startingPrice: 10000,
    currentPrice: 14500,
    reservePrice: 14000,
    hasReserve: true,
    startTime: '2024-01-10T10:00:00Z',
    endTime: '2024-01-20T10:00:00Z',
    status: 'active',
    bidCount: 12,
    bidIncrement: 250,
    watchersCount: 89,
    autoExtendEnabled: true,
    autoExtendMinutes: 5,
    extendThresholdMinutes: 5,
  },
  hasBuyItNow: false,
  allowsOffers: false,
};

// Mock bids
const mockBids: Bid[] = [
  {
    id: 'bid1',
    auctionId: 'auction1',
    productId: '2',
    bidderId: 'user1',
    bidderName: 'John D.',
    amount: 14500,
    currency: 'USD',
    isWinningBid: true,
    isAutoBid: false,
    createdAt: '2024-01-18T10:30:00Z',
    timestamp: '2024-01-18T10:30:00Z',
  },
  {
    id: 'bid2',
    auctionId: 'auction1',
    productId: '2',
    bidderId: 'user2',
    bidderName: 'Sarah M.',
    amount: 14250,
    currency: 'USD',
    isWinningBid: false,
    isAutoBid: true,
    createdAt: '2024-01-18T09:15:00Z',
    timestamp: '2024-01-18T09:15:00Z',
  },
  {
    id: 'bid3',
    auctionId: 'auction1',
    productId: '2',
    bidderId: 'user3',
    bidderName: 'Mike R.',
    amount: 14000,
    currency: 'USD',
    isWinningBid: false,
    isAutoBid: false,
    createdAt: '2024-01-17T14:20:00Z',
    timestamp: '2024-01-17T14:20:00Z',
  },
];

// Mock categories
const mockCategories = [
  { id: '5', name: 'Collectibles', slug: 'collectibles' },
  { id: '5-1', name: 'Watches', slug: 'watches', parentId: '5' },
];

export const ProductDetailPage: React.FC = () => {
  const [product] = useState<Product>(mockProduct);
  const [bids] = useState<Bid[]>(mockBids);
  const [isOutbid, setIsOutbid] = useState(false);

  const handlePlaceBid = async (amount: number) => {
    console.log('Placing bid:', amount);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsOutbid(false);
  };

  const handleBuyNow = () => {
    console.log('Buy Now clicked');
  };

  const handleFavorite = () => {
    console.log('Toggle favorite');
  };

  const handleContactSeller = () => {
    console.log('Contact seller');
  };

  return (
    <div className="mnbara-product-detail-page">
      <div className="mnbara-product-detail-page__container">
        <ProductBreadcrumbs
          categories={mockCategories}
          currentCategoryId={product.categoryId}
          productTitle={product.title}
        />

        <div className="mnbara-product-detail-page__grid">
          <div className="mnbara-product-detail-page__gallery">
            <ProductGallery
              images={product.images}
              productTitle={product.title}
            />
          </div>

          <div className="mnbara-product-detail-page__info">
            <ProductDetail
              product={product}
              bids={bids}
              auctionDetails={product.auction}
              currentUserId="current-user"
              onPlaceBid={handlePlaceBid}
              onBuyNow={handleBuyNow}
              onFavorite={handleFavorite}
              onContactSeller={handleContactSeller}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
