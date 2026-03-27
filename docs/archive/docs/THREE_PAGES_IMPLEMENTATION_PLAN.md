# ط®ط·ط© طھظ†ظپظٹط° ط§ظ„ط«ظ„ط§ط« طµظپط­ط§طھ ط§ظ„ط±ط¦ظٹط³ظٹط© - Mnbarh vs eBay

## ًں“‹ ظ…ظ„ط®طµ ط§ظ„طµظپط­ط§طھ ط§ظ„ط«ظ„ط§ط«

### 1ï¸ڈâƒ£ **Homepage (ط§ظ„طµظپط­ط© ط§ظ„ط£ظˆظ„ظ‰)**
- **ط§ظ„ط­ط§ظ„ط© ط§ظ„ط­ط§ظ„ظٹط©:** 90% ظ…ظƒطھظ…ظ„ط©
- **ط§ظ„ط£ظ‚ط³ط§ظ… ط§ظ„ظ…ظˆط¬ظˆط¯ط©:** Hero, Categories, Live Deals, Auctions, Trending Searches, Featured Products, Recently Viewed, Recommendations, Reviews, Trust Badges, CTAs
- **ط§ظ„ظ†ط§ظ‚طµ:** Trending Products SectionطŒ ط¨ط¹ط¶ ط§ظ„طھط­ط³ظٹظ†ط§طھ ط§ظ„ط¨طµط±ظٹط©

### 2ï¸ڈâƒ£ **Product Page (طµظپط­ط© ط§ظ„ظ…ظ†طھط¬)**
- **ط§ظ„ط­ط§ظ„ط© ط§ظ„ط­ط§ظ„ظٹط©:** ظ…ظˆط¬ظˆط¯ط© ظ„ظƒظ† ظ‚ط¯ طھط­طھط§ط¬ طھط­ط³ظٹظ†ط§طھ
- **ط§ظ„ط£ظ‚ط³ط§ظ… ط§ظ„ط±ط¦ظٹط³ظٹط©:** Product ImagesطŒ Product DetailsطŒ Seller InfoطŒ PriceطŒ WishlistطŒ Similar Items

### 3ï¸ڈâƒ£ **Search Results Page (طµظپط­ط© ط§ظ„ط¨ط­ط«)**
- **ط§ظ„ط­ط§ظ„ط© ط§ظ„ط­ط§ظ„ظٹط©:** ظ…ظˆط¬ظˆط¯ط© (SearchPage.tsx)
- **ط§ظ„ط£ظ‚ط³ط§ظ… ط§ظ„ط±ط¦ظٹط³ظٹط©:** Search BarطŒ Left Sidebar FiltersطŒ Product ListingsطŒ Sort/View Options

---

## ًںژ¯ ط§ظ„ط£ظˆظ„ظˆظٹط§طھ ظˆط§ظ„طھط­ط³ظٹظ†ط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©

### **Priority 1: Homepage Improvements** (ط¹ط§ظ„ظٹ ط¬ط¯ط§ظ‹)

#### 1.1 ط¥ط¶ط§ظپط© "Trending Products" Section
**ط§ظ„ظˆطµظپ:** ط¹ط±ط¶ ظ…ظ†طھط¬ط§طھ trending ظ…ط¹ طµظˆط± ط¯ط§ط¦ط±ظٹط© (ظ…ط«ظ„ eBay)

**ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©:**
- `frontend/web-app/src/components/home/TrendingProducts.tsx` (ط¬ط¯ظٹط¯)
- طھط­ط¯ظٹط« `frontend/web-app/src/pages/HomePage.tsx`

**ط§ظ„ظ…ظƒظˆظ†ط§طھ:**
```
- Section Title: "Trending on Mnbarh"
- Grid of circular product images (8-10 ظ…ظ†طھط¬ط§طھ)
- Product categories: Tech, Motors, Luxury, Collectibles, Home & Garden, Trading Cards, Health & Beauty
- Hover effects
- Click to category/search
```

**ط§ظ„ظˆظ‚طھ ط§ظ„ظ…طھظˆظ‚ط¹:** 1-2 ط³ط§ط¹ط©

---

#### 1.2 طھط­ط³ظٹظ† "Featured Categories" Section
**ط§ظ„ظˆطµظپ:** ط¥ط¶ط§ظپط© "The Future in Your Hands" section ظ…ط¹ طµظˆط± ط¯ط§ط¦ط±ظٹط©

**ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©:**
- طھط­ط¯ظٹط« `frontend/web-app/src/components/home/Categories.tsx`
- ط£ظˆ ط¥ظ†ط´ط§ط، `frontend/web-app/src/components/home/FeaturedCategories.tsx` (ط¬ط¯ظٹط¯)

**ط§ظ„ظ…ظƒظˆظ†ط§طھ:**
```
- Section Title: "The Future in Your Hands"
- Circular images for: Laptops, Computer parts, Smartphones, Enterprise networking, Tablets, Storage, Lenses
- Hover effects
- Navigation arrows (optional)
```

**ط§ظ„ظˆظ‚طھ ط§ظ„ظ…طھظˆظ‚ط¹:** 1 ط³ط§ط¹ط©

---

#### 1.3 طھط­ط³ظٹظ† "Live Deals" Carousel
**ط§ظ„ظˆطµظپ:** ط¥ط¶ط§ظپط© Navigation Arrows ظˆ Pause Button

**ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©:**
- طھط­ط¯ظٹط« `frontend/web-app/src/components/home/LiveDealsSection.tsx`

**ط§ظ„ظ…ظƒظˆظ†ط§طھ:**
```
- Previous/Next Arrows
- Pause/Play Button
- Dot indicators
- Auto-scroll functionality
```

**ط§ظ„ظˆظ‚طھ ط§ظ„ظ…طھظˆظ‚ط¹:** 1 ط³ط§ط¹ط©

---

#### 1.4 طھط­ط³ظٹظ† Footer
**ط§ظ„ظˆطµظپ:** طھط­ط¯ظٹط« Footer ظ„ظٹط·ط§ط¨ظ‚ eBay

**ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©:**
- طھط­ط¯ظٹط« `frontend/web-app/src/components/layout/Footer.tsx`

**ط§ظ„ظ…ظƒظˆظ†ط§طھ:**
```
- Multiple columns: Buy, Sell, Tools & apps, About, Help & Contact, Community
- Social Media Links
- Country/Region Selector
- Copyright & Legal Links
- Accessibility, Privacy, Terms of Use
```

**ط§ظ„ظˆظ‚طھ ط§ظ„ظ…طھظˆظ‚ط¹:** 1-2 ط³ط§ط¹ط§طھ

---

### **Priority 2: Product Page Improvements** (ط¹ط§ظ„ظٹ)

#### 2.1 طھط­ط³ظٹظ† Product Images Section
**ط§ظ„ظˆطµظپ:** طھط­ط³ظٹظ† ط¹ط±ط¶ ط§ظ„طµظˆط± ظˆط§ظ„طھظپط§ط¹ظ„ط§طھ

**ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©:**
- طھط­ط¯ظٹط« `frontend/web-app/src/pages/ProductPage.tsx`
- ط¥ظ†ط´ط§ط، `frontend/web-app/src/components/product/ProductImageGallery.tsx` (ط¬ط¯ظٹط¯)

**ط§ظ„ظ…ظƒظˆظ†ط§طھ:**
```
- Large main image
- Thumbnail gallery on left/bottom
- Navigation arrows
- Zoom functionality
- "In X carts" badge
- Video icon (if applicable)
```

**ط§ظ„ظˆظ‚طھ ط§ظ„ظ…طھظˆظ‚ط¹:** 1-2 ط³ط§ط¹ط§طھ

---

#### 2.2 طھط­ط³ظٹظ† Product Details Section
**ط§ظ„ظˆطµظپ:** طھط­ط³ظٹظ† ط¹ط±ط¶ طھظپط§طµظٹظ„ ط§ظ„ظ…ظ†طھط¬

**ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©:**
- طھط­ط¯ظٹط« `frontend/web-app/src/pages/ProductPage.tsx`
- ط¥ظ†ط´ط§ط، `frontend/web-app/src/components/product/ProductDetails.tsx` (ط¬ط¯ظٹط¯)

**ط§ظ„ظ…ظƒظˆظ†ط§طھ:**
```
- Product Title
- Seller Info (Name, Rating, Positive %, Contact Seller)
- Price (Current + Original + Discount %)
- Coupon Code Info
- Condition Badge
- Shipping Info
- Wishlist Button
- Add to Cart Button
- Similar Items Link
```

**ط§ظ„ظˆظ‚طھ ط§ظ„ظ…طھظˆظ‚ط¹:** 1-2 ط³ط§ط¹ط§طھ

---

#### 2.3 ط¥ط¶ط§ظپط© "Similar Items" Section
**ط§ظ„ظˆطµظپ:** ط¹ط±ط¶ ظ…ظ†طھط¬ط§طھ ظ…ط´ط§ط¨ظ‡ط©

**ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©:**
- ط¥ظ†ط´ط§ط، `frontend/web-app/src/components/product/SimilarItems.tsx` (ط¬ط¯ظٹط¯)

**ط§ظ„ظ…ظƒظˆظ†ط§طھ:**
```
- "Find similar items from [Seller]" section
- Seller store link
- Grid of similar products
- Product cards
```

**ط§ظ„ظˆظ‚طھ ط§ظ„ظ…طھظˆظ‚ط¹:** 1 ط³ط§ط¹ط©

---

### **Priority 3: Search Results Page Improvements** (ط¹ط§ظ„ظٹ)

#### 3.1 طھط­ط³ظٹظ† Left Sidebar Filters
**ط§ظ„ظˆطµظپ:** طھط­ط³ظٹظ† ط¹ط±ط¶ ط§ظ„ظپظ„ط§طھط±

**ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©:**
- طھط­ط¯ظٹط« `frontend/web-app/src/components/search/SearchFilters.tsx`

**ط§ظ„ظ…ظƒظˆظ†ط§طھ:**
```
- Category Filter (Expandable)
- Price Range Filter
- Condition Filter (New, Used, Refurbished)
- Seller Rating Filter
- Shipping Options Filter
- Item Location Filter
- More Filters (Expandable)
```

**ط§ظ„ظˆظ‚طھ ط§ظ„ظ…طھظˆظ‚ط¹:** 1-2 ط³ط§ط¹ط§طھ

---

#### 3.2 طھط­ط³ظٹظ† Search Results Display
**ط§ظ„ظˆطµظپ:** طھط­ط³ظٹظ† ط¹ط±ط¶ ظ†طھط§ط¦ط¬ ط§ظ„ط¨ط­ط«

**ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©:**
- طھط­ط¯ظٹط« `frontend/web-app/src/components/search/SearchResults.tsx`

**ط§ظ„ظ…ظƒظˆظ†ط§طھ:**
```
- Results count
- Save search button
- Filter tabs (All, Auction, Buy It Now)
- Sort options (Best Match, Price, Newest)
- View options (Grid/List)
- Product listings with all details
- Pagination
```

**ط§ظ„ظˆظ‚طھ ط§ظ„ظ…طھظˆظ‚ط¹:** 1-2 ط³ط§ط¹ط§طھ

---

#### 3.3 ط¥ط¶ط§ظپط© Sponsored Ads Section
**ط§ظ„ظˆطµظپ:** ط¥ط¶ط§ظپط© ظ‚ط³ظ… ط§ظ„ط¥ط¹ظ„ط§ظ†ط§طھ ط§ظ„ظ…ط¯ظپظˆط¹ط©

**ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©:**
- ط¥ظ†ط´ط§ط، `frontend/web-app/src/components/search/SponsoredAds.tsx` (ط¬ط¯ظٹط¯)

**ط§ظ„ظ…ظƒظˆظ†ط§طھ:**
```
- Sponsored ad banner
- Ad image
- Ad title
- Ad description
- "Shop now" button
- "Sponsored" label
```

**ط§ظ„ظˆظ‚طھ ط§ظ„ظ…طھظˆظ‚ط¹:** 30 ط¯ظ‚ظٹظ‚ط©

---

#### 3.4 ط¥ط¶ط§ظپط© Right Sidebar - Google Ads Column
**ط§ظ„ظˆطµظپ:** ط¥ط¶ط§ظپط© ط¹ط§ظ…ظˆط¯ Google Ads ط¹ظ„ظ‰ ط§ظ„ظٹظ…ظٹظ† (ظ…ط«ظ„ eBay)

**ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©:**
- ط¥ظ†ط´ط§ط، `frontend/web-app/src/components/search/GoogleAdsColumn.tsx` (ط¬ط¯ظٹط¯)
- ط¥ظ†ط´ط§ط، `frontend/web-app/src/components/search/PromotionBanner.tsx` (ط¬ط¯ظٹط¯)

**ط§ظ„ظ…ظƒظˆظ†ط§طھ:**
```
- Google Ads Section (Right Sidebar)
  - Ad Banner 1
  - Ad Banner 2
  - Ad Banner 3
  - "Sponsored" label
  - Ad images
  - Ad descriptions
  - "Learn More" buttons

- Promotion Banners
  - Credit card promotion
  - Other promotional banners
```

**ط§ظ„ظˆظ‚طھ ط§ظ„ظ…طھظˆظ‚ط¹:** 1 ط³ط§ط¹ط©

---

## ًں“ٹ ظ…ظ„ط®طµ ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©

### ظ…ظ„ظپط§طھ ط¬ط¯ظٹط¯ط© (11 ظ…ظ„ظپ):
1. `frontend/web-app/src/components/home/TrendingProducts.tsx`
2. `frontend/web-app/src/components/home/FeaturedCategories.tsx`
3. `frontend/web-app/src/components/product/ProductImageGallery.tsx`
4. `frontend/web-app/src/components/product/ProductDetails.tsx`
5. `frontend/web-app/src/components/product/SimilarItems.tsx`
6. `frontend/web-app/src/components/search/SponsoredAds.tsx`
7. `frontend/web-app/src/components/search/PromotionBanner.tsx`

### ظ…ظ„ظپط§طھ ظ„ظ„طھط­ط¯ظٹط« (7 ظ…ظ„ظپط§طھ):
1. `frontend/web-app/src/pages/HomePage.tsx`
2. `frontend/web-app/src/components/home/Categories.tsx`
3. `frontend/web-app/src/components/home/LiveDealsSection.tsx`
4. `frontend/web-app/src/components/layout/Footer.tsx`
5. `frontend/web-app/src/pages/ProductPage.tsx`
6. `frontend/web-app/src/components/search/SearchFilters.tsx`
7. `frontend/web-app/src/components/search/SearchResults.tsx`

---

## âڈ±ï¸ڈ ط§ظ„ظˆظ‚طھ ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…طھظˆظ‚ط¹

| ط§ظ„ط£ظˆظ„ظˆظٹط© | ط§ظ„ظ…ظ‡ظ…ط© | ط§ظ„ظˆظ‚طھ |
|---------|--------|------|
| Priority 1 | Homepage Improvements | 5-7 ط³ط§ط¹ط§طھ |
| Priority 2 | Product Page Improvements | 3-5 ط³ط§ط¹ط§طھ |
| Priority 3 | Search Results Improvements | 3-4 ط³ط§ط¹ط§طھ |
| **ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ** | **ط¬ظ…ظٹط¹ ط§ظ„طھط­ط³ظٹظ†ط§طھ** | **11-16 ط³ط§ط¹ط©** |

---

## ًںڑ€ ط®ط·ط© ط§ظ„طھظ†ظپظٹط° ط§ظ„ظ…ظ‚طھط±ط­ط©

### **ط§ظ„ظ…ط±ط­ظ„ط© 1: Homepage (ط§ظ„ظٹظˆظ…)** - 5-7 ط³ط§ط¹ط§طھ
1. ط¥ط¶ط§ظپط© Trending Products Section
2. طھط­ط³ظٹظ† Featured Categories
3. طھط­ط³ظٹظ† Live Deals Carousel
4. طھط­ط³ظٹظ† Footer

### **ط§ظ„ظ…ط±ط­ظ„ط© 2: Product Page (ط؛ط¯ط§ظ‹)** - 3-5 ط³ط§ط¹ط§طھ
1. طھط­ط³ظٹظ† Product Images Gallery
2. طھط­ط³ظٹظ† Product Details
3. ط¥ط¶ط§ظپط© Similar Items Section

### **ط§ظ„ظ…ط±ط­ظ„ط© 3: Search Results (ط¨ط¹ط¯ ط؛ط¯)** - 3-4 ط³ط§ط¹ط§طھ
1. طھط­ط³ظٹظ† Left Sidebar Filters
2. طھط­ط³ظٹظ† Search Results Display
3. ط¥ط¶ط§ظپط© Sponsored Ads
4. ط¥ط¶ط§ظپط© Right Sidebar Promotions

---

## âœ… ظ…ط¹ط§ظٹظٹط± ط§ظ„ظ†ط¬ط§ط­

- [ ] Homepage طھط·ط§ط¨ظ‚ eBay ط¨ظ†ط³ط¨ط© 95%+
- [ ] Product Page طھط·ط§ط¨ظ‚ eBay ط¨ظ†ط³ط¨ط© 90%+
- [ ] Search Results Page طھط·ط§ط¨ظ‚ eBay ط¨ظ†ط³ط¨ط© 90%+
- [ ] ط¬ظ…ظٹط¹ ط§ظ„طµظپط­ط§طھ responsive ط¹ظ„ظ‰ mobile/tablet/desktop
- [ ] Dark mode support
- [ ] Performance optimization
- [ ] Accessibility compliance

---

## ًں“‌ ظ…ظ„ط§ط­ط¸ط§طھ ط¥ط¶ط§ظپظٹط©

1. **Reusable Components:** ط§ط³طھط®ط¯ط§ظ… components ظ…ظˆط¬ظˆط¯ط© ظ‚ط¯ط± ط§ظ„ط¥ظ…ظƒط§ظ†
2. **Styling:** ط§ط³طھط®ط¯ط§ظ… Tailwind CSS ظ„ظ„طھظ†ط§ط³ظ‚
3. **State Management:** ط§ط³طھط®ط¯ط§ظ… Redux ظ„ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط´طھط±ظƒط©
4. **API Integration:** ط§ظ„طھط£ظƒط¯ ظ…ظ† ط±ط¨ط· ط¬ظ…ظٹط¹ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط¨ظ€ APIs
5. **Testing:** ط§ط®طھط¨ط§ط± ط¬ظ…ظٹط¹ ط§ظ„طµظپط­ط§طھ ط¹ظ„ظ‰ ط£ط¬ظ‡ط²ط© ظ…ط®طھظ„ظپط©

---

## ًںژ¨ Design Guidelines

- **Colors:** ط§ط³طھط®ط¯ط§ظ… ظ†ظپط³ ط§ظ„ط£ظ„ظˆط§ظ† ط§ظ„ظ…ظˆط¬ظˆط¯ط© ظپظٹ Mnbarh
- **Typography:** ط§ط³طھط®ط¯ط§ظ… ظ†ظپط³ ط§ظ„ط®ط·ظˆط· ط§ظ„ظ…ظˆط¬ظˆط¯ط©
- **Spacing:** ط§طھط¨ط§ط¹ ظ†ظپط³ ظ†ظ…ط· ط§ظ„ظ…ط³ط§ظپط§طھ
- **Icons:** ط§ط³طھط®ط¯ط§ظ… Heroicons (ظ…ظˆط¬ظˆط¯ ط¨ط§ظ„ظپط¹ظ„)
- **Animations:** ط¥ط¶ط§ظپط© hover effects ظˆ transitions ط³ظ„ط³ط©

---

## ًں”— ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ط±ط¬ط¹ظٹط©

- `frontend/web-app/src/pages/HomePage.tsx` - ط§ظ„طµظپط­ط© ط§ظ„ط£ظˆظ„ظ‰ ط§ظ„ط­ط§ظ„ظٹط©
- `frontend/web-app/src/pages/SearchPage.tsx` - طµظپط­ط© ط§ظ„ط¨ط­ط« ط§ظ„ط­ط§ظ„ظٹط©
- `frontend/web-app/src/pages/ProductPage.tsx` - طµظپط­ط© ط§ظ„ظ…ظ†طھط¬ ط§ظ„ط­ط§ظ„ظٹط©
- `frontend/web-app/src/components/product/ProductCard.tsx` - ط¨ط·ط§ظ‚ط© ط§ظ„ظ…ظ†طھط¬
- `frontend/web-app/src/components/layout/Footer.tsx` - ط§ظ„ظپظˆطھط± ط§ظ„ط­ط§ظ„ظٹ

---

## ًں“‍ ط§ظ„طھظˆط§طµظ„ ظˆط§ظ„ط¯ط¹ظ…

ظپظٹ ط­ط§ظ„ط© ظˆط¬ظˆط¯ ط£ظٹ ط§ط³طھظپط³ط§ط±ط§طھ ط£ظˆ ظ…ط´ط§ظƒظ„طŒ ظٹط±ط¬ظ‰ ط§ظ„طھظˆط§طµظ„ ظ…ط¹ ظپط±ظٹظ‚ ط§ظ„طھط·ظˆظٹط±.

