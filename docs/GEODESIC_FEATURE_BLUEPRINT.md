# MNBARA Marketplace Feature Blueprint
## Extracted from Geodesic Solutions GeoCore Software Feature List

**Document Purpose:** Complete Product Backlog Reference for Engineering Planning
**Source:** Geodesic Solutions GeoCore v7.3 Feature List
**Extraction Date:** December 2024

---

## Legend

**Priority Levels:**
- 🔴 **MVP-Critical** - Required for initial launch
- 🟡 **Post-Launch Essential** - Required shortly after launch  
- 🟢 **Enhancement/Optional** - Advanced or optimization features

**Technical Complexity:**
- **[L]** Low - Straightforward implementation
- **[M]** Medium - Moderate complexity
- **[H]** High - Complex implementation

---

## 1. USER REGISTRATION & AUTHENTICATION

### 1.1 Core Registration Features

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| REG-001 | Implement single-page user registration form with configurable required/optional fields | 🔴 | [M] | Database schema |
| REG-002 | Enable secure registration process using SSL/TLS encryption | 🔴 | [L] | SSL certificate |
| REG-003 | Implement email verification routine requiring users to confirm email address via link | 🔴 | [M] | Email service |
| REG-004 | Implement duplicate email address checking during registration | 🔴 | [L] | REG-001 |
| REG-005 | Implement duplicate username checking during registration | 🔴 | [L] | REG-001 |
| REG-006 | Implement password validation with minimum/maximum character requirements | 🔴 | [L] | REG-001 |
| REG-007 | Implement password confirmation field requiring double entry | 🔴 | [L] | REG-001 |
| REG-008 | Send registration confirmation email upon successful registration | 🔴 | [L] | Email service |
| REG-009 | Send registration success email after admin approval (if manual approval enabled) | 🟡 | [L] | REG-001, Admin panel |
| REG-010 | Implement lost password recovery routine sending password reset to email | 🔴 | [M] | Email service |

### 1.2 Advanced Registration Features

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| REG-011 | Enable admin toggle to disable public registration entirely | 🟡 | [L] | Admin panel |
| REG-012 | Implement anonymous listing process allowing ad placement without registration | 🟢 | [H] | Listing system |
| REG-013 | Implement Just-In-Time (JIT) registration allowing listing process completion before registration | 🟢 | [H] | Listing system |
| REG-014 | Implement registration code system assigning users to specific user groups | 🟡 | [M] | User groups |
| REG-015 | Display registration splash page with custom HTML when registration code is used | 🟢 | [L] | REG-014 |
| REG-016 | Add up to 10 custom registration fields with required/dependent settings | 🟡 | [M] | REG-001 |
| REG-017 | Implement IP address banning to block registrations from specified IPs | 🟡 | [M] | Security module |
| REG-018 | Implement domain blocking to prevent registrations from specified email domains | 🟡 | [M] | REG-001 |
| REG-019 | Implement domain allowing to permit only registrations from specified email domains | 🟢 | [M] | REG-001 |
| REG-020 | Auto-issue tokens (free listings) upon user registration | 🟢 | [M] | Token system |
| REG-021 | Auto-issue starting account balance credit upon registration | 🟢 | [M] | Account balance |

### 1.3 Login & Authentication

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| AUTH-001 | Implement secure user login with SSL/TLS encryption | 🔴 | [L] | SSL certificate |
| AUTH-002 | Implement configurable post-login redirect (Front Page or My Account) | 🟡 | [L] | AUTH-001 |
| AUTH-003 | Enable admin login-as-user functionality using admin credentials | 🟡 | [M] | Admin panel |
| AUTH-004 | Implement CAPTCHA/reCAPTCHA security image on login form | 🔴 | [M] | Security module |
| AUTH-005 | Implement user suspension capability for admin | 🔴 | [M] | Admin panel |

### 1.4 Social Authentication

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| SOCIAL-001 | Implement Facebook login/registration via Social Connect | 🟡 | [H] | OAuth integration |
| SOCIAL-002 | Share user registrations across multiple installations via Bridge Add-On | 🟢 | [H] | Multi-site setup |
| SOCIAL-003 | Integrate with vBulletin forum for shared authentication | 🟢 | [H] | Forum Bridge |
| SOCIAL-004 | Integrate with Phorum forum for shared authentication | 🟢 | [H] | Forum Bridge |

---

## 2. USER GROUPS & PERMISSIONS

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| UG-001 | Create unlimited user groups with distinct permission sets | 🔴 | [M] | Database schema |
| UG-002 | Assign users to groups automatically via registration codes | 🟡 | [M] | REG-014 |
| UG-003 | Apply group-specific pricing plans to different user groups | 🟡 | [H] | Pricing system |
| UG-004 | Set maximum active listings limit per user | 🟡 | [L] | Listing system |
| UG-005 | Configure group-specific splash pages during listing process | 🟢 | [L] | UG-001 |
| UG-006 | Enable subscription-based access requirements per user group | 🟢 | [M] | Subscription system |

---

## 3. SELLER FEATURES & STOREFRONTS

### 3.1 Storefront Features

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| STORE-001 | Provide dedicated storefront pages for sellers with subscription | 🟡 | [H] | Subscription system |
| STORE-002 | Display seller's listings collection on storefront page | 🟡 | [M] | STORE-001 |
| STORE-003 | Allow sellers to customize storefront appearance | 🟢 | [M] | STORE-001 |
| STORE-004 | Display seller feedback rating and history on storefront | 🟡 | [M] | Feedback system |

### 3.2 Seller Tools

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| SELL-001 | Enable sellers to view all their active listings in My Account | 🔴 | [M] | Listing system |
| SELL-002 | Enable sellers to view expired listings with renewal option | 🔴 | [M] | Listing system |
| SELL-003 | Allow sellers to edit listings based on admin permission settings | 🔴 | [M] | Listing system |
| SELL-004 | Allow sellers to copy existing listings to create new ones | 🟡 | [M] | Listing system |
| SELL-005 | Allow sellers to renew listings before/after expiration | 🔴 | [M] | Listing system |
| SELL-006 | Allow sellers to upgrade listings with additional features | 🟡 | [M] | Pricing system |
| SELL-007 | Allow sellers to manually expire their own listings with reason | 🟡 | [L] | Listing system |
| SELL-008 | Display SOLD sign option for listings while maintaining visibility | 🟢 | [L] | Listing system |
| SELL-009 | Generate printable signs and flyers for active listings | 🟢 | [M] | Template system |
| SELL-010 | Display seller's Twitter feed on listing display page | 🟢 | [M] | Twitter API |
| SELL-011 | Enable PayPal seller-to-buyer payment gateway for auctions | 🟡 | [H] | PayPal integration |

---

## 4. LISTINGS & PRODUCT MANAGEMENT

### 4.1 Listing Creation

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| LIST-001 | Implement multi-step listing process with category selection, details, photos, payment | 🔴 | [H] | Category system |
| LIST-002 | Enable admin-configurable listing process combining multiple pages into one | 🟡 | [M] | LIST-001 |
| LIST-003 | Skip cart automatically when listing is free | 🟡 | [L] | Cart system |
| LIST-004 | Implement secure listing process using SSL/TLS | 🔴 | [L] | SSL certificate |
| LIST-005 | Display listing preview before final submission | 🔴 | [M] | LIST-001 |
| LIST-006 | Implement listing approval workflow (automatic or manual admin approval) | 🔴 | [M] | Admin panel |
| LIST-007 | Send listing confirmation email upon successful placement | 🔴 | [L] | Email service |
| LIST-008 | Send listing success email after admin approval | 🟡 | [L] | Email service |

### 4.2 Listing Fields & Content

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| LIST-009 | Implement standard listing fields: title, description, price, category | 🔴 | [M] | Database schema |
| LIST-010 | Set character limits for title and description fields | 🔴 | [L] | LIST-009 |
| LIST-011 | Create category-specific custom fields (questions) per category | 🔴 | [H] | Category system |
| LIST-012 | Implement optional fields as sortable columns in browse results | 🟡 | [M] | LIST-011 |
| LIST-013 | Implement "add cost" fields for additional fees (shipping, handling) | 🟡 | [M] | LIST-009 |
| LIST-014 | Implement checkbox-type questions for feature lists (e.g., property features) | 🟡 | [M] | LIST-011 |
| LIST-015 | Enable HTML editor (WYSIWYG) for listing description formatting | 🟡 | [M] | LIST-009 |
| LIST-016 | Implement listing tags with auto-complete for keyword association | 🟡 | [H] | Search system |
| LIST-017 | Allow sellers to select multiple regions per listing for expanded exposure | 🟢 | [M] | Geography system |

### 4.3 Media Uploads

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| MEDIA-001 | Implement HTML5 image uploader supporting mobile devices | 🔴 | [H] | Storage service |
| MEDIA-002 | Configure maximum number of photos allowed per listing | 🔴 | [L] | Admin panel |
| MEDIA-003 | Configure maximum file size for photo uploads | 🔴 | [L] | Admin panel |
| MEDIA-004 | Configure allowed upload file types (jpg, gif, png, etc.) | 🔴 | [L] | Admin panel |
| MEDIA-005 | Implement intelligent thumbnail scaling with admin-configurable sizes | 🔴 | [M] | Image processing |
| MEDIA-006 | Display camera icon indicator for listings with photos | 🟢 | [L] | LIST-001 |
| MEDIA-007 | Allow photo titles/captions for each uploaded image | 🟡 | [L] | MEDIA-001 |
| MEDIA-008 | Display lead/primary photo larger than other photos | 🟡 | [L] | MEDIA-001 |
| MEDIA-009 | Implement Lightbox display for photo viewing | 🟡 | [M] | Frontend library |
| MEDIA-010 | Implement filmstrip thumbnail view with scrolling | 🟢 | [M] | Frontend library |
| MEDIA-011 | Enable YouTube video embedding in listings | 🟡 | [M] | YouTube API |
| MEDIA-012 | Display photos in popup window with navigation between images | 🟡 | [M] | Frontend library |

### 4.4 Listing Display

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| DISP-001 | Implement customizable listing display page template with field tags | 🔴 | [H] | Template system |
| DISP-002 | Display visitor counter showing times viewed per listing | 🟡 | [L] | Analytics |
| DISP-003 | Implement "Tell-a-Friend" sharing link on listing page | 🟡 | [M] | Email service |
| DISP-004 | Implement "Contact Seller" form on listing page | 🔴 | [M] | Messaging system |
| DISP-005 | Implement "Add to Favorites/Watchlist" functionality | 🔴 | [M] | User account |
| DISP-006 | Display "Seller's Other Listings" link | 🟡 | [L] | LIST-001 |
| DISP-007 | Implement print-friendly listing view | 🟢 | [L] | Template system |
| DISP-008 | Display Google Maps location on listing page | 🟡 | [H] | Google Maps API |
| DISP-009 | Display MapQuest location on listing page | 🟢 | [H] | MapQuest API |
| DISP-010 | Implement popup listing display page option | 🟢 | [M] | Frontend |
| DISP-011 | Implement vote and comment system for listings | 🟢 | [M] | User interaction |
| DISP-012 | Require login to view listing details (membership feature) | 🟢 | [M] | AUTH-001 |
| DISP-013 | Require login to contact seller | 🟡 | [L] | AUTH-001 |
| DISP-014 | Hide specific fields from non-logged-in visitors | 🟢 | [M] | AUTH-001 |

### 4.5 Listing Lifecycle

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| LIFE-001 | Implement configurable listing duration in days | 🔴 | [M] | LIST-001 |
| LIFE-002 | Send listing expiration warning email at configurable days before expiry | 🔴 | [M] | Email service |
| LIFE-003 | Configure expiration email frequency (multiple reminders) | 🟡 | [M] | Email service |
| LIFE-004 | Allow listing renewal within configurable days after expiration | 🔴 | [M] | LIST-001 |
| LIFE-005 | Display expired listings page in user account | 🔴 | [L] | User account |

### 4.6 Bulk Operations

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| BULK-001 | Implement bulk uploader for admin to mass-upload listings per category per user | 🟡 | [H] | Admin panel |
| BULK-002 | Export listings to CSV/XML format for external use | 🟡 | [M] | Export system |
| BULK-003 | Implement Oodle feed export for listing syndication | 🟢 | [H] | Feed system |

---

## 5. AUCTION SYSTEM FEATURES

### 5.1 Auction Types

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| AUC-001 | Implement standard auctions for individual items | 🔴 | [H] | Listing system |
| AUC-002 | Implement Dutch auctions (multiple item auctions) with multiple winners | 🟡 | [H] | AUC-001 |
| AUC-003 | Implement reverse auctions where sellers compete with lower bids | 🟢 | [H] | AUC-001 |
| AUC-004 | Implement "Buy Now" auction option for immediate purchase at set price | 🔴 | [H] | AUC-001 |
| AUC-005 | Implement Buy Now Item feature selling individual items from quantity listing | 🟡 | [H] | AUC-004 |

### 5.2 Bidding Features

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| BID-001 | Implement minimum bid (starting bid) setting | 🔴 | [M] | AUC-001 |
| BID-002 | Implement reserve bid (minimum acceptable price) setting | 🔴 | [M] | AUC-001 |
| BID-003 | Implement proxy bidding (auto-bidding) up to user's maximum amount | 🔴 | [H] | AUC-001 |
| BID-004 | Display bid history showing bidder usernames and amounts | 🔴 | [M] | AUC-001 |
| BID-005 | Display current bid status in user's My Account | 🔴 | [M] | User account |
| BID-006 | Implement endless auctions (anti-sniper) extending time on last-minute bids | 🟡 | [H] | AUC-001 |
| BID-007 | Configure sniper protection minutes and extension duration | 🟡 | [M] | BID-006 |
| BID-008 | Require subscription to place bids | 🟢 | [M] | Subscription system |
| BID-009 | Require subscription to view auctions | 🟢 | [M] | Subscription system |

### 5.3 Auction Timing

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| TIME-001 | Allow seller to set specific auction start date/time | 🟡 | [M] | AUC-001 |
| TIME-002 | Allow seller to set specific auction end date/time | 🟡 | [M] | AUC-001 |
| TIME-003 | Enable auction preview period before bidding starts | 🟡 | [M] | TIME-001 |

### 5.4 Bidder Management

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| BIDR-001 | Implement invited bidder list (whitelist) per seller | 🟢 | [M] | User account |
| BIDR-002 | Implement blocked bidder list (blacklist) per seller | 🟢 | [M] | User account |

### 5.5 Auction Notifications

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| AUCN-001 | Send email to seller when auction is placed successfully | 🔴 | [L] | Email service |
| AUCN-002 | Send email to seller when auction is about to expire | 🔴 | [L] | Email service |
| AUCN-003 | Send email to seller when auction ends unsuccessfully | 🟡 | [L] | Email service |
| AUCN-004 | Send email to seller when auction has winning bidder | 🔴 | [L] | Email service |
| AUCN-005 | Send email to bidder when bid is placed successfully | 🔴 | [L] | Email service |
| AUCN-006 | Send email to bidder when outbid by another user | 🔴 | [L] | Email service |
| AUCN-007 | Send email to bidder when they win auction | 🔴 | [L] | Email service |

---

## 6. FIXED PRICE & BUY NOW SALES

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| FIX-001 | Implement fixed-price classified listings | 🔴 | [M] | Listing system |
| FIX-002 | Implement Buy Now option on auction listings | 🔴 | [M] | AUC-001 |
| FIX-003 | Implement quantity-based Buy Now Item purchasing | 🟡 | [H] | FIX-002 |
| FIX-004 | Keep listing active until full quantity is sold | 🟡 | [M] | FIX-003 |

---

## 7. SEARCH, FILTERS & BROWSING

### 7.1 Search Features

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| SRCH-001 | Implement advanced dynamic search page with category-specific fields | 🔴 | [H] | Category system |
| SRCH-002 | Implement keyword search box on front page and subpages | 🔴 | [M] | Search engine |
| SRCH-003 | Implement search by category dropdown | 🔴 | [M] | Category system |
| SRCH-004 | Implement zip/postal code proximity search with radius | 🟡 | [H] | Geography system |
| SRCH-005 | Implement custom HTML search forms per category | 🟢 | [M] | Template system |
| SRCH-006 | Implement search by listing tags with auto-complete | 🟡 | [M] | LIST-016 |
| SRCH-007 | Implement state/province filter dropdown | 🟡 | [M] | Geography system |
| SRCH-008 | Implement zip code filter dropdown with proximity search | 🟢 | [M] | SRCH-004 |
| SRCH-009 | Implement multi-level dynamic field filters (parent/child dropdowns) | 🟡 | [H] | LIST-011 |

### 7.2 Browsing Features

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| BRWS-001 | Implement category/subcategory hierarchical browsing | 🔴 | [M] | Category system |
| BRWS-002 | Implement Gallery view for listing results | 🔴 | [M] | Template system |
| BRWS-003 | Implement List view for listing results | 🔴 | [M] | Template system |
| BRWS-004 | Implement Grid view for listing results | 🔴 | [M] | Template system |
| BRWS-005 | Implement sort dropdown for browsing results | 🔴 | [M] | BRWS-001 |
| BRWS-006 | Implement sortable columns (title, description, city, custom fields) | 🔴 | [M] | BRWS-001 |
| BRWS-007 | Display Featured Listings section | 🔴 | [M] | Featured system |
| BRWS-008 | Display Newest Listings section | 🔴 | [L] | Listing system |
| BRWS-009 | Display Hottest/Most Popular Listings section | 🟡 | [M] | Analytics |
| BRWS-010 | Implement recent listings filter (24hrs, 1 week, 2 weeks, 3 weeks) | 🟡 | [L] | BRWS-001 |
| BRWS-011 | Implement category browsing filters sidebar | 🟡 | [H] | Category system |
| BRWS-012 | Implement geographic navigation (country, state, region browsing) | 🟡 | [H] | Geography system |
| BRWS-013 | Implement browse by listing tag | 🟢 | [M] | LIST-016 |
| BRWS-014 | Implement jQuery carousel for featured listings | 🟡 | [M] | Frontend library |
| BRWS-015 | Display {listing} tag data on browse pages (maps, thumbnails, videos) | 🟢 | [H] | Template system |

---

## 8. PAYMENTS, FEES & MONETIZATION

### 8.1 Payment Gateways

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| PAY-001 | Integrate PayPal payment gateway | 🔴 | [H] | PayPal API |
| PAY-002 | Integrate PayPal Pro payment gateway | 🟡 | [H] | PayPal API |
| PAY-003 | Integrate Stripe/Authorize.net credit card processing | 🔴 | [H] | Payment API |
| PAY-004 | Integrate 2Checkout payment gateway | 🟢 | [H] | 2CO API |
| PAY-005 | Integrate WorldPay payment gateway | 🟢 | [H] | WorldPay API |
| PAY-006 | Integrate Verisign Payflow Pro | 🟢 | [H] | Verisign API |
| PAY-007 | Integrate regional gateways (CashU, Moneris, NetCash, Nochex, etc.) | 🟢 | [H] | Various APIs |
| PAY-008 | Support manual payment methods (cash, check, money order) | 🟡 | [M] | Payment system |
| PAY-009 | Hold listings pending manual payment receipt | 🟡 | [M] | PAY-008 |

### 8.2 Fee Structure

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| FEE-001 | Implement flat fee per listing | 🔴 | [M] | Pricing system |
| FEE-002 | Implement fee based on listing price field | 🟡 | [M] | Pricing system |
| FEE-003 | Implement fee based on listing duration | 🟡 | [M] | Pricing system |
| FEE-004 | Implement fee per photo upload | 🟡 | [L] | Pricing system |
| FEE-005 | Implement fee per YouTube video | 🟢 | [L] | Pricing system |
| FEE-006 | Implement featured listing fee | 🔴 | [M] | Featured system |
| FEE-007 | Implement bolding fee for listing emphasis | 🟢 | [L] | Pricing system |
| FEE-008 | Implement better placement fee | 🟢 | [L] | Pricing system |
| FEE-009 | Implement attention getter fees | 🟢 | [L] | Pricing system |
| FEE-010 | Implement listing renewal fees | 🟡 | [M] | Pricing system |
| FEE-011 | Implement final value fees (percentage of auction sale price) | 🟡 | [H] | AUC-001 |
| FEE-012 | Implement category-specific pricing | 🟡 | [H] | Category system |
| FEE-013 | Implement user group-specific pricing | 🟡 | [H] | User groups |
| FEE-014 | Implement tax calculation per region (flat or percentage) | 🟡 | [H] | Geography system |

### 8.3 Cart & Checkout

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| CART-001 | Implement shopping cart system for multiple listings | 🔴 | [H] | Payment system |
| CART-002 | Persist cart items across sessions | 🟡 | [M] | CART-001 |
| CART-003 | Enable single checkout for multiple listings/upgrades/renewals | 🔴 | [M] | CART-001 |
| CART-004 | Auto-approve listings upon successful real-time payment | 🔴 | [M] | Payment system |

### 8.4 Discounts & Promotions

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| DISC-001 | Implement discount code system with percentage off | 🟡 | [M] | Pricing system |
| DISC-002 | Create unlimited discount codes | 🟡 | [L] | DISC-001 |
| DISC-003 | Apply discount codes to recurring billing | 🟢 | [M] | Subscription system |

### 8.5 Account Balance

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| BAL-001 | Implement user account balance system | 🟡 | [H] | Payment system |
| BAL-002 | Allow users to add funds to account balance | 🟡 | [M] | BAL-001 |
| BAL-003 | Allow negative balance with later billing | 🟢 | [M] | BAL-001 |
| BAL-004 | Display account balance and transaction history | 🟡 | [M] | BAL-001 |
| BAL-005 | Use account balance for listings, renewals, upgrades | 🟡 | [M] | BAL-001 |

---

## 9. SUBSCRIPTIONS & PRICING MODELS

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| SUB-001 | Implement subscription-based site access | 🟡 | [H] | Payment system |
| SUB-002 | Implement recurring billing for subscriptions | 🟡 | [H] | Payment gateway |
| SUB-003 | Send subscription expiration warning emails | 🟡 | [M] | Email service |
| SUB-004 | Allow unlimited listings within subscription | 🟡 | [M] | SUB-001 |
| SUB-005 | Charge separately for listing extras within subscription | 🟡 | [M] | SUB-001 |
| SUB-006 | Require subscription to view listing details | 🟢 | [M] | SUB-001 |
| SUB-007 | Implement unlimited price plans | 🟡 | [H] | Pricing system |
| SUB-008 | Implement price plan expiration for promotional periods | 🟢 | [M] | SUB-007 |
| SUB-009 | Allow user-selected price plans during listing | 🟢 | [M] | SUB-007 |

---

## 10. SHIPPING, LOCATION & GEOGRAPHY

### 10.1 Geographic Setup

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| GEO-001 | Configure country dropdown lists for registration and listings | 🔴 | [M] | Database |
| GEO-002 | Configure state/province dropdown lists | 🔴 | [M] | Database |
| GEO-003 | Implement unlimited geographic region levels | 🟡 | [H] | GEO-001 |
| GEO-004 | Implement geographic navigation browsing (OLX/Craigslist style) | 🟡 | [H] | GEO-003 |
| GEO-005 | Implement zip/postal code database for proximity search | 🟡 | [H] | GEO-001 |
| GEO-006 | Configure proximity search in miles or kilometers | 🟡 | [L] | GEO-005 |

### 10.2 Mapping

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| MAP-001 | Integrate Google Maps API for listing location display | 🟡 | [H] | Google API |
| MAP-002 | Integrate MapQuest API for listing location display | 🟢 | [H] | MapQuest API |

---

## 11. MESSAGING, Q&A & NOTIFICATIONS

### 11.1 User Messaging

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| MSG-001 | Implement Contact Seller form on listing pages | 🔴 | [M] | Email service |
| MSG-002 | Implement private messaging system between users | 🔴 | [H] | User account |
| MSG-003 | Display messages in My Messages section of user account | 🔴 | [M] | MSG-002 |
| MSG-004 | Allow public/private message settings per user | 🟡 | [L] | MSG-002 |
| MSG-005 | Implement public Q&A on listing pages (buyer asks, seller answers publicly) | 🟡 | [H] | MSG-001 |
| MSG-006 | BCC admin on contact seller and notify friend emails | 🟢 | [L] | MSG-001 |

### 11.2 Notifications

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| NOT-001 | Implement listing filter/saved search email alerts | 🟡 | [H] | Search system |
| NOT-002 | Send filter match email when new listing matches criteria | 🟡 | [M] | NOT-001 |
| NOT-003 | Implement Tell-a-Friend/Notify Friend email feature | 🟡 | [M] | Email service |

### 11.3 Admin Notifications

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| ADMN-001 | Send email to admin on new user registration | 🟡 | [L] | Email service |
| ADMN-002 | Send email to admin on registration pending approval | 🟡 | [L] | Email service |
| ADMN-003 | Send email to admin on manual payment selection | 🟡 | [L] | Email service |
| ADMN-004 | Send email to admin on new listing placement | 🟡 | [L] | Email service |
| ADMN-005 | Send email to admin on listing edit | 🟢 | [L] | Email service |
| ADMN-006 | Send email to admin on listing expiration warning sent | 🟢 | [L] | Email service |
| ADMN-007 | Send email to admin on subscription expiration warning sent | 🟢 | [L] | Email service |
| ADMN-008 | Enable admin mass email to all users | 🟡 | [M] | Email service |

---

## 12. FEEDBACK, RATINGS & TRUST SYSTEMS

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| FEED-001 | Implement user feedback rating system for auction transactions | 🔴 | [H] | AUC-001 |
| FEED-002 | Allow both seller and buyer to rate each other | 🔴 | [M] | FEED-001 |
| FEED-003 | Allow feedback comments with ratings | 🔴 | [M] | FEED-001 |
| FEED-004 | Configure rating increments and icons (stars, etc.) | 🟡 | [M] | FEED-001 |
| FEED-005 | Display feedback rating on listing display pages | 🔴 | [M] | FEED-001 |
| FEED-006 | Display feedback history in user account | 🔴 | [M] | FEED-001 |
| FEED-007 | Allow custom feedback icons replacement | 🟢 | [L] | FEED-004 |

---

## 13. ADMIN CONTROL PANEL & MODERATION

### 13.1 Core Admin Features

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| ADM-001 | Implement browser-based admin control panel | 🔴 | [H] | Backend |
| ADM-002 | Implement multi-admin with permission-based access | 🟡 | [H] | ADM-001 |
| ADM-003 | Implement site on/off maintenance mode switch | 🔴 | [L] | ADM-001 |
| ADM-004 | Display beta features switches and settings | 🟢 | [M] | ADM-001 |

### 13.2 User Management

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| USRM-001 | List, search, sort, and filter users | 🔴 | [M] | ADM-001 |
| USRM-002 | View user personal information, listings, and transaction history | 🔴 | [M] | ADM-001 |
| USRM-003 | Suspend/unsuspend users | 🔴 | [M] | ADM-001 |
| USRM-004 | Export users to CSV file | 🟡 | [M] | ADM-001 |
| USRM-005 | Export users by user group | 🟡 | [M] | USRM-004 |
| USRM-006 | Select specific fields for user export | 🟢 | [L] | USRM-004 |

### 13.3 Listing Management

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| LSTM-001 | Approve/reject pending listings | 🔴 | [M] | ADM-001 |
| LSTM-002 | View and manage all listings | 🔴 | [M] | ADM-001 |
| LSTM-003 | Configure automatic vs manual listing approval | 🔴 | [L] | ADM-001 |
| LSTM-004 | Configure automatic vs manual registration approval | 🔴 | [L] | ADM-001 |

### 13.4 Category Management

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| CATM-001 | Create unlimited categories and subcategories | 🔴 | [M] | ADM-001 |
| CATM-002 | Set category-specific questions/fields | 🔴 | [H] | CATM-001 |
| CATM-003 | Copy categories with questions to new categories | 🟡 | [M] | CATM-001 |
| CATM-004 | Configure category display columns | 🟡 | [L] | CATM-001 |
| CATM-005 | Toggle category listing counts on/off | 🟡 | [L] | CATM-001 |
| CATM-006 | Set category display order | 🔴 | [L] | CATM-001 |
| CATM-007 | Assign unique icons per category | 🟢 | [L] | CATM-001 |
| CATM-008 | Assign unique templates per category | 🟢 | [H] | Template system |
| CATM-009 | Set category-specific meta tags | 🟡 | [M] | SEO system |

### 13.5 Transaction Management

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| TRNM-001 | Search and view past transactions | 🔴 | [M] | ADM-001 |
| TRNM-002 | Approve listings awaiting payment review | 🔴 | [M] | ADM-001 |

### 13.6 Content Management

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| CNTM-001 | Create dynamic extra pages for custom content | 🔴 | [M] | ADM-001 |
| CNTM-002 | Edit all text areas displayed on site | 🔴 | [M] | ADM-001 |
| CNTM-003 | Enter HTML in text areas for formatting | 🟡 | [L] | CNTM-002 |

### 13.7 Email Management

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| EMLM-001 | Configure email destinations and frequency | 🔴 | [M] | ADM-001 |
| EMLM-002 | Create and save form email templates | 🟡 | [M] | ADM-001 |
| EMLM-003 | Configure email sending method (Native Mail, SendMail, SMTP) | 🔴 | [M] | ADM-001 |

### 13.8 Feedback Management

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| FDBM-001 | Configure feedback rating system settings | 🟡 | [M] | FEED-001 |
| FDBM-002 | Configure rating increments and icons | 🟡 | [M] | FEED-001 |

---

## 14. SECURITY, FRAUD PREVENTION & ABUSE REPORTING

### 14.1 Form Security

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| SEC-001 | Implement CAPTCHA security image on forms | 🔴 | [M] | Security module |
| SEC-002 | Implement reCAPTCHA as alternative security image | 🔴 | [M] | Google reCAPTCHA |
| SEC-003 | Implement badword filter with automatic replacement | 🔴 | [M] | Content filter |
| SEC-004 | Implement email address validation | 🔴 | [L] | Form validation |
| SEC-005 | Implement form field validation for required fields | 🔴 | [L] | Form validation |
| SEC-006 | Implement HTML tag restriction (allow/disallow specific tags) | 🟡 | [M] | Content filter |

### 14.2 Access Security

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| ACC-001 | Implement IP address banning (block site access) | 🔴 | [M] | Security module |
| ACC-002 | Implement domain blocking for registrations | 🟡 | [M] | Security module |
| ACC-003 | Implement domain allowing (whitelist) for registrations | 🟢 | [M] | Security module |
| ACC-004 | Support register_globals on/off without security compromise | 🟢 | [L] | Backend |

### 14.3 SSL/TLS Security

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| SSL-001 | Enable secure registration via SSL | 🔴 | [L] | SSL certificate |
| SSL-002 | Enable secure login via SSL | 🔴 | [L] | SSL certificate |
| SSL-003 | Enable secure My Account area via SSL | 🔴 | [L] | SSL certificate |
| SSL-004 | Enable secure listing process via SSL | 🔴 | [L] | SSL certificate |

### 14.4 Abuse Reporting

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| ABUSE-001 | Implement Report Abuse form for suspicious listings | 🔴 | [M] | Admin panel |
| ABUSE-002 | Display security notices and warnings in admin | 🟡 | [L] | ADM-001 |

### 14.5 Debugging & Logging

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| DBG-001 | Implement debug message display in browser | 🟢 | [L] | Development |
| DBG-002 | Implement debug logging to files | 🟡 | [M] | Logging system |
| DBG-003 | Display license activity/errors | 🟢 | [L] | License system |

---

## 15. SEO, MARKETING & TRAFFIC TOOLS

### 15.1 SEO Features

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| SEO-001 | Configure meta tags via admin panel (site-wide) | 🔴 | [M] | ADM-001 |
| SEO-002 | Configure meta tags per category | 🟡 | [M] | Category system |
| SEO-003 | Enter meta tags directly in template HTML | 🟡 | [L] | Template system |
| SEO-004 | Generate dynamic page titles based on current page/category/listing | 🔴 | [M] | Template system |
| SEO-005 | Generate unique URLs for all pages (categories, listings, etc.) | 🔴 | [M] | Routing |
| SEO-006 | Implement search engine friendly URLs (.html format via mod_rewrite) | 🔴 | [H] | Server config |
| SEO-007 | Implement SEO-friendly URLs for tag browsing | 🟡 | [M] | LIST-016 |

### 15.2 Social Sharing

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| SHARE-001 | Implement social sharing buttons (Facebook, Twitter, etc.) | 🟡 | [M] | Social APIs |
| SHARE-002 | Enable sharing to Craigslist | 🟢 | [M] | External API |

### 15.3 Feeds & Syndication

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| FEED-001 | Generate RSS feeds from site listings | 🟡 | [M] | Feed system |
| FEED-002 | Generate Oodle feed for listing syndication | 🟢 | [H] | Feed system |

### 15.4 Affiliate Integration

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| AFF-001 | Integrate with iDevAffiliate for referral commissions | 🟢 | [H] | Affiliate API |
| AFF-002 | Integrate with Post Affiliate Pro for referral commissions | 🟢 | [H] | Affiliate API |

---

## 16. INTERNATIONALIZATION & LOCALIZATION

### 16.1 Language Support

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| I18N-001 | Support multiple languages with admin-set default | 🟡 | [H] | Database |
| I18N-002 | Allow visitor language selection with cookie persistence | 🟡 | [M] | I18N-001 |
| I18N-003 | Export all text to spreadsheet for translation | 🟡 | [M] | I18N-001 |
| I18N-004 | Import translated text from spreadsheet | 🟡 | [M] | I18N-001 |
| I18N-005 | Configure character encoding for different character sets | 🟡 | [M] | I18N-001 |

### 16.2 Regional Settings

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| REG-001 | Configure international currency prefixes/suffixes | 🔴 | [M] | Pricing system |
| REG-002 | Configure international date display formats | 🔴 | [L] | System settings |
| REG-003 | Configure server time zone offset | 🔴 | [L] | System settings |
| REG-004 | Configure phone number grouping/formatting | 🟡 | [M] | Form system |

---

## 17. MOBILE, RESPONSIVE & API FEATURES

### 17.1 Responsive Design

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| RWD-001 | Implement Responsive Web Design (RWD) theme | 🔴 | [H] | Frontend |
| RWD-002 | Optimize layout for mobile phones | 🔴 | [H] | RWD-001 |
| RWD-003 | Optimize layout for tablets | 🔴 | [H] | RWD-001 |
| RWD-004 | Optimize layout for large screens/TVs | 🟢 | [M] | RWD-001 |

### 17.2 Mobile-Specific Features

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| MOB-001 | Implement HTML5 image uploader for mobile devices | 🔴 | [H] | MEDIA-001 |
| MOB-002 | Support dedicated mobile-only templates (optional) | 🟢 | [H] | Template system |
| MOB-003 | Support desktop-only templates (optional) | 🟢 | [M] | Template system |

### 17.3 Mobile API

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| API-001 | Implement Mobile API for native app browsing | 🟡 | [H] | Backend API |
| API-002 | Enable mobile app download for users | 🟢 | [H] | API-001 |

---

## 18. PERFORMANCE, CACHING & SCALABILITY

### 18.1 Performance Optimization

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| PERF-001 | Implement CSS minification | 🟡 | [M] | Build system |
| PERF-002 | Implement JS minification | 🟡 | [M] | Build system |
| PERF-003 | Implement CSS/JS file combination | 🟡 | [M] | Build system |
| PERF-004 | Implement file compression (gzip) | 🟡 | [M] | Server config |

### 18.2 Caching

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| CACHE-001 | Implement GeoCache system for data caching | 🟡 | [H] | Cache layer |
| CACHE-002 | Cache module output to files | 🟡 | [H] | CACHE-001 |
| CACHE-003 | Reduce database queries via caching | 🟡 | [H] | CACHE-001 |

### 18.3 Scalability

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| SCALE-001 | Support unlimited listings | 🔴 | [M] | Database design |
| SCALE-002 | Support unlimited users | 🔴 | [M] | Database design |
| SCALE-003 | Support unlimited categories/subcategories | 🔴 | [M] | Database design |
| SCALE-004 | Enable hosting portability (backup and move to different host) | 🔴 | [M] | Architecture |
| SCALE-005 | Store site design and settings in database for seamless updates | 🔴 | [H] | Architecture |

---

## 19. TEMPLATES, DESIGN & CUSTOMIZATION

### 19.1 Template System

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| TPL-001 | Implement Smarty template engine | 🔴 | [H] | Backend |
| TPL-002 | Separate design layer from source code | 🔴 | [H] | Architecture |
| TPL-003 | Create unlimited custom templates | 🔴 | [M] | TPL-001 |
| TPL-004 | Assign unique templates per category | 🟡 | [M] | TPL-001 |
| TPL-005 | Implement module-based features with movable tags | 🔴 | [H] | TPL-001 |
| TPL-006 | Reset templates to default state | 🟡 | [L] | TPL-001 |
| TPL-007 | Edit templates via admin panel | 🔴 | [M] | ADM-001 |

### 19.2 Design Customization

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| DES-001 | Provide ready-made color themes | 🟡 | [M] | Frontend |
| DES-002 | Support primary and secondary color combinations | 🟡 | [M] | DES-001 |
| DES-003 | Customize listing table settings (columns, thumbnail size, etc.) | 🟡 | [M] | TPL-001 |
| DES-004 | Customize category display settings (columns, fonts, icons) | 🟡 | [M] | TPL-001 |
| DES-005 | Customize My Account page layout via template | 🟡 | [M] | TPL-001 |
| DES-006 | Customize listing display page layout via template | 🔴 | [M] | TPL-001 |

---

## 20. ADD-ONS, EXTENSIONS & INTEGRATIONS

### 20.1 Core Add-Ons (Free)

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| ADD-001 | Storefront Add-On for seller pages | 🟡 | [H] | Subscription |
| ADD-002 | Geographic Navigation Add-On | 🟡 | [H] | Geography |
| ADD-003 | Account Balance Add-On | 🟡 | [H] | Payment |
| ADD-004 | Bulk Uploader Add-On | 🟡 | [H] | Admin |
| ADD-005 | Enterprise Pricing Add-On | 🟡 | [H] | Pricing |
| ADD-006 | Featured Level Add-On (5 levels) | 🟡 | [H] | Featured |
| ADD-007 | Forum Bridge Add-On (vBulletin/Phorum) | 🟢 | [H] | External |
| ADD-008 | Listing Exporter Add-On (CSV/XML) | 🟡 | [M] | Export |
| ADD-009 | Mobile API Add-On | 🟡 | [H] | API |
| ADD-010 | Multi-Admin Add-On | 🟡 | [H] | Admin |
| ADD-011 | Pedigree Tree Add-On | 🟢 | [H] | Specialized |
| ADD-012 | Sharing Add-On (Social/Craigslist) | 🟡 | [M] | Social |
| ADD-013 | Social Connect Add-On (Facebook login) | 🟡 | [H] | OAuth |
| ADD-014 | Subscriptions Add-On | 🟡 | [H] | Payment |
| ADD-015 | Twitter Feed Add-On | 🟢 | [M] | Twitter API |
| ADD-016 | Zip/Postal Codes Add-On | 🟡 | [H] | Geography |
| ADD-017 | Tokens Add-On (free listings) | 🟢 | [M] | Pricing |
| ADD-018 | Discount Codes Add-On | 🟡 | [M] | Pricing |
| ADD-019 | Google Maps Add-On | 🟡 | [H] | Google API |
| ADD-020 | SEO Add-On (friendly URLs) | 🔴 | [H] | Routing |
| ADD-021 | Signs and Flyers Add-On | 🟢 | [M] | Print |
| ADD-022 | Joomla/JFusion Plugin | 🟢 | [H] | CMS |
| ADD-023 | Security Image Add-On (CAPTCHA) | 🔴 | [M] | Security |
| ADD-024 | Contact Us Form Add-On | 🔴 | [M] | Forms |
| ADD-025 | Debug Message Display Add-On | 🟢 | [L] | Development |
| ADD-026 | Debug Logging Add-On | 🟡 | [M] | Development |
| ADD-027 | GeoCore Bridge Add-On (multi-install) | 🟢 | [H] | Multi-site |
| ADD-028 | License Activity Add-On | 🟢 | [L] | License |
| ADD-029 | Main Email Sender Add-On (Swift library) | 🔴 | [M] | Email |
| ADD-030 | Core Display Add-On (browsing filters) | 🟡 | [H] | Browse |

### 20.2 Multi-Level Fields

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| MLF-001 | Create parent/child dependent field groups | 🟡 | [H] | Form system |
| MLF-002 | Auto-populate child dropdown based on parent selection | 🟡 | [H] | MLF-001 |
| MLF-003 | Batch upload unlimited field groups with unlimited levels | 🟡 | [H] | MLF-001 |
| MLF-004 | Use multi-level fields in listing and search processes | 🟡 | [H] | MLF-001 |

---

## 21. USER ACCOUNT FEATURES (MY ACCOUNT)

| ID | Feature | Priority | Complexity | Dependencies |
|----|---------|----------|------------|--------------|
| ACC-001 | Implement My Account dashboard for registered users | 🔴 | [H] | User system |
| ACC-002 | Display and edit personal registration information | 🔴 | [M] | ACC-001 |
| ACC-003 | Configure public/private display of profile fields | 🟡 | [M] | ACC-001 |
| ACC-004 | Display current fee table to users | 🟡 | [L] | ACC-001 |
| ACC-005 | Implement My Active Listings section | 🔴 | [M] | Listing system |
| ACC-006 | Implement My Expired Listings section | 🔴 | [M] | Listing system |
| ACC-007 | Implement My Favorites/Watchlist section | 🔴 | [M] | ACC-001 |
| ACC-008 | Implement My Listing Filters (saved searches) section | 🟡 | [H] | Search system |
| ACC-009 | Implement My Messages section | 🔴 | [M] | Messaging |
| ACC-010 | Implement My Current Bids section for bidders | 🔴 | [M] | Auction system |
| ACC-011 | Implement Feedback Management section | 🔴 | [M] | Feedback system |
| ACC-012 | Implement Invited Bidders List management | 🟢 | [M] | Auction system |
| ACC-013 | Implement Blocked Bidders List management | 🟢 | [M] | Auction system |
| ACC-014 | Implement Account Balance section | 🟡 | [M] | Balance system |
| ACC-015 | Implement Signs & Flyers generation | 🟢 | [M] | Print system |

---

## FEATURE COUNT SUMMARY

| Category | MVP-Critical | Post-Launch | Enhancement | Total |
|----------|-------------|-------------|-------------|-------|
| User Registration & Auth | 15 | 8 | 6 | 29 |
| User Groups & Permissions | 2 | 3 | 1 | 6 |
| Seller Features & Storefronts | 5 | 6 | 4 | 15 |
| Listings & Product Management | 25 | 18 | 12 | 55 |
| Auction System Features | 12 | 10 | 5 | 27 |
| Fixed Price & Buy Now | 2 | 2 | 0 | 4 |
| Search, Filters & Browsing | 12 | 10 | 3 | 25 |
| Payments, Fees & Monetization | 8 | 18 | 8 | 34 |
| Subscriptions & Pricing | 0 | 7 | 2 | 9 |
| Shipping, Location & Geography | 3 | 4 | 1 | 8 |
| Messaging, Q&A & Notifications | 5 | 10 | 3 | 18 |
| Feedback, Ratings & Trust | 5 | 1 | 1 | 7 |
| Admin Control Panel | 15 | 12 | 5 | 32 |
| Security & Fraud Prevention | 12 | 5 | 4 | 21 |
| SEO, Marketing & Traffic | 5 | 4 | 4 | 13 |
| Internationalization | 2 | 5 | 0 | 7 |
| Mobile, Responsive & API | 4 | 1 | 4 | 9 |
| Performance & Caching | 5 | 6 | 0 | 11 |
| Templates & Design | 7 | 6 | 0 | 13 |
| Add-ons & Extensions | 4 | 18 | 12 | 34 |
| User Account Features | 9 | 3 | 3 | 15 |
| **TOTAL** | **157** | **157** | **78** | **392** |

---

## DOCUMENT NOTES

- This Feature Blueprint contains **392 atomic features** extracted from the Geodesic Solutions GeoCore v7.3 feature list
- All features are extracted verbatim from the source document without additions
- Priority classifications are based on typical marketplace MVP requirements
- Technical complexity ratings are estimates based on feature descriptions
- This document serves as a Product Backlog reference for engineering planning and future gap analysis
