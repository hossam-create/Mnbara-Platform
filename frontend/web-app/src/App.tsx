import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { useAuth } from './hooks/useAuth';

// Canonical Pages
const HomePage = React.lazy(() => import('./pages/HomePage'));
const SearchPage = React.lazy(() => import('./pages/SearchPage'));
const ProductPage = React.lazy(() => import('./pages/ProductPage'));

// Auth pages
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPasswordPage'));

// Runtime check
const RuntimeCheckPage = React.lazy(() => import('./pages/RuntimeCheckPage'));

// Admin pages
const AdminLayout = React.lazy(() => import('./layouts/AdminLayout'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const CmsManager = React.lazy(() => import('./pages/admin/CmsManager'));
const AdsManager = React.lazy(() => import('./pages/admin/AdsManager'));
const TravelersManager = React.lazy(() => import('./pages/admin/TravelersManager'));
const PasteOrdersManager = React.lazy(() => import('./pages/admin/PasteOrdersManager'));
const FinancialGuarantees = React.lazy(() => import('./pages/admin/FinancialGuarantees'));

// Control Center pages (Merged into Admin)
const ControlCenterPage = React.lazy(() => import('./pages/control-center/ControlCenterPage'));
const ThreatMap = React.lazy(() => import('./pages/control-center/ThreatMap'));
const ServerMonitor = React.lazy(() => import('./pages/control-center/ServerMonitor'));
const Studio = React.lazy(() => import('./pages/control-center/Studio'));
const Steganography = React.lazy(() => import('./pages/control-center/Steganography'));
const Apocalypse = React.lazy(() => import('./pages/control-center/Apocalypse'));

// Utility Control Pages
const FinancePage = React.lazy(() => import('./pages/control-center/FinancePage'));

// Founder Dashboard
const FounderDashboard = React.lazy(() => import('./pages/founder/FounderDashboard'));

// Unified Dashboard
const UnifiedDashboard = React.lazy(() => import('./pages/UnifiedDashboard'));

// Fulfillment & Checkout
const FulfillmentDemoPage = React.lazy(() => import('./pages/FulfillmentDemoPage'));

// Auctions
const AuctionDetailPage = React.lazy(() => import('./components/auction/AuctionDetailPage'));

// Trust & Clarity Pages
const AboutUsPage = React.lazy(() => import('./pages/AboutUsPage'));
const BuyerProtectionPage = React.lazy(() => import('./pages/BuyerProtectionPage'));
const SellerProtectionPage = React.lazy(() => import('./pages/SellerProtectionPage'));
const GenericContentPage = React.lazy(() => import('./pages/GenericContentPage'));

// New Policy Pages
const HowItWorksPage = React.lazy(() => import('./pages/HowItWorksPage'));
const DisputeResolutionPage = React.lazy(() => import('./pages/DisputeResolutionPage'));
const FeesPricingPage = React.lazy(() => import('./pages/FeesPricingPage'));
const ShippingDeliveryPage = React.lazy(() => import('./pages/ShippingDeliveryPage'));
const ContactSupportPage = React.lazy(() => import('./pages/ContactSupportPage'));
const BiddingHelpPage = React.lazy(() => import('./pages/BiddingHelpPage'));

// New Trust / Legal / Payments Pages
const TrustSafetyPage = React.lazy(() => import('./pages/trust/TrustSafetyPage'));
const TrustSafetyTipsPage = React.lazy(() => import('./pages/trust/TrustSafetyTipsPage'));
const TrustBuyerProtectionPage = React.lazy(() => import('./pages/trust/BuyerProtectionPage'));
const TrustSellerProtectionPage = React.lazy(() => import('./pages/trust/SellerProtectionPage'));

const TermsPage = React.lazy(() => import('./pages/legal/TermsPage'));
const PrivacyPage = React.lazy(() => import('./pages/legal/PrivacyPage'));
const CookiesPage = React.lazy(() => import('./pages/legal/CookiesPage'));
const CommunityGuidelinesPage = React.lazy(() => import('./pages/legal/CommunityGuidelinesPage'));

const PaymentsFeesPage = React.lazy(() => import('./pages/payments/FeesPage'));
const PaymentsCancellationPage = React.lazy(() => import('./pages/payments/CancellationRefundsPage'));
const PaymentsDisputesPage = React.lazy(() => import('./pages/payments/DisputesPage'));

const AffiliateProgramPage = React.lazy(() => import('./pages/affiliate/ProgramPage'));

// Additional Pages
const SellPage = React.lazy(() => import('./pages/SellPage'));
const DealsPage = React.lazy(() => import('./pages/DealsPage'));
const HelpSellingPage = React.lazy(() => import('./pages/HelpSellingPage'));

// Plugin Marketplace
const PluginMarketplacePage = React.lazy(() => import('./pages/plugin-marketplace/PluginMarketplacePage'));

// Mnbarh Live (eBay Live – streaming + live auctions)
const LiveStreamPage = React.lazy(() => import('./components/live-streaming/LiveStreamPage'));

// Fallback loading
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="large" />
  </div>
);

import { useTranslation } from 'react-i18next';

function App() {
  const { isAuthenticated } = useAuth();
  const { i18n } = useTranslation();

  React.useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Canonical Pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/category/:slug" element={<SearchPage />} />
        
        {/* Auth routes */}
        <Route path="/auth/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/auth/register" element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        
        {/* Utility routes */}
        <Route path="/runtime-check" element={<RuntimeCheckPage />} />
        
        {/* Admin routes (Main Command Center) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<ControlCenterPage />} />
          <Route path="threat-map" element={<ThreatMap />} />
          <Route path="servers" element={<ServerMonitor />} />
          <Route path="studio" element={<Studio />} />
          <Route path="stego" element={<Steganography />} />
          <Route path="apocalypse" element={<Apocalypse />} />
          
          <Route path="cms" element={<CmsManager />} />
          <Route path="ads" element={<AdsManager />} />
          <Route path="travelers" element={<TravelersManager />} />
          <Route path="orders" element={<PasteOrdersManager />} />
          <Route path="guarantees" element={<FinancialGuarantees />} />
        </Route>
        
        {/* Founder Dashboard */}
        <Route path="/founder" element={<FounderDashboard />} />
        
        {/* Unified Dashboard */}
        <Route path="/dashboards" element={<UnifiedDashboard />} />
        
        {/* Fulfillment & Checkout */}
        <Route path="/checkout/fulfillment" element={<FulfillmentDemoPage />} />
        <Route path="/demo/fulfillment" element={<FulfillmentDemoPage />} />
        
        {/* Auctions */}
        <Route path="/auctions/:id" element={<AuctionDetailPage />} />
        
        {/* Trust & Clarity Pages */}
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/policies/buyer-protection" element={<BuyerProtectionPage />} />
        <Route path="/policies/seller-protection" element={<SellerProtectionPage />} />
        <Route path="/policies/:pageId" element={<GenericContentPage />} />
        <Route path="/help/:pageId" element={<GenericContentPage />} />
        
        {/* New Policy Pages */}
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/policies/dispute-resolution" element={<DisputeResolutionPage />} />
        <Route path="/policies/fees-pricing" element={<FeesPricingPage />} />
        <Route path="/policies/shipping-delivery" element={<ShippingDeliveryPage />} />
        <Route path="/contact" element={<ContactSupportPage />} />
        <Route path="/help/bidding" element={<BiddingHelpPage />} />
        
        {/* Trust / Safety */}
        <Route path="/trust" element={<TrustSafetyPage />} />
        <Route path="/trust/safety-tips" element={<TrustSafetyTipsPage />} />
        <Route path="/trust/buyer-protection" element={<TrustBuyerProtectionPage />} />
        <Route path="/trust/seller-protection" element={<TrustSellerProtectionPage />} />

        {/* Legal */}
        <Route path="/legal/terms" element={<TermsPage />} />
        <Route path="/legal/privacy" element={<PrivacyPage />} />
        <Route path="/legal/cookies" element={<CookiesPage />} />
        <Route path="/legal/community-guidelines" element={<CommunityGuidelinesPage />} />

        {/* Payments & Policies */}
        <Route path="/payments/fees" element={<PaymentsFeesPage />} />
        <Route path="/payments/cancellation-refunds" element={<PaymentsCancellationPage />} />
        <Route path="/payments/disputes" element={<PaymentsDisputesPage />} />

        {/* Affiliate */}
        <Route path="/affiliate/program" element={<AffiliateProgramPage />} />

        {/* Additional Pages */}
        <Route path="/sell" element={<SellPage />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/help/selling" element={<HelpSellingPage />} />

        {/* Plugin Marketplace */}
        <Route path="/plugins" element={<PluginMarketplacePage />} />

        {/* Mnbarh Live – eBay Live (streaming, chat, live auctions) */}
        <Route path="/live" element={<LiveStreamPage />} />

        {/* Catch-all redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
