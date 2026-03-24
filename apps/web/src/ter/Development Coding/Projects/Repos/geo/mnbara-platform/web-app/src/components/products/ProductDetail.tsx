import React, { useState } from 'react';
import { Button } from '../core/Button';
import { AuctionTimer } from '../auction/AuctionTimer';
import { AuctionStatusBadge } from '../auction/AuctionStatusBadge';
import { CurrentBid } from '../auction/CurrentBid';
import { BidForm } from '../auction/BidForm';
import { BidHistory } from '../auction/BidHistory';
import { PlaceBidModal } from '../auction/PlaceBidModal';
import type { Product, Bid, AuctionDetails } from '../../types/product';
import './ProductDetail.css';

export interface ProductDetailProps {
  product: Product;
  bids?: Bid[];
  auctionDetails?: AuctionDetails;
  currentUserId?: string;
  onPlaceBid?: (amount: number) => Promise<void>;
  onBuyNow?: () => void;
  onMakeOffer?: () => void;
  onFavorite?: () => void;
  onContactSeller?: () => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  bids = [],
  auctionDetails,
  currentUserId,
  onPlaceBid,
  onBuyNow,
  onMakeOffer,
  onFavorite,
  onContactSeller,
}) => {
  const [showBidModal, setShowBidModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'shipping' | 'returns'>('description');

  const isAuction = !!auctionDetails;
  const currentPrice = auctionDetails?.currentPrice || product.price;
  const isWinning = bids.some(b => b.bidderId === currentUserId && b.isWinningBid);
  const isOutbid = bids.some(b => b.bidderId === currentUserId && !b.isWinningBid);

  return (
    <div className="mnbara-product-detail">
      <div className="mnbara-product-detail__main">
        {/* Auction Info Bar */}
        {isAuction && auctionDetails && (
          <div className="mnbara-product-detail__auction-bar">
            <AuctionStatusBadge status={auctionDetails.status} size="md" />
            {auctionDetails.status === 'active' && (
              <AuctionTimer endTime={auctionDetails.endTime} onEnd={() => {}} size="md" />
            )}
          </div>
        )}

        {/* Price and Action Section */}
        <div className="mnbara-product-detail__header">
          <div className="mnbara-product-detail__price-section">
            {isAuction ? (
              <div className="mnbara-product-detail__auction-price">
                <span className="mnbara-product-detail__price-label">Current Bid</span>
                <span className="mnbara-product-detail__price-value">
                  {product.currency} {currentPrice.toLocaleString()}
                </span>
                <span className="mnbara-product-detail__price-sub">
                  {auctionDetails?.bidCount || 0} bids
                </span>
              </div>
            ) : (
              <div className="mnbara-product-detail__fixed-price">
                <span className="mnbara-product-detail__price-label">Price</span>
                <span className="mnbara-product-detail__price-value">
                  {product.currency} {product.price.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="mnbara-product-detail__actions">
            {isAuction ? (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => setShowBidModal(true)}
                >
                  Place Bid
                </Button>
                {product.hasBuyItNow && product.buyItNowPrice && (
                  <Button
                    variant="success"
                    size="lg"
                    fullWidth
                    onClick={onBuyNow}
                  >
                    Buy It Now - {product.currency}{product.buyItNowPrice.toLocaleString()}
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={onBuyNow}
                >
                  {product.allowsOffers ? 'Buy Now' : 'Buy Now'}
                </Button>
                {product.allowsOffers && (
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    onClick={onMakeOffer}
                  >
                    Make an Offer
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bid History for Auctions */}
        {isAuction && bids.length > 0 && (
          <div className="mnbara-product-detail__bid-history">
            <BidHistory
              bids={bids}
              currentUserId={currentUserId}
              maxItems={5}
            />
          </div>
        )}

        {/* Product Description Tabs */}
        <div className="mnbara-product-detail__tabs">
          <div className="mnbara-product-detail__tab-header">
            <button
              className={`mnbara-product-detail__tab-btn ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button
              className={`mnbara-product-detail__tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
              onClick={() => setActiveTab('shipping')}
            >
              Shipping
            </button>
            <button
              className={`mnbara-product-detail__tab-btn ${activeTab === 'returns' ? 'active' : ''}`}
              onClick={() => setActiveTab('returns')}
            >
              Returns
            </button>
          </div>

          <div className="mnbara-product-detail__tab-content">
            {activeTab === 'description' && (
              <div className="mnbara-product-detail__description">
                <h3>About this item</h3>
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              </div>
            )}
            {activeTab === 'shipping' && (
              <div className="mnbara-product-detail__shipping">
                <h3>Shipping Information</h3>
                <p>Ships within 1-2 business days</p>
                <p>Free shipping on orders over $50</p>
              </div>
            )}
            {activeTab === 'returns' && (
              <div className="mnbara-product-detail__returns">
                <h3>Return Policy</h3>
                <p>30-day returns accepted</p>
                <p>Buyer pays return shipping</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Place Bid Modal */}
      {isAuction && auctionDetails && (
        <PlaceBidModal
          auction={auctionDetails}
          product={product}
          isOpen={showBidModal}
          onClose={() => setShowBidModal(false)}
          onSubmitBid={onPlaceBid || (() => Promise.resolve())}
        />
      )}
    </div>
  );
};

export default ProductDetail;
