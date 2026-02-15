# Mnbara Platform - eBay-like UI Design Guide

> **Design Philosophy**: Modern, clean marketplace with focus on product discovery, trust signals, and seamless user experience.

---

## 🎨 Design System Tokens

### Color Palette
```
Primary:       #3665F3 (eBay Blue)
Secondary:     #E53238 (Action Red)
Success:       #16A34A
Warning:       #EAB308
Background:    #F5F5F5
Surface:       #FFFFFF
Text Primary:  #191919
Text Secondary:#707070
Border:        #E5E5E5
```

### Typography Scale
```
Heading XL:    text-3xl font-bold (32px)
Heading LG:    text-2xl font-semibold (24px)
Heading MD:    text-xl font-semibold (20px)
Body LG:       text-base (16px)
Body SM:       text-sm (14px)
Caption:       text-xs (12px)
```

---

## 1. Header Component

### Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│ ┌──────┐  ┌─────────────────────────────────┐  ┌────┐ ┌────┐ ┌────┐ │
│ │ LOGO │  │ 🔍 Search all categories...     │  │Bell│ │Cart│ │User│ │
│ └──────┘  └─────────────────────────────────┘  └────┘ └────┘ └────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ Electronics  Fashion  Home  Motors  Collectibles  Deals  Sell      │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy
```
Header/
├── TopBar (sticky)
│   ├── Logo
│   ├── SearchBar
│   │   ├── CategoryDropdown
│   │   ├── SearchInput
│   │   └── SearchButton
│   └── ActionIcons
│       ├── NotificationBell (with badge)
│       ├── CartIcon (with count)
│       └── UserMenu (dropdown)
├── NavBar
│   ├── CategoryLinks
│   └── SellButton (CTA)
└── MobileMenu (hamburger)
```

### Tailwind Classes

```html
<!-- Main Header Container -->
<header class="sticky top-0 z-50 bg-white shadow-sm">
  
  <!-- Top Bar -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16 gap-4">
      
      <!-- Logo -->
      <a href="/" class="flex-shrink-0">
        <img class="h-8 w-auto" src="logo.svg" alt="Mnbara" />
      </a>
      
      <!-- Search Bar -->
      <div class="flex-1 max-w-2xl">
        <div class="relative flex rounded-full border-2 border-blue-600 
                    focus-within:ring-2 focus-within:ring-blue-300 
                    overflow-hidden bg-white">
          
          <!-- Category Dropdown -->
          <select class="hidden sm:block pl-4 pr-2 py-2.5 text-sm 
                         bg-gray-100 border-r border-gray-200 
                         focus:outline-none cursor-pointer">
            <option>All Categories</option>
          </select>
          
          <!-- Search Input -->
          <input type="text" 
                 placeholder="Search for anything"
                 class="flex-1 px-4 py-2.5 text-sm focus:outline-none" />
          
          <!-- Search Button -->
          <button class="px-6 bg-blue-600 hover:bg-blue-700 
                         transition-colors">
            <svg class="w-5 h-5 text-white"><!-- search icon --></svg>
          </button>
        </div>
      </div>
      
      <!-- Action Icons -->
      <div class="flex items-center gap-2 sm:gap-4">
        <!-- Notification -->
        <button class="relative p-2 text-gray-600 hover:text-gray-900 
                       hover:bg-gray-100 rounded-full transition-colors">
          <svg class="w-6 h-6"><!-- bell icon --></svg>
          <span class="absolute top-0 right-0 w-4 h-4 bg-red-500 
                       text-white text-xs rounded-full flex 
                       items-center justify-center">3</span>
        </button>
        
        <!-- Cart -->
        <button class="relative p-2 text-gray-600 hover:text-gray-900 
                       hover:bg-gray-100 rounded-full transition-colors">
          <svg class="w-6 h-6"><!-- cart icon --></svg>
          <span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 
                       text-white text-xs rounded-full flex 
                       items-center justify-center">2</span>
        </button>
        
        <!-- User Menu -->
        <div class="relative">
          <button class="flex items-center gap-2 p-2 text-gray-600 
                         hover:text-gray-900 rounded-lg 
                         hover:bg-gray-100 transition-colors">
            <div class="w-8 h-8 bg-gray-200 rounded-full flex 
                        items-center justify-center">
              <svg class="w-5 h-5"><!-- user icon --></svg>
            </div>
            <span class="hidden md:block text-sm font-medium">Sign In</span>
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Navigation Bar -->
  <nav class="hidden md:block border-t border-gray-100 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <ul class="flex items-center gap-6 h-12 text-sm">
        <li><a href="#" class="text-gray-700 hover:text-blue-600 
                               hover:underline transition-colors">Electronics</a></li>
        <li><a href="#" class="text-gray-700 hover:text-blue-600 
                               hover:underline">Fashion</a></li>
        <li><a href="#" class="text-gray-700 hover:text-blue-600 
                               hover:underline">Home & Garden</a></li>
        <li><a href="#" class="text-gray-700 hover:text-blue-600 
                               hover:underline">Motors</a></li>
        <li><a href="#" class="text-gray-700 hover:text-blue-600 
                               hover:underline">Collectibles</a></li>
        <li><a href="#" class="font-semibold text-red-600 
                               hover:underline">Deals</a></li>
        <li class="ml-auto">
          <a href="#" class="px-4 py-1.5 bg-gray-900 text-white 
                             rounded-full text-sm font-medium 
                             hover:bg-gray-800 transition-colors">Sell</a>
        </li>
      </ul>
    </div>
  </nav>
</header>
```

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| **Mobile** (`< 640px`) | Hide category dropdown, collapse nav to hamburger menu, stack search below logo |
| **Tablet** (`640px - 1024px`) | Show category dropdown, hide "Sign In" text, show nav links |
| **Desktop** (`> 1024px`) | Full layout with all elements visible |

---

## 2. Search Results Component

### Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│ Showing 1-48 of 10,000+ results for "wireless headphones"          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                             │
│ │ Sort: ▼  │ │ Filter ▼ │ │ View: ≡☷ │                             │
│ └──────────┘ └──────────┘ └──────────┘                             │
├─────────────────┬───────────────────────────────────────────────────┤
│                 │                                                   │
│   FILTERS       │   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │
│   ─────────     │   │ Card│ │ Card│ │ Card│ │ Card│               │
│   □ Category    │   └─────┘ └─────┘ └─────┘ └─────┘               │
│   □ Price       │   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │
│   □ Condition   │   │ Card│ │ Card│ │ Card│ │ Card│               │
│   □ Brand       │   └─────┘ └─────┘ └─────┘ └─────┘               │
│   □ Location    │                                                   │
│                 │   [ 1 ] [ 2 ] [ 3 ] ... [ Next > ]               │
└─────────────────┴───────────────────────────────────────────────────┘
```

### Component Hierarchy
```
SearchResults/
├── SearchHeader
│   ├── ResultCount
│   ├── SortDropdown
│   ├── FilterToggle (mobile)
│   └── ViewToggle (grid/list)
├── ContentArea
│   ├── FilterSidebar
│   │   ├── CategoryFilter (accordion)
│   │   ├── PriceRange (slider)
│   │   ├── ConditionFilter (checkboxes)
│   │   ├── BrandFilter (searchable list)
│   │   └── LocationFilter
│   └── ProductGrid
│       └── ProductCard[] (see below)
└── Pagination
    ├── PageNumbers
    └── NextPrevButtons
```

### Tailwind Classes

```html
<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
  
  <!-- Search Header -->
  <div class="flex flex-col sm:flex-row sm:items-center 
              justify-between gap-4 mb-6">
    
    <!-- Result Count -->
    <p class="text-sm text-gray-600">
      Showing <span class="font-semibold">1-48</span> of 
      <span class="font-semibold">10,000+</span> results for 
      "<span class="text-gray-900">wireless headphones</span>"
    </p>
    
    <!-- Controls -->
    <div class="flex items-center gap-3">
      <!-- Sort Dropdown -->
      <select class="text-sm border border-gray-300 rounded-lg 
                     px-3 py-2 focus:ring-2 focus:ring-blue-500 
                     focus:border-blue-500">
        <option>Best Match</option>
        <option>Price: Low to High</option>
        <option>Price: High to Low</option>
        <option>Newest First</option>
      </select>
      
      <!-- Filter Button (Mobile) -->
      <button class="lg:hidden flex items-center gap-2 px-3 py-2 
                     border border-gray-300 rounded-lg text-sm 
                     hover:bg-gray-50">
        <svg class="w-4 h-4"><!-- filter icon --></svg>
        Filters
      </button>
      
      <!-- View Toggle -->
      <div class="hidden sm:flex border border-gray-300 rounded-lg 
                  overflow-hidden">
        <button class="p-2 bg-blue-600 text-white">
          <svg class="w-4 h-4"><!-- grid icon --></svg>
        </button>
        <button class="p-2 hover:bg-gray-100 text-gray-600">
          <svg class="w-4 h-4"><!-- list icon --></svg>
        </button>
      </div>
    </div>
  </div>
  
  <!-- Content Grid -->
  <div class="flex gap-6">
    
    <!-- Filter Sidebar -->
    <aside class="hidden lg:block w-64 flex-shrink-0">
      <div class="sticky top-24 space-y-6">
        
        <!-- Filter Section Template -->
        <div class="border-b border-gray-200 pb-4">
          <button class="flex items-center justify-between w-full 
                         text-left font-semibold text-gray-900 mb-3">
            Category
            <svg class="w-4 h-4 transform transition-transform">
              <!-- chevron -->
            </svg>
          </button>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm 
                          text-gray-700 cursor-pointer hover:text-gray-900">
              <input type="checkbox" class="w-4 h-4 text-blue-600 
                                            border-gray-300 rounded 
                                            focus:ring-blue-500" />
              Headphones (5,234)
            </label>
            <!-- more options... -->
          </div>
        </div>
        
        <!-- Price Range -->
        <div class="border-b border-gray-200 pb-4">
          <h3 class="font-semibold text-gray-900 mb-3">Price</h3>
          <div class="flex items-center gap-2">
            <input type="number" placeholder="Min" 
                   class="w-full px-3 py-2 text-sm border 
                          border-gray-300 rounded-lg" />
            <span class="text-gray-500">to</span>
            <input type="number" placeholder="Max" 
                   class="w-full px-3 py-2 text-sm border 
                          border-gray-300 rounded-lg" />
          </div>
        </div>
        
        <!-- Condition -->
        <div class="border-b border-gray-200 pb-4">
          <h3 class="font-semibold text-gray-900 mb-3">Condition</h3>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="condition" 
                     class="w-4 h-4 text-blue-600" />
              New
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="condition" 
                     class="w-4 h-4 text-blue-600" />
              Used
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="condition" 
                     class="w-4 h-4 text-blue-600" />
              Refurbished
            </label>
          </div>
        </div>
      </div>
    </aside>
    
    <!-- Product Grid -->
    <div class="flex-1">
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <!-- ProductCard components go here -->
      </div>
      
      <!-- Pagination -->
      <nav class="mt-8 flex items-center justify-center gap-1">
        <button class="px-3 py-2 text-sm text-gray-500 
                       hover:bg-gray-100 rounded-lg disabled:opacity-50">
          Previous
        </button>
        <button class="px-3 py-2 text-sm bg-blue-600 text-white 
                       rounded-lg">1</button>
        <button class="px-3 py-2 text-sm text-gray-700 
                       hover:bg-gray-100 rounded-lg">2</button>
        <button class="px-3 py-2 text-sm text-gray-700 
                       hover:bg-gray-100 rounded-lg">3</button>
        <span class="px-2 text-gray-500">...</span>
        <button class="px-3 py-2 text-sm text-gray-700 
                       hover:bg-gray-100 rounded-lg">99</button>
        <button class="px-3 py-2 text-sm text-gray-700 
                       hover:bg-gray-100 rounded-lg">
          Next
        </button>
      </nav>
    </div>
  </div>
</main>
```

### Responsive Behavior

| Breakpoint | Grid Columns | Filters | Behavior |
|------------|--------------|---------|----------|
| **Mobile** (`< 640px`) | 2 columns | Modal/drawer | Filter button triggers slide-out panel |
| **Tablet** (`640px - 1024px`) | 3 columns | Modal/drawer | Filter remains in drawer |
| **Desktop** (`> 1024px`) | 4 columns | Sidebar (sticky) | Full sidebar visible |

---

## 3. Product Card Component

### Structure
```
┌─────────────────────────────┐
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │        IMAGE            │ │  ← Aspect ratio 1:1
│ │                         │ │
│ │  [♡]           [SALE]   │ │  ← Wishlist + Badge overlay
│ └─────────────────────────┘ │
│                             │
│ Sony WH-1000XM5 Wireless... │  ← Title (2 lines max)
│                             │
│ ★★★★☆ (2,847)               │  ← Rating + Reviews
│                             │
│ $278.00  $349.00            │  ← Price + Original (struck)
│                             │
│ Free shipping               │  ← Shipping info
│ 🔥 234 sold                 │  ← Social proof
└─────────────────────────────┘
```

### Component Hierarchy
```
ProductCard/
├── ImageContainer
│   ├── ProductImage
│   ├── WishlistButton (top-right)
│   ├── BadgeOverlay (sale, sponsored)
│   └── ImageCarousel (optional hover)
├── ContentArea
│   ├── Title
│   ├── RatingStars + ReviewCount
│   ├── PriceBlock
│   │   ├── CurrentPrice
│   │   ├── OriginalPrice (optional)
│   │   └── DiscountBadge (optional)
│   ├── ShippingInfo
│   └── SocialProof (sold count)
└── QuickActions (hover)
    ├── AddToCart
    └── QuickView
```

### Tailwind Classes

```html
<!-- Product Card -->
<article class="group bg-white rounded-xl border border-gray-100 
                overflow-hidden hover:shadow-lg hover:border-gray-200 
                transition-all duration-200 cursor-pointer">
  
  <!-- Image Container -->
  <div class="relative aspect-square overflow-hidden bg-gray-100">
    <!-- Product Image -->
    <img src="product.jpg" alt="Product Name"
         class="w-full h-full object-cover group-hover:scale-105 
                transition-transform duration-300" />
    
    <!-- Wishlist Button -->
    <button class="absolute top-3 right-3 w-8 h-8 bg-white/90 
                   backdrop-blur-sm rounded-full flex items-center 
                   justify-center shadow-sm hover:bg-white 
                   hover:scale-110 transition-all
                   opacity-0 group-hover:opacity-100">
      <svg class="w-5 h-5 text-gray-600 hover:text-red-500">
        <!-- heart icon -->
      </svg>
    </button>
    
    <!-- Badge (Sale/Sponsored) -->
    <div class="absolute top-3 left-3">
      <span class="px-2 py-1 bg-red-500 text-white text-xs 
                   font-semibold rounded">SALE</span>
    </div>
    
    <!-- Quick Actions (Hover) -->
    <div class="absolute bottom-0 left-0 right-0 p-3 
                bg-gradient-to-t from-black/50 to-transparent
                opacity-0 group-hover:opacity-100 
                translate-y-2 group-hover:translate-y-0
                transition-all duration-200">
      <button class="w-full py-2 bg-blue-600 text-white text-sm 
                     font-medium rounded-lg hover:bg-blue-700 
                     transition-colors">
        Add to Cart
      </button>
    </div>
  </div>
  
  <!-- Content Area -->
  <div class="p-4">
    <!-- Title -->
    <h3 class="text-sm font-medium text-gray-900 line-clamp-2 
               mb-2 group-hover:text-blue-600 transition-colors">
      Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones
    </h3>
    
    <!-- Rating -->
    <div class="flex items-center gap-1 mb-2">
      <div class="flex text-yellow-400">
        <svg class="w-4 h-4 fill-current"><!-- star --></svg>
        <svg class="w-4 h-4 fill-current"><!-- star --></svg>
        <svg class="w-4 h-4 fill-current"><!-- star --></svg>
        <svg class="w-4 h-4 fill-current"><!-- star --></svg>
        <svg class="w-4 h-4 text-gray-300 fill-current"><!-- star --></svg>
      </div>
      <span class="text-xs text-gray-500">(2,847)</span>
    </div>
    
    <!-- Price Block -->
    <div class="flex items-baseline gap-2 mb-2">
      <span class="text-lg font-bold text-gray-900">$278.00</span>
      <span class="text-sm text-gray-500 line-through">$349.00</span>
      <span class="text-xs font-semibold text-green-600 
                   bg-green-50 px-1.5 py-0.5 rounded">20% OFF</span>
    </div>
    
    <!-- Shipping Info -->
    <p class="text-xs text-green-600 font-medium mb-1">
      Free shipping
    </p>
    
    <!-- Social Proof -->
    <p class="text-xs text-gray-500 flex items-center gap-1">
      <span class="text-orange-500">🔥</span>
      <span class="font-medium">234 sold</span> in last 24 hours
    </p>
  </div>
</article>
```

### Card Variants

| Variant | Use Case | Key Differences |
|---------|----------|-----------------|
| **Compact** | Search grid | Smaller padding, no quick actions |
| **Featured** | Homepage carousel | Larger image, more badges |
| **List View** | Search list mode | Horizontal layout, description visible |
| **Auction** | Bidding items | Timer, bid count, current bid |

### Responsive Behavior

| Breakpoint | Card Sizing | Content Adjustments |
|------------|-------------|---------------------|
| **Mobile** | 50% width (2-col) | Smaller text, hide quick actions |
| **Tablet** | 33% width (3-col) | Standard sizing |
| **Desktop** | 25% width (4-col) | Full quick actions on hover |

---

## 4. Listing Page (Product Detail)

### Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│ Breadcrumb: Home > Electronics > Headphones > Sony                  │
├─────────────────────────────┬───────────────────────────────────────┤
│                             │                                       │
│   ┌───────────────────┐     │  Sony WH-1000XM5 Wireless...         │
│   │                   │     │                                       │
│   │    MAIN IMAGE     │     │  ★★★★☆ 4.8 (2,847 reviews)           │
│   │                   │     │                                       │
│   └───────────────────┘     │  ──────────────────────────           │
│   [▪][▪][▪][▪][▪]           │                                       │
│                             │  $278.00  $349.00  -20%               │
│                             │                                       │
│                             │  Color: [Black ▼]                     │
│                             │  Quantity: [ - ] 1 [ + ]              │
│                             │                                       │
│                             │  ┌─────────────────────────┐          │
│                             │  │     ADD TO CART         │          │
│                             │  └─────────────────────────┘          │
│                             │  ┌─────────────────────────┐          │
│                             │  │      BUY NOW            │          │
│                             │  └─────────────────────────┘          │
│                             │                                       │
│                             │  ✓ Free shipping                      │
│                             │  ✓ 30-day returns                     │
│                             │  🔒 Secure payment                    │
├─────────────────────────────┴───────────────────────────────────────┤
│ [Description] [Specifications] [Reviews] [Shipping]                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Product Description...                                             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  SIMILAR PRODUCTS                                                   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                           │
│  │     │ │     │ │     │ │     │ │     │                           │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy
```
ListingPage/
├── Breadcrumb
├── ProductSection
│   ├── ImageGallery
│   │   ├── MainImage (with zoom)
│   │   └── Thumbnails
│   └── ProductInfo
│       ├── Title
│       ├── RatingSection
│       ├── PriceBlock
│       ├── VariantSelector (color, size)
│       ├── QuantitySelector
│       ├── ActionButtons
│       │   ├── AddToCart (primary)
│       │   ├── BuyNow (secondary)
│       │   └── WishlistButton
│       └── TrustBadges
├── TabSection
│   ├── TabNavigation
│   └── TabContent
│       ├── Description
│       ├── Specifications
│       ├── Reviews
│       └── ShippingInfo
├── SellerInfo
│   ├── SellerBadge
│   ├── SellerRating
│   └── ContactButton
└── SimilarProducts (carousel)
```

### Tailwind Classes

```html
<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
  
  <!-- Breadcrumb -->
  <nav class="text-sm text-gray-500 mb-6">
    <ol class="flex items-center gap-2">
      <li><a href="#" class="hover:text-blue-600">Home</a></li>
      <li class="text-gray-300">/</li>
      <li><a href="#" class="hover:text-blue-600">Electronics</a></li>
      <li class="text-gray-300">/</li>
      <li><a href="#" class="hover:text-blue-600">Headphones</a></li>
      <li class="text-gray-300">/</li>
      <li class="text-gray-900">Sony WH-1000XM5</li>
    </ol>
  </nav>
  
  <!-- Product Section -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
    
    <!-- Image Gallery -->
    <div class="space-y-4">
      <!-- Main Image -->
      <div class="aspect-square bg-gray-100 rounded-2xl overflow-hidden 
                  relative group">
        <img src="main-image.jpg" alt="Product"
             class="w-full h-full object-contain cursor-zoom-in" />
        
        <!-- Zoom Lens (on hover) -->
        <div class="absolute inset-0 bg-white/80 opacity-0 
                    group-hover:opacity-100 transition-opacity 
                    pointer-events-none flex items-center 
                    justify-center">
          <span class="text-gray-600">Click to zoom</span>
        </div>
      </div>
      
      <!-- Thumbnails -->
      <div class="flex gap-3 overflow-x-auto pb-2">
        <button class="flex-shrink-0 w-20 h-20 rounded-lg 
                       overflow-hidden border-2 border-blue-600 
                       ring-2 ring-blue-200">
          <img src="thumb1.jpg" class="w-full h-full object-cover" />
        </button>
        <button class="flex-shrink-0 w-20 h-20 rounded-lg 
                       overflow-hidden border border-gray-200 
                       hover:border-blue-600 transition-colors">
          <img src="thumb2.jpg" class="w-full h-full object-cover" />
        </button>
        <!-- more thumbnails... -->
      </div>
    </div>
    
    <!-- Product Info -->
    <div class="lg:sticky lg:top-24 lg:self-start">
      <!-- Title -->
      <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
        Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones
      </h1>
      
      <!-- Rating -->
      <div class="flex items-center gap-3 mb-4">
        <div class="flex items-center gap-1">
          <div class="flex text-yellow-400">
            <!-- star icons -->
          </div>
          <span class="text-sm font-medium text-gray-900">4.8</span>
        </div>
        <a href="#reviews" class="text-sm text-blue-600 hover:underline">
          2,847 reviews
        </a>
        <span class="text-gray-300">|</span>
        <span class="text-sm text-gray-500">5,000+ sold</span>
      </div>
      
      <hr class="my-4 border-gray-200" />
      
      <!-- Price -->
      <div class="flex items-baseline gap-3 mb-6">
        <span class="text-3xl font-bold text-gray-900">$278.00</span>
        <span class="text-lg text-gray-500 line-through">$349.00</span>
        <span class="px-2 py-1 bg-red-100 text-red-700 text-sm 
                     font-semibold rounded">Save 20%</span>
      </div>
      
      <!-- Variants -->
      <div class="space-y-4 mb-6">
        <!-- Color Selector -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Color: <span class="text-gray-900">Black</span>
          </label>
          <div class="flex gap-2">
            <button class="w-10 h-10 rounded-full bg-gray-900 
                           ring-2 ring-blue-600 ring-offset-2">
            </button>
            <button class="w-10 h-10 rounded-full bg-gray-400 
                           border border-gray-300 
                           hover:ring-2 hover:ring-gray-400 
                           hover:ring-offset-2">
            </button>
            <button class="w-10 h-10 rounded-full bg-blue-800 
                           border border-gray-300 
                           hover:ring-2 hover:ring-blue-400 
                           hover:ring-offset-2">
            </button>
          </div>
        </div>
        
        <!-- Quantity Selector -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <div class="inline-flex items-center border border-gray-300 
                      rounded-lg">
            <button class="px-4 py-2 text-gray-600 hover:bg-gray-100 
                           transition-colors">−</button>
            <input type="number" value="1" 
                   class="w-16 text-center border-x border-gray-300 
                          py-2 focus:outline-none" />
            <button class="px-4 py-2 text-gray-600 hover:bg-gray-100 
                           transition-colors">+</button>
          </div>
          <span class="ml-3 text-sm text-green-600">In Stock (24 left)</span>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="space-y-3 mb-6">
        <button class="w-full py-4 bg-blue-600 text-white text-lg 
                       font-semibold rounded-full 
                       hover:bg-blue-700 transition-colors 
                       flex items-center justify-center gap-2 
                       shadow-lg shadow-blue-600/30">
          <svg class="w-5 h-5"><!-- cart icon --></svg>
          Add to Cart
        </button>
        <button class="w-full py-4 bg-gray-900 text-white text-lg 
                       font-semibold rounded-full 
                       hover:bg-gray-800 transition-colors">
          Buy Now
        </button>
        <button class="w-full py-3 border border-gray-300 text-gray-700 
                       font-medium rounded-full 
                       hover:bg-gray-50 transition-colors 
                       flex items-center justify-center gap-2">
          <svg class="w-5 h-5"><!-- heart icon --></svg>
          Add to Wishlist
        </button>
      </div>
      
      <!-- Trust Badges -->
      <div class="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
        <div class="text-center">
          <svg class="w-6 h-6 mx-auto text-green-600 mb-1">
            <!-- truck icon -->
          </svg>
          <p class="text-xs text-gray-600">Free Shipping</p>
        </div>
        <div class="text-center">
          <svg class="w-6 h-6 mx-auto text-green-600 mb-1">
            <!-- return icon -->
          </svg>
          <p class="text-xs text-gray-600">30-Day Returns</p>
        </div>
        <div class="text-center">
          <svg class="w-6 h-6 mx-auto text-green-600 mb-1">
            <!-- shield icon -->
          </svg>
          <p class="text-xs text-gray-600">Secure Payment</p>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Tab Section -->
  <div class="border-t border-gray-200 pt-8">
    <div class="border-b border-gray-200">
      <nav class="flex gap-8 overflow-x-auto">
        <button class="py-4 text-sm font-medium text-blue-600 
                       border-b-2 border-blue-600 whitespace-nowrap">
          Description
        </button>
        <button class="py-4 text-sm font-medium text-gray-600 
                       hover:text-gray-900 whitespace-nowrap">
          Specifications
        </button>
        <button class="py-4 text-sm font-medium text-gray-600 
                       hover:text-gray-900 whitespace-nowrap">
          Reviews (2,847)
        </button>
        <button class="py-4 text-sm font-medium text-gray-600 
                       hover:text-gray-900 whitespace-nowrap">
          Shipping & Returns
        </button>
      </nav>
    </div>
    
    <!-- Tab Content -->
    <div class="py-8 prose prose-gray max-w-none">
      <p class="text-gray-700 leading-relaxed">
        Experience unparalleled noise cancellation with the Sony WH-1000XM5. 
        Featuring industry-leading technology, these headphones deliver 
        exceptional sound quality with up to 30 hours of battery life...
      </p>
    </div>
  </div>
  
  <!-- Similar Products -->
  <section class="py-12 border-t border-gray-200">
    <h2 class="text-xl font-bold text-gray-900 mb-6">Similar Products</h2>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <!-- ProductCard components -->
    </div>
  </section>
</main>
```

### Responsive Behavior

| Breakpoint | Layout | Key Changes |
|------------|--------|-------------|
| **Mobile** (`< 768px`) | Single column, stacked | Image gallery full-width, info below, sticky CTA bar at bottom |
| **Tablet** (`768px - 1024px`) | Single column | Larger images, side-by-side buttons |
| **Desktop** (`> 1024px`) | Two-column grid | Gallery left, sticky info right |

---

## 5. Footer Component

### Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│ │ BUY        │ │ SELL       │ │ HELP       │ │ ABOUT      │        │
│ │ ─────────  │ │ ─────────  │ │ ─────────  │ │ ─────────  │        │
│ │ How to buy │ │ Start sell │ │ Contact us │ │ Company    │        │
│ │ Bidding    │ │ Fees       │ │ FAQ        │ │ Careers    │        │
│ │ Best deals │ │ Guidelines │ │ Community  │ │ Press      │        │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘        │
├─────────────────────────────────────────────────────────────────────┤
│ Get the App  ┌───────┐ ┌───────┐  Stay Connected [󰈌][󰗃][󰙯][󰌻]     │
│              │ App   │ │Google │                                    │
│              │ Store │ │ Play  │                                    │
│              └───────┘ └───────┘                                    │
├─────────────────────────────────────────────────────────────────────┤
│ © 2024 Mnbara Inc. | Terms | Privacy | Accessibility | Cookies     │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy
```
Footer/
├── MainFooter
│   ├── LinkColumns[]
│   │   ├── ColumnTitle
│   │   └── LinkList
│   ├── AppDownload
│   │   ├── Title
│   │   └── StoreButtons
│   └── SocialLinks
│       ├── Title
│       └── IconButtons
├── BottomBar
│   ├── Copyright
│   ├── LegalLinks
│   └── LocaleSelector (optional)
└── BackToTop (floating button)
```

### Tailwind Classes

```html
<footer class="bg-gray-900 text-gray-300">
  
  <!-- Main Footer -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
      
      <!-- Link Column: Buy -->
      <div>
        <h3 class="text-white font-semibold mb-4">Buy</h3>
        <ul class="space-y-3">
          <li>
            <a href="#" class="text-sm text-gray-400 hover:text-white 
                               transition-colors">Registration</a>
          </li>
          <li>
            <a href="#" class="text-sm text-gray-400 hover:text-white 
                               transition-colors">Bidding & Buying</a>
          </li>
          <li>
            <a href="#" class="text-sm text-gray-400 hover:text-white 
                               transition-colors">Deals</a>
          </li>
        </ul>
      </div>
      
      <!-- Link Column: Sell -->
      <div>
        <h3 class="text-white font-semibold mb-4">Sell</h3>
        <ul class="space-y-3">
          <li>
            <a href="#" class="text-sm text-gray-400 hover:text-white">
              Start Selling</a>
          </li>
          <li>
            <a href="#" class="text-sm text-gray-400 hover:text-white">
              Seller Center</a>
          </li>
          <li>
            <a href="#" class="text-sm text-gray-400 hover:text-white">
              Fees</a>
          </li>
        </ul>
      </div>
      
      <!-- Link Column: Help -->
      <div>
        <h3 class="text-white font-semibold mb-4">Help</h3>
        <ul class="space-y-3">
          <li>
            <a href="#" class="text-sm text-gray-400 hover:text-white">
              Contact Us</a>
          </li>
          <li>
            <a href="#" class="text-sm text-gray-400 hover:text-white">
              FAQ</a>
          </li>
          <li>
            <a href="#" class="text-sm text-gray-400 hover:text-white">
              Resolution Center</a>
          </li>
        </ul>
      </div>
      
      <!-- Link Column: About -->
      <div>
        <h3 class="text-white font-semibold mb-4">About</h3>
        <ul class="space-y-3">
          <li>
            <a href="#" class="text-sm text-gray-400 hover:text-white">
              Company Info</a>
          </li>
          <li>
            <a href="#" class="text-sm text-gray-400 hover:text-white">
              Careers</a>
          </li>
          <li>
            <a href="#" class="text-sm text-gray-400 hover:text-white">
              Investors</a>
          </li>
        </ul>
      </div>
      
      <!-- App Download -->
      <div class="col-span-2">
        <h3 class="text-white font-semibold mb-4">Get the App</h3>
        <div class="flex gap-3 mb-6">
          <a href="#" class="flex items-center gap-2 px-4 py-2 
                             bg-black border border-gray-700 rounded-lg 
                             hover:bg-gray-800 transition-colors">
            <svg class="w-6 h-6"><!-- apple icon --></svg>
            <div>
              <p class="text-xs text-gray-400">Download on the</p>
              <p class="text-sm font-medium text-white">App Store</p>
            </div>
          </a>
          <a href="#" class="flex items-center gap-2 px-4 py-2 
                             bg-black border border-gray-700 rounded-lg 
                             hover:bg-gray-800 transition-colors">
            <svg class="w-6 h-6"><!-- google play icon --></svg>
            <div>
              <p class="text-xs text-gray-400">Get it on</p>
              <p class="text-sm font-medium text-white">Google Play</p>
            </div>
          </a>
        </div>
        
        <!-- Social Links -->
        <h3 class="text-white font-semibold mb-4">Stay Connected</h3>
        <div class="flex gap-3">
          <a href="#" class="w-10 h-10 flex items-center justify-center 
                             bg-gray-800 rounded-full 
                             hover:bg-blue-600 transition-colors">
            <svg class="w-5 h-5"><!-- facebook --></svg>
          </a>
          <a href="#" class="w-10 h-10 flex items-center justify-center 
                             bg-gray-800 rounded-full 
                             hover:bg-sky-500 transition-colors">
            <svg class="w-5 h-5"><!-- twitter --></svg>
          </a>
          <a href="#" class="w-10 h-10 flex items-center justify-center 
                             bg-gray-800 rounded-full 
                             hover:bg-pink-600 transition-colors">
            <svg class="w-5 h-5"><!-- instagram --></svg>
          </a>
          <a href="#" class="w-10 h-10 flex items-center justify-center 
                             bg-gray-800 rounded-full 
                             hover:bg-blue-700 transition-colors">
            <svg class="w-5 h-5"><!-- linkedin --></svg>
          </a>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Bottom Bar -->
  <div class="border-t border-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col md:flex-row items-center 
                  justify-between gap-4">
        <p class="text-sm text-gray-500">
          © 2024 Mnbara Inc. All rights reserved.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4 
                    text-sm text-gray-500">
          <a href="#" class="hover:text-white transition-colors">
            Terms of Use</a>
          <a href="#" class="hover:text-white transition-colors">
            Privacy</a>
          <a href="#" class="hover:text-white transition-colors">
            Accessibility</a>
          <a href="#" class="hover:text-white transition-colors">
            Cookies</a>
        </div>
      </div>
    </div>
  </div>
</footer>

<!-- Back to Top Button -->
<button class="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white 
               rounded-full shadow-lg flex items-center justify-center 
               hover:bg-blue-700 transition-all 
               opacity-0 invisible 
               data-[visible=true]:opacity-100 
               data-[visible=true]:visible"
        data-visible="false">
  <svg class="w-5 h-5"><!-- chevron up --></svg>
</button>
```

### Responsive Behavior

| Breakpoint | Grid | Changes |
|------------|------|---------|
| **Mobile** (`< 640px`) | 2 columns | App download stacks, social icons smaller |
| **Tablet** (`640px - 1024px`) | 4 columns | App download inline, legal links wrap |
| **Desktop** (`> 1024px`) | 6 columns | Full layout, all inline |

---

## 📱 Global Responsive Patterns

### Breakpoint System
```css
/* Tailwind Default Breakpoints */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### Mobile-First Essentials

| Pattern | Mobile | Desktop |
|---------|--------|---------|
| **Navigation** | Hamburger menu | Full nav bar |
| **Search** | Full width, simplified | Full width with dropdown |
| **Product Grid** | 2 columns | 4-5 columns |
| **Filters** | Slide-out drawer | Persistent sidebar |
| **CTAs** | Sticky bottom bar | Inline buttons |
| **Footer** | Accordion sections | Full columns |

### Touch Considerations
- Minimum touch target: `48px × 48px` (w-12 h-12)
- Adequate spacing between interactive elements: `16px` (gap-4)
- Swipeable carousels for product galleries
- Pull-to-refresh on listings

---

## 🎯 Key Interaction States

```css
/* Hover */
hover:bg-gray-100     /* Subtle highlight */
hover:text-blue-600   /* Link color change */
hover:shadow-lg       /* Elevated cards */
hover:scale-105       /* Image zoom */

/* Focus */
focus:ring-2          /* Focus ring */
focus:ring-blue-500   /* Ring color */
focus:outline-none    /* Remove default outline */

/* Active */
active:scale-95       /* Button press */
active:bg-blue-700    /* Darker press state */

/* Disabled */
disabled:opacity-50   /* Faded appearance */
disabled:cursor-not-allowed

/* Loading */
animate-pulse         /* Skeleton loading */
animate-spin          /* Spinner */
```

---

## 🚀 Performance Tips

1. **Lazy load images**: Use `loading="lazy"` on `<img>` tags
2. **Skeleton loaders**: Use `animate-pulse` with gray boxes
3. **Infinite scroll**: Load more results on scroll vs. pagination on mobile
4. **Optimized images**: Use WebP format, appropriate sizes
5. **Critical CSS**: Inline above-the-fold styles

---

*Last Updated: December 2024*
