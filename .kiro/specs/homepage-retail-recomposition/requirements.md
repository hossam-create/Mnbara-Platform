# Requirements Document

## Introduction

Phase 2.9 - Homepage Retail Recomposition transforms the MNbarh homepage from a traditional marketplace layout into a modern, discovery-driven retail experience inspired by Walmart's clean, friendly approach. The goal is to make first-time users feel "This is easy, modern, and trustworthy" while preserving the marketplace DNA (auctions, community listings, crowdshipping) as secondary discovery elements.

This is a UI/UX-only transformation with no backend logic changes, no business model changes, and no removal of marketplace concepts.

## Glossary

- **Homepage**: The main landing page at `/` route displaying featured content and navigation
- **Hero_Section**: Full-width promotional banner at the top of the homepage with brand messaging and CTAs
- **Deals_Section**: Horizontal scrollable or grid section showcasing discounted products
- **Categories_Grid**: Icon-based grid layout for browsing product categories
- **Marketplace_Discovery_Block**: Card-based section highlighting marketplace features (Buy Now, Auctions, Community, Travel)
- **Trust_Strip**: Horizontal bar displaying trust and protection messaging
- **Mock_Data**: Static JSON data used for UI rendering without backend calls
- **CTA**: Call-to-action button or link prompting user interaction
- **MNbarh**: The platform brand name (formerly referenced as Mnbara)

## Requirements

### Requirement 1: Centralized Mock Data

**User Story:** As a developer, I want all homepage mock data centralized in a single file, so that I can easily maintain and update content without modifying component code.

#### Acceptance Criteria

1. THE Homepage_System SHALL store all mock data in `src/data/homepage.ts`
2. THE Mock_Data SHALL include hero content (title, subtitle, CTAs, background image)
3. THE Mock_Data SHALL include deals products (id, title, price, originalPrice, discount, image, shipping)
4. THE Mock_Data SHALL include categories (name, icon, slug, color)
5. THE Mock_Data SHALL include marketplace discovery cards (title, description, icon, link, color)
6. THE Mock_Data SHALL include trust badges (icon, title, description)
7. WHEN a component needs homepage data, THE Component SHALL import from `src/data/homepage.ts`

### Requirement 2: Hero Section Recomposition

**User Story:** As a first-time visitor, I want to see a welcoming, brand-focused hero section, so that I immediately understand what MNbarh offers and feel invited to explore.

#### Acceptance Criteria

1. THE Hero_Section SHALL display full-width with MNbarh brand colors (blue #0071DC primary)
2. THE Hero_Section SHALL include a headline that communicates value (e.g., "Discover. Shop. Save.")
3. THE Hero_Section SHALL include a subtitle explaining the marketplace benefit
4. THE Hero_Section SHALL display two CTAs: "Explore Deals" (primary) and "View Auctions" (secondary)
5. THE Hero_Section SHALL NOT display auction-specific messaging above the fold
6. THE Hero_Section SHALL use generous padding (py-16 or greater) for Walmart-style spacing
7. WHEN rendered on desktop, THE Hero_Section SHALL display a promotional image on the right side
8. THE Hero_Section SHALL use `rounded-lg` buttons consistent with Phase 2.8 styling

### Requirement 3: Deals Section

**User Story:** As a shopper, I want to see today's best deals prominently displayed, so that I can quickly find discounted products.

#### Acceptance Criteria

1. THE Deals_Section SHALL display with heading "Top Deals Today"
2. THE Deals_Section SHALL show products in a horizontal scroll or 4-5 column grid
3. WHEN a product has a discount, THE Deals_Section SHALL display a discount badge (e.g., "30% OFF")
4. THE Deals_Section SHALL emphasize the sale price with strikethrough on original price
5. THE Deals_Section SHALL include a "See all deals" link
6. THE Deals_Section SHALL use `shadow-soft` on product cards consistent with Phase 2.8
7. THE Deals_Section SHALL display at least 5 deal products from mock data

### Requirement 4: Categories Grid with Icons

**User Story:** As a browser, I want to see visual category icons, so that I can quickly navigate to product types I'm interested in.

#### Acceptance Criteria

1. THE Categories_Grid SHALL display categories with icons (NOT text-only)
2. THE Categories_Grid SHALL include: Electronics, Fashion, Home & Garden, Vehicles, Collectibles, Travel & Trips, Deals
3. WHEN a category is hovered, THE Categories_Grid SHALL display a subtle hover effect (shadow or scale)
4. THE Categories_Grid SHALL use a responsive grid layout (3-4 columns on desktop)
5. THE Categories_Grid SHALL link each category to `/category/{slug}`
6. THE Categories_Grid SHALL use consistent icon sizing (48px or 64px)
7. THE Categories_Grid SHALL NOT use circular image thumbnails (use icons instead)

### Requirement 5: Marketplace Discovery Block

**User Story:** As a visitor, I want to discover the unique marketplace features, so that I understand MNbarh is more than a typical retail store.

#### Acceptance Criteria

1. THE Marketplace_Discovery_Block SHALL display 3-4 feature cards
2. THE Marketplace_Discovery_Block SHALL include: "Buy Now Products", "Live Auctions", "Community Listings", "Travel & Crowdshipping"
3. WHEN a card is clicked, THE Marketplace_Discovery_Block SHALL navigate to the relevant section
4. THE Marketplace_Discovery_Block SHALL use card-based layout with icons and descriptions
5. THE Marketplace_Discovery_Block SHALL NOT dominate above the fold (placed after Deals and Categories)
6. THE Marketplace_Discovery_Block SHALL use subtle background colors to differentiate cards
7. THE Marketplace_Discovery_Block SHALL preserve marketplace DNA without seller jargon

### Requirement 6: Trust & Protection Strip

**User Story:** As a cautious shopper, I want to see trust indicators, so that I feel confident shopping on MNbarh.

#### Acceptance Criteria

1. THE Trust_Strip SHALL display horizontally with 3-4 trust points
2. THE Trust_Strip SHALL include: "Buyer Protection", "Secure Payments", "Verified Sellers", "Escrow Support"
3. THE Trust_Strip SHALL use icons alongside text for visual appeal
4. THE Trust_Strip SHALL use a subtle background color (gray-50 or similar)
5. THE Trust_Strip SHALL be placed after the Marketplace Discovery Block
6. THE Trust_Strip SHALL NOT use aggressive marketing language

### Requirement 7: Homepage Layout Composition

**User Story:** As a user, I want the homepage sections to flow naturally, so that I can discover content progressively.

#### Acceptance Criteria

1. THE Homepage SHALL render sections in this order: Hero → Deals → Categories → Marketplace Discovery → Trust Strip
2. THE Homepage SHALL use consistent section spacing (py-12 or py-16)
3. THE Homepage SHALL use max-width container (1400px) for content alignment
4. THE Homepage SHALL NOT include "Recently Viewed" or "Recommended for You" sections (remove eBay patterns)
5. THE Homepage SHALL NOT include multiple product grids (consolidate to Deals only)
6. WHEN scrolling, THE Homepage SHALL feel spacious and uncluttered (Walmart-style)
7. THE Homepage SHALL import all data from centralized mock data file

### Requirement 8: Visual Consistency

**User Story:** As a user, I want the homepage to feel visually consistent with the rest of the site, so that my experience is cohesive.

#### Acceptance Criteria

1. THE Homepage SHALL use brand colors from tailwind.config.js (brand-blue, brand-yellow)
2. THE Homepage SHALL use Inter font family consistent with Phase 2.8
3. THE Homepage SHALL use `shadow-soft` and `shadow-medium` from Phase 2.8
4. THE Homepage SHALL use `rounded-lg` buttons (NOT rounded-full)
5. THE Homepage SHALL maintain retail-first visual hierarchy (Product > Price > Delivery)
6. THE Homepage SHALL NOT introduce new color variables or fonts

### Requirement 9: Scope Restrictions

**User Story:** As a developer, I want clear boundaries on what files can be modified, so that I don't accidentally break other parts of the application.

#### Acceptance Criteria

1. THE Implementation SHALL only modify files in: `src/pages/HomePage.tsx`, `src/components/home/*`, `src/data/homepage.ts`
2. THE Implementation SHALL NOT modify: SearchPage, ProductPage, Backend services, API routes, Routing configuration
3. THE Implementation SHALL NOT add new npm dependencies
4. THE Implementation SHALL NOT create new page routes
5. THE Implementation SHALL reuse existing components where possible (ProductCard, etc.)
6. IF new components are needed, THE Implementation SHALL place them in `src/components/home/`
