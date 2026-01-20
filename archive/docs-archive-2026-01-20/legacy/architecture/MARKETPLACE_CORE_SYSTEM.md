# Marketplace Core - System Architecture Design

## 1. AUCTION SYSTEM

### Auction Schema

```sql
CREATE TABLE auctions (
  id UUID PRIMARY KEY,
  seller_id UUID NOT NULL,
  
  -- Item details
  item_id UUID NOT NULL,
  item_title VARCHAR(255) NOT NULL,
  item_description TEXT,
  item_category VARCHAR(100),
  
  -- Auction parameters
  starting_price DECIMAL(19,8) NOT NULL,
  reserve_price DECIMAL(19,8),
  current_price DECIMAL(19,8),
  
  -- Timing
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  auto_extend_enabled BOOLEAN DEFAULT false,
  auto_extend_minutes INT DEFAULT 5,
  
  -- Status
  status ENUM(
    'DRAFT',
    'ACTIVE',
    'ENDING_SOON',
    'ENDED',
    'SOLD',
    'UNSOLD',
    'CANCELLED'
  ) NOT NULL,
  
  -- Winner
  winner_id UUID,
  final_price DECIMAL(19,8),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT auction_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_auction_seller ON auctions(seller_id);
CREATE INDEX idx_auction_status ON auctions(status);
CREATE INDEX idx_auction_end_time ON auctions(end_time);
CREATE INDEX idx_auction_winner ON auctions(winner_id);
```

---

### Bid Schema

```sql
CREATE TABLE bids (
  id UUID PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES auctions(id),
  bidder_id UUID NOT NULL,
  
  -- Bid details
  bid_amount DECIMAL(19,8) NOT NULL,
  bid_type ENUM('MANUAL', 'PROXY', 'AUTO_EXTEND'),
  
  -- Status
  status ENUM('ACTIVE', 'OUTBID', 'WINNING', 'CANCELLED'),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT bid_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_bid_auction ON bids(auction_id);
CREATE INDEX idx_bid_bidder ON bids(bidder_id);
CREATE INDEX idx_bid_status ON bids(status);
```

---

### Auction Operations

```typescript
interface AuctionService {
  // Create auction
  createAuction(
    sellerId: UUID,
    itemId: UUID,
    startingPrice: Decimal,
    endTime: Date
  ): Promise<Auction>;
  
  // Place bid
  placeBid(
    auctionId: UUID,
    bidderId: UUID,
    bidAmount: Decimal
  ): Promise<Bid>;
  
  // End auction
  endAuction(auctionId: UUID): Promise<void>;
  
  // Get auction details
  getAuction(auctionId: UUID): Promise<AuctionDetail>;
  
  // Get bids
  getBids(auctionId: UUID): Promise<Bid[]>;
}
```

---

### Bid Logic

```typescript
async function placeBid(
  auctionId: UUID,
  bidderId: UUID,
  bidAmount: Decimal
): Promise<Bid> {
  // 1. Get auction
  const auction = await getAuction(auctionId);
  
  // 2. Validate auction state
  if (auction.status !== 'ACTIVE') {
    throw new Error('Auction not active');
  }
  
  // 3. Validate bid amount
  if (bidAmount.lessThanOrEqualTo(auction.current_price)) {
    throw new Error('Bid must exceed current price');
  }
  
  // 4. Check bidder limits
  const kyc = await getKYCProfile(bidderId);
  if (bidAmount.greaterThan(kyc.transaction_limit)) {
    throw new Error('Bid exceeds limit');
  }
  
  // 5. Create hold on bidder wallet
  const hold = await createHold(
    bidderId,
    bidAmount,
    'AUCTION_BID',
    auctionId
  );
  
  // 6. Create bid
  const bid = {
    id: generateUUID(),
    auction_id: auctionId,
    bidder_id: bidderId,
    bid_amount: bidAmount,
    bid_type: 'MANUAL',
    status: 'WINNING',
    created_at: now()
  };
  
  // 7. Outbid previous winner
  const previousWinner = await getWinningBid(auctionId);
  if (previousWinner) {
    await updateBidStatus(previousWinner.id, 'OUTBID');
    await releaseHold(previousWinner.hold_id);
  }
  
  // 8. Update auction
  await updateAuction(auctionId, {
    current_price: bidAmount,
    winner_id: bidderId
  });
  
  // 9. Store bid
  await insertBid(bid);
  
  // 10. Emit event
  await eventBus.publish('auction.bid_placed', {
    auctionId,
    bidderId,
    bidAmount,
    timestamp: now()
  });
  
  return bid;
}
```

---

## 2. ORDER MANAGEMENT

### Order Schema

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  
  -- Parties
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  
  -- Source
  source_type ENUM('AUCTION', 'DIRECT_PURCHASE', 'OFFER'),
  source_id UUID, -- auction_id or listing_id
  
  -- Items
  items JSONB, -- Array of order items
  
  -- Pricing
  subtotal DECIMAL(19,8) NOT NULL,
  shipping_cost DECIMAL(19,8),
  tax DECIMAL(19,8),
  total DECIMAL(19,8) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  
  -- Status
  status ENUM(
    'PENDING',
    'CONFIRMED',
    'PAID',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'DISPUTED'
  ) NOT NULL,
  
  -- Shipping
  shipping_address JSONB,
  tracking_number VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  paid_at TIMESTAMP,
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  
  CONSTRAINT order_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_order_buyer ON orders(buyer_id);
CREATE INDEX idx_order_seller ON orders(seller_id);
CREATE INDEX idx_order_status ON orders(status);
CREATE INDEX idx_order_created ON orders(created_at);
```

---

### Order Operations

```typescript
interface OrderService {
  // Create order
  createOrder(
    buyerId: UUID,
    sellerId: UUID,
    items: OrderItem[],
    shippingAddress: Address
  ): Promise<Order>;
  
  // Confirm order
  confirmOrder(orderId: UUID): Promise<void>;
  
  // Process payment
  processPayment(orderId: UUID): Promise<void>;
  
  // Update shipping
  updateShipping(
    orderId: UUID,
    trackingNumber: string
  ): Promise<void>;
  
  // Complete order
  completeOrder(orderId: UUID): Promise<void>;
  
  // Get order details
  getOrder(orderId: UUID): Promise<OrderDetail>;
}
```

---

### Order Workflow

```typescript
async function createOrder(
  buyerId: UUID,
  sellerId: UUID,
  items: OrderItem[],
  shippingAddress: Address
): Promise<Order> {
  // 1. Calculate totals
  const subtotal = items.reduce((sum, item) => 
    sum.add(item.price.multiply(item.quantity)), 
    new Decimal(0)
  );
  
  const shippingCost = await calculateShipping(
    shippingAddress,
    items
  );
  
  const tax = await calculateTax(
    subtotal,
    shippingAddress
  );
  
  const total = subtotal.add(shippingCost).add(tax);
  
  // 2. Create order
  const order = {
    id: generateUUID(),
    buyer_id: buyerId,
    seller_id: sellerId,
    source_type: 'AUCTION',
    items,
    subtotal,
    shipping_cost: shippingCost,
    tax,
    total,
    currency: 'USD',
    status: 'PENDING',
    shipping_address: shippingAddress,
    created_at: now()
  };
  
  // 3. Create escrow
  const escrow = await createEscrow(
    generateUUID(),
    buyerId,
    sellerId,
    total,
    'BUYER_PROTECTION'
  );
  
  // 4. Store order
  await insertOrder(order);
  
  // 5. Emit event
  await eventBus.publish('order.created', {
    orderId: order.id,
    buyerId,
    sellerId,
    total,
    timestamp: now()
  });
  
  return order;
}
```

---

## 3. MATCHING ENGINE

### Matching Schema

```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  
  -- Parties
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  
  -- Match details
  match_type ENUM('AUCTION', 'DIRECT', 'RECOMMENDATION'),
  match_score DECIMAL(5,2), -- 0-100
  
  -- Items
  buyer_intent JSONB, -- What buyer is looking for
  seller_inventory JSONB, -- What seller has
  
  -- Status
  status ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  expires_at TIMESTAMP,
  
  CONSTRAINT match_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_match_buyer ON matches(buyer_id);
CREATE INDEX idx_match_seller ON matches(seller_id);
CREATE INDEX idx_match_status ON matches(status);
```

---

### Matching Algorithm

```typescript
async function findMatches(
  buyerId: UUID,
  intent: BuyerIntent
): Promise<Match[]> {
  // 1. Get buyer profile
  const buyerProfile = await getUserProfile(buyerId);
  
  // 2. Get seller inventory
  const sellers = await getActiveSellers();
  
  // 3. Score each seller
  const matches: Match[] = [];
  
  for (const seller of sellers) {
    const inventory = await getSellerInventory(seller.id);
    
    // Calculate match score
    const score = calculateMatchScore(intent, inventory, {
      buyerLocation: buyerProfile.location,
      sellerLocation: seller.location,
      buyerRating: buyerProfile.rating,
      sellerRating: seller.rating
    });
    
    if (score > 0.7) { // 70% threshold
      matches.push({
        id: generateUUID(),
        buyer_id: buyerId,
        seller_id: seller.id,
        match_type: 'RECOMMENDATION',
        match_score: score,
        buyer_intent: intent,
        seller_inventory: inventory,
        status: 'PENDING',
        created_at: now(),
        expires_at: addDays(now(), 7)
      });
    }
  }
  
  // 4. Sort by score
  matches.sort((a, b) => b.match_score - a.match_score);
  
  // 5. Store matches
  await insertMatches(matches);
  
  return matches;
}

function calculateMatchScore(
  intent: BuyerIntent,
  inventory: SellerInventory,
  context: MatchContext
): number {
  let score = 0;
  
  // Category match
  if (inventory.categories.includes(intent.category)) {
    score += 30;
  }
  
  // Price match
  const priceMatch = Math.abs(
    (inventory.avgPrice - intent.maxPrice) / intent.maxPrice
  );
  if (priceMatch < 0.2) {
    score += 25;
  }
  
  // Location match
  const distance = calculateDistance(
    context.buyerLocation,
    context.sellerLocation
  );
  if (distance < 100) { // km
    score += 20;
  }
  
  // Rating match
  if (context.sellerRating > 4.5) {
    score += 15;
  }
  
  // Inventory freshness
  if (inventory.lastUpdated < 7) { // days
    score += 10;
  }
  
  return Math.min(100, score);
}
```

---

## 4. LISTING MANAGEMENT

### Listing Schema

```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY,
  seller_id UUID NOT NULL,
  
  -- Item details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  
  -- Pricing
  price DECIMAL(19,8) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  
  -- Inventory
  quantity INT NOT NULL,
  quantity_available INT NOT NULL,
  
  -- Status
  status ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'SOLD_OUT', 'DELISTED'),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT listing_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_listing_seller ON listings(seller_id);
CREATE INDEX idx_listing_status ON listings(status);
CREATE INDEX idx_listing_category ON listings(category);
```

---

## 5. REVIEW & RATING SYSTEM

### Review Schema

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  
  -- Parties
  reviewer_id UUID NOT NULL,
  reviewee_id UUID NOT NULL,
  
  -- Review details
  order_id UUID NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  
  -- Categories
  item_quality INT,
  shipping_speed INT,
  seller_communication INT,
  
  -- Status
  status ENUM('PENDING', 'PUBLISHED', 'FLAGGED', 'REMOVED'),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  
  CONSTRAINT review_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_review_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_review_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_review_order ON reviews(order_id);
CREATE INDEX idx_review_status ON reviews(status);
```

---

### Rating Calculation

```typescript
async function calculateUserRating(userId: UUID): Promise<UserRating> {
  // Get all reviews for user
  const reviews = await getPublishedReviews(userId);
  
  if (reviews.length === 0) {
    return {
      overallRating: 0,
      reviewCount: 0,
      breakdown: {}
    };
  }
  
  // Calculate average
  const overallRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  
  // Calculate breakdown
  const breakdown = {
    itemQuality: reviews.reduce((sum, r) => sum + r.item_quality, 0) / reviews.length,
    shippingSpeed: reviews.reduce((sum, r) => sum + r.shipping_speed, 0) / reviews.length,
    communication: reviews.reduce((sum, r) => sum + r.seller_communication, 0) / reviews.length
  };
  
  return {
    overallRating: Math.round(overallRating * 10) / 10,
    reviewCount: reviews.length,
    breakdown
  };
}
```

---

## 6. NON-NEGOTIABLES

### Auction Cannot Be Manipulated

**FORBIDDEN:**
```typescript
// ❌ WRONG - Seller can change auction price
async function updateAuctionPrice(auctionId: UUID, newPrice: Decimal) {
  await db.query(
    'UPDATE auctions SET current_price = $1 WHERE id = $2',
    [newPrice, auctionId]
  );
}
```

**CORRECT:**
```typescript
// ✅ RIGHT - Only bids can change price
async function placeBid(
  auctionId: UUID,
  bidderId: UUID,
  bidAmount: Decimal
): Promise<Bid> {
  // Validate bid amount
  const auction = await getAuction(auctionId);
  if (bidAmount.lessThanOrEqualTo(auction.current_price)) {
    throw new Error('Bid must exceed current price');
  }
  
  // Create bid (immutable)
  const bid = await insertBid({
    auction_id: auctionId,
    bidder_id: bidderId,
    bid_amount: bidAmount,
    created_at: now()
  });
  
  // Update auction via ledger
  await updateAuctionPrice(auctionId, bidAmount);
  
  return bid;
}
```

---

### Order Cannot Be Modified After Confirmation

**FORBIDDEN:**
```typescript
// ❌ WRONG - Order can be modified
async function updateOrderTotal(orderId: UUID, newTotal: Decimal) {
  await db.query(
    'UPDATE orders SET total = $1 WHERE id = $2',
    [newTotal, orderId]
  );
}
```

**CORRECT:**
```typescript
// ✅ RIGHT - Orders are immutable after confirmation
async function confirmOrder(orderId: UUID): Promise<void> {
  const order = await getOrder(orderId);
  
  if (order.status !== 'PENDING') {
    throw new Error('Order already confirmed');
  }
  
  // Confirm (immutable)
  await updateOrderStatus(orderId, 'CONFIRMED');
  
  // No further modifications allowed
}
```

---

### Reviews Must Be Verified

**FORBIDDEN:**
```typescript
// ❌ WRONG - Anyone can post review
async function postReview(
  reviewerId: UUID,
  revieweeId: UUID,
  rating: number,
  comment: string
) {
  // No verification
  await insertReview({
    reviewer_id: reviewerId,
    reviewee_id: revieweeId,
    rating,
    comment,
    status: 'PUBLISHED'
  });
}
```

**CORRECT:**
```typescript
// ✅ RIGHT - Only verified buyers can review
async function postReview(
  reviewerId: UUID,
  revieweeId: UUID,
  orderId: UUID,
  rating: number,
  comment: string
): Promise<Review> {
  // 1. Verify order exists
  const order = await getOrder(orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  
  // 2. Verify reviewer is buyer
  if (order.buyer_id !== reviewerId) {
    throw new Error('Only buyer can review');
  }
  
  // 3. Verify order is completed
  if (order.status !== 'COMPLETED') {
    throw new Error('Order not completed');
  }
  
  // 4. Create review (pending)
  const review = await insertReview({
    reviewer_id: reviewerId,
    reviewee_id: revieweeId,
    order_id: orderId,
    rating,
    comment,
    status: 'PENDING',
    created_at: now()
  });
  
  return review;
}
```

---

## 7. IMPLEMENTATION ROADMAP

### Phase 1: Auction Core (Weeks 1-2)
- [ ] Create auction schema
- [ ] Implement bid placement
- [ ] Add auction ending logic
- [ ] Create bid validation

### Phase 2: Order Management (Weeks 3-4)
- [ ] Create order schema
- [ ] Implement order workflow
- [ ] Add payment processing
- [ ] Create shipping integration

### Phase 3: Matching (Weeks 5-6)
- [ ] Implement matching algorithm
- [ ] Add match scoring
- [ ] Create match notifications
- [ ] Add match acceptance

### Phase 4: Reviews & Ratings (Weeks 7-8)
- [ ] Create review schema
- [ ] Implement rating calculation
- [ ] Add review moderation
- [ ] Create rating display

---

**Document Version:** 1.0  
**Last Updated:** December 20, 2025  
**Status:** Architecture Design (Ready for Implementation)
