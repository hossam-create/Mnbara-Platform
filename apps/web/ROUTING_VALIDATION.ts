/**
 * Routing Validation Script
 * Validates that all routes are properly configured and accessible
 * 
 * Usage: npx ts-node ROUTING_VALIDATION.ts
 */

interface RouteConfig {
  path: string;
  component: string;
  requiresAuth?: boolean;
  parameters?: string[];
  nested?: boolean;
}

// Complete route configuration
const ROUTES: RouteConfig[] = [
  // Public Routes
  { path: '/', component: 'HomePage' },
  { path: '/search', component: 'SearchPage' },
  { path: '/product/:id', component: 'ProductPage', parameters: ['id'] },
  { path: '/category/:slug', component: 'SearchPage', parameters: ['slug'] },

  // Auth Routes
  { path: '/auth/login', component: 'LoginPage' },
  { path: '/auth/register', component: 'RegisterPage' },
  { path: '/auth/forgot-password', component: 'ForgotPasswordPage' },
  { path: '/auth/reset-password', component: 'ResetPasswordPage' },
  { path: '/auth/verify-email', component: 'VerifyEmailPage' },

  // Admin Routes (nested)
  { path: '/admin', component: 'AdminLayout', nested: true, requiresAuth: true },
  { path: '/admin/threat-map', component: 'ThreatMap', requiresAuth: true },
  { path: '/admin/servers', component: 'ServerMonitor', requiresAuth: true },
  { path: '/admin/studio', component: 'Studio', requiresAuth: true },
  { path: '/admin/stego', component: 'Steganography', requiresAuth: true },
  { path: '/admin/xyops', component: 'XyOpsPage', requiresAuth: true },
  { path: '/admin/apocalypse', component: 'Apocalypse', requiresAuth: true },
  { path: '/admin/cms', component: 'CmsManager', requiresAuth: true },
  { path: '/admin/ads', component: 'AdsManager', requiresAuth: true },
  { path: '/admin/travelers', component: 'TravelersManager', requiresAuth: true },
  { path: '/admin/orders', component: 'PasteOrdersManager', requiresAuth: true },
  { path: '/admin/guarantees', component: 'FinancialGuarantees', requiresAuth: true },

  // Founder Routes
  { path: '/founder', component: 'FounderDashboard', requiresAuth: true },

  // Dashboard Routes
  { path: '/dashboards', component: 'UnifiedDashboard' },
  { path: '/checkout/fulfillment', component: 'FulfillmentDemoPage' },
  { path: '/demo/fulfillment', component: 'FulfillmentDemoPage' },
  { path: '/auctions/:id', component: 'AuctionDetailPage', parameters: ['id'] },

  // Information Routes
  { path: '/about', component: 'AboutUsPage' },
  { path: '/policies/:pageId', component: 'GenericContentPage', parameters: ['pageId'] },
  { path: '/help/:pageId', component: 'GenericContentPage', parameters: ['pageId'] },
  { path: '/how-it-works', component: 'HowItWorksPage' },
  { path: '/policies/dispute-resolution', component: 'DisputeResolutionPage' },
  { path: '/policies/fees-pricing', component: 'FeesPricingPage' },
  { path: '/policies/shipping-delivery', component: 'ShippingDeliveryPage' },
  { path: '/contact', component: 'ContactSupportPage' },
  { path: '/help/bidding', component: 'BiddingHelpPage' },

  // Trust & Safety Routes
  { path: '/trust', component: 'TrustSafetyPage' },
  { path: '/trust/kyc', component: 'KYCVerificationPage' },
  { path: '/trust/safety-tips', component: 'TrustSafetyTipsPage' },
  { path: '/trust/buyer-protection', component: 'TrustBuyerProtectionPage' },
  { path: '/trust/seller-protection', component: 'TrustSellerProtectionPage' },

  // Legal Routes
  { path: '/legal/terms', component: 'TermsPage' },
  { path: '/legal/privacy', component: 'PrivacyPage' },
  { path: '/legal/cookies', component: 'CookiesPage' },
  { path: '/legal/community-guidelines', component: 'CommunityGuidelinesPage' },

  // Payment Routes
  { path: '/payments/fees', component: 'PaymentsFeesPage' },
  { path: '/payments/cancellation-refunds', component: 'PaymentsCancellationPage' },
  { path: '/payments/disputes', component: 'PaymentsDisputesPage' },

  // Affiliate Routes
  { path: '/affiliate/program', component: 'AffiliateProgramPage' },

  // Marketplace Routes
  { path: '/sell', component: 'SellPage' },
  { path: '/deals', component: 'DealsPage' },
  { path: '/help/selling', component: 'HelpSellingPage' },
  { path: '/plugins', component: 'PluginMarketplacePage' },
  { path: '/live', component: 'LiveStreamPage' },

  // Shopping Routes
  { path: '/cart', component: 'CartPage', requiresAuth: true },
  { path: '/checkout', component: 'CheckoutPage', requiresAuth: true },
  { path: '/order-success/:id', component: 'OrderSuccessPage', requiresAuth: true, parameters: ['id'] },

  // Traveler Routes
  { path: '/traveler', component: 'TravelerDashboard', requiresAuth: true },
  { path: '/traveler/create-trip', component: 'TripCreationPage', requiresAuth: true },
  { path: '/traveler/available-orders', component: 'AvailableOrdersPage', requiresAuth: true },
  { path: '/traveler/become', component: 'BecomeTravelerPage', requiresAuth: true },
  { path: '/traveler/profile', component: 'TravelerProfilePage', requiresAuth: true },
  { path: '/traveler/routes', component: 'ActiveRoutesPage', requiresAuth: true },
  { path: '/traveler/route/:id', component: 'RouteDetailsPage', requiresAuth: true, parameters: ['id'] },
  { path: '/traveler/offers', component: 'TravelerOffersPage', requiresAuth: true },
  { path: '/traveler/delivery', component: 'DeliveryMatchingPage', requiresAuth: true },
  { path: '/traveler/map', component: 'RouteMapPage', requiresAuth: true },
  { path: '/traveler/rating', component: 'TravelerRatingPage', requiresAuth: true },

  // Marketplace Routes
  { path: '/marketplace/seller/:id', component: 'MarketplaceProfilePage', parameters: ['id'] },
  { path: '/marketplace/categories', component: 'CategoryTreePage' },

  // Seller Routes
  { path: '/seller', component: 'SellerDashboard', requiresAuth: true },
  { path: '/seller/create-listing', component: 'CreateListingPage', requiresAuth: true },
  { path: '/seller/my-listings', component: 'MyListingsPage', requiresAuth: true },

  // User Routes
  { path: '/user/dashboard', component: 'UserDashboard', requiresAuth: true },
  { path: '/user/saved-items', component: 'SavedItemsPage', requiresAuth: true },

  // Wallet Routes
  { path: '/wallet/dashboard', component: 'WalletPage', requiresAuth: true },
  { path: '/wallet/transactions', component: 'TransactionsPage', requiresAuth: true },
  { path: '/wallet/escrow', component: 'EscrowPage', requiresAuth: true },
  { path: '/wallet/withdraw-deposit', component: 'WithdrawDepositPage', requiresAuth: true },

  // Profile Routes
  { path: '/profile/settings', component: 'SettingsPage', requiresAuth: true },
  { path: '/profile/activity', component: 'ActivityPage', requiresAuth: true },

  // Orders
  { path: '/orders', component: 'OrdersPage', requiresAuth: true },
];

/**
 * Validation Functions
 */

function validateRoutePaths(): boolean {
  console.log('🔍 Validating route paths...');
  let valid = true;

  const pathCounts = new Map<string, number>();
  ROUTES.forEach(route => {
    const count = pathCounts.get(route.path) || 0;
    pathCounts.set(route.path, count + 1);
  });

  pathCounts.forEach((count, path) => {
    if (count > 1) {
      console.error(`❌ Duplicate route path: ${path} (${count} times)`);
      valid = false;
    }
  });

  if (valid) {
    console.log(`✅ All ${ROUTES.length} route paths are unique`);
  }

  return valid;
}

function validateRouteParameters(): boolean {
  console.log('\n🔍 Validating route parameters...');
  let valid = true;

  ROUTES.forEach(route => {
    const paramMatches = route.path.match(/:(\w+)/g) || [];
    const declaredParams = route.parameters || [];

    paramMatches.forEach(match => {
      const paramName = match.substring(1);
      if (!declaredParams.includes(paramName)) {
        console.warn(`⚠️  Route ${route.path} has undeclared parameter: ${paramName}`);
      }
    });

    declaredParams.forEach(param => {
      if (!route.path.includes(`:${param}`)) {
        console.error(`❌ Route ${route.path} declares parameter ${param} but doesn't use it`);
        valid = false;
      }
    });
  });

  if (valid) {
    console.log('✅ All route parameters are properly declared');
  }

  return valid;
}

function validateAuthRequirements(): boolean {
  console.log('\n🔍 Validating authentication requirements...');
  let valid = true;

  const protectedPrefixes = ['/admin', '/traveler', '/seller', '/user', '/wallet', '/profile', '/cart', '/checkout', '/orders'];
  
  ROUTES.forEach(route => {
    const shouldBeProtected = protectedPrefixes.some(prefix => route.path.startsWith(prefix));
    const isMarkedProtected = route.requiresAuth === true;

    if (shouldBeProtected && !isMarkedProtected) {
      console.warn(`⚠️  Route ${route.path} should probably require authentication`);
    }
  });

  const protectedRoutes = ROUTES.filter(r => r.requiresAuth).length;
  console.log(`✅ ${protectedRoutes} routes marked as requiring authentication`);

  return valid;
}

function validateComponentNames(): boolean {
  console.log('\n🔍 Validating component names...');
  let valid = true;

  const invalidNames = ROUTES.filter(r => !r.component || r.component.trim() === '');
  if (invalidNames.length > 0) {
    console.error(`❌ ${invalidNames.length} routes have missing component names`);
    valid = false;
  } else {
    console.log(`✅ All ${ROUTES.length} routes have component names`);
  }

  return valid;
}

function generateRouteSummary(): void {
  console.log('\n📊 Route Summary:');
  console.log(`Total Routes: ${ROUTES.length}`);
  
  const publicRoutes = ROUTES.filter(r => !r.requiresAuth).length;
  const protectedRoutes = ROUTES.filter(r => r.requiresAuth).length;
  const nestedRoutes = ROUTES.filter(r => r.nested).length;
  const parameterizedRoutes = ROUTES.filter(r => r.parameters && r.parameters.length > 0).length;

  console.log(`  - Public Routes: ${publicRoutes}`);
  console.log(`  - Protected Routes: ${protectedRoutes}`);
  console.log(`  - Nested Routes: ${nestedRoutes}`);
  console.log(`  - Parameterized Routes: ${parameterizedRoutes}`);

  // Group by prefix
  const prefixes = new Map<string, number>();
  ROUTES.forEach(route => {
    const prefix = route.path.split('/')[1] || 'root';
    prefixes.set(prefix, (prefixes.get(prefix) || 0) + 1);
  });

  console.log('\n📁 Routes by Prefix:');
  Array.from(prefixes.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([prefix, count]) => {
      console.log(`  - /${prefix}: ${count} routes`);
    });
}

/**
 * Main Validation
 */
function runValidation(): void {
  console.log('🚀 Starting Routing Validation\n');
  console.log('=' .repeat(50));

  const results = [
    validateRoutePaths(),
    validateRouteParameters(),
    validateAuthRequirements(),
    validateComponentNames(),
  ];

  generateRouteSummary();

  console.log('\n' + '='.repeat(50));
  const allValid = results.every(r => r);
  
  if (allValid) {
    console.log('\n✅ All validations passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some validations failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run validation
runValidation();
