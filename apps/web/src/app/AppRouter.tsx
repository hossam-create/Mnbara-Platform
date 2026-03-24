'use client';

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

// Lazy load pages
const HomePage = lazy(() => import('@/pages/HomePage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const ProductPage = lazy(() => import('@/pages/ProductPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));
const RuntimeCheckPage = lazy(() => import('@/pages/RuntimeCheckPage'));
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const ControlCenterPage = lazy(() => import('@/pages/control-center/ControlCenterPage'));
const ThreatMap = lazy(() => import('@/pages/control-center/ThreatMap'));
const ServerMonitor = lazy(() => import('@/pages/control-center/ServerMonitor'));
const Studio = lazy(() => import('@/pages/control-center/Studio'));
const Steganography = lazy(() => import('@/pages/control-center/Steganography'));
const Apocalypse = lazy(() => import('@/pages/control-center/Apocalypse'));
const XyOpsPage = lazy(() => import('@/pages/control-center/XyOpsPage'));
const CmsManager = lazy(() => import('@/pages/admin/CmsManager'));
const AdsManager = lazy(() => import('@/pages/admin/AdsManager'));
const TravelersManager = lazy(() => import('@/pages/admin/TravelersManager'));
const PasteOrdersManager = lazy(() => import('@/pages/admin/PasteOrdersManager'));
const FinancialGuarantees = lazy(() => import('@/pages/admin/FinancialGuarantees'));
const FinancePage = lazy(() => import('@/pages/control-center/FinancePage'));
const FounderDashboard = lazy(() => import('@/pages/founder/FounderDashboard'));
const UnifiedDashboard = lazy(() => import('@/pages/UnifiedDashboard'));
const FulfillmentDemoPage = lazy(() => import('@/pages/FulfillmentDemoPage'));
const AuctionDetailPage = lazy(() => import('@/components/auction/AuctionDetailPage'));
const AboutUsPage = lazy(() => import('@/pages/AboutUsPage'));
const GenericContentPage = lazy(() => import('@/pages/GenericContentPage'));
const HowItWorksPage = lazy(() => import('@/pages/HowItWorksPage'));
const DisputeResolutionPage = lazy(() => import('@/pages/DisputeResolutionPage'));
const FeesPricingPage = lazy(() => import('@/pages/FeesPricingPage'));
const ShippingDeliveryPage = lazy(() => import('@/pages/ShippingDeliveryPage'));
const ContactSupportPage = lazy(() => import('@/pages/ContactSupportPage'));
const BiddingHelpPage = lazy(() => import('@/pages/BiddingHelpPage'));
const TrustSafetyPage = lazy(() => import('@/pages/trust/TrustSafetyPage'));
const KYCVerificationPage = lazy(() => import('@/pages/kyc/KYCVerificationPage'));
const TrustSafetyTipsPage = lazy(() => import('@/pages/trust/TrustSafetyTipsPage'));
const TrustBuyerProtectionPage = lazy(() => import('@/pages/trust/BuyerProtectionPage'));
const TrustSellerProtectionPage = lazy(() => import('@/pages/trust/SellerProtectionPage'));
const TermsPage = lazy(() => import('@/pages/legal/TermsPage'));
const PrivacyPage = lazy(() => import('@/pages/legal/PrivacyPage'));
const CookiesPage = lazy(() => import('@/pages/legal/CookiesPage'));
const CommunityGuidelinesPage = lazy(() => import('@/pages/legal/CommunityGuidelinesPage'));
const PaymentsFeesPage = lazy(() => import('@/pages/payments/FeesPage'));
const PaymentsCancellationPage = lazy(() => import('@/pages/payments/CancellationRefundsPage'));
const PaymentsDisputesPage = lazy(() => import('@/pages/payments/DisputesPage'));
const AffiliateProgramPage = lazy(() => import('@/pages/affiliate/ProgramPage'));
const SellPage = lazy(() => import('@/pages/SellPage'));
const DealsPage = lazy(() => import('@/pages/DealsPage'));
const HelpSellingPage = lazy(() => import('@/pages/HelpSellingPage'));
const PluginMarketplacePage = lazy(() => import('@/pages/plugin-marketplace/PluginMarketplacePage'));
const LiveStreamPage = lazy(() => import('@/components/live-streaming/LiveStreamPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccessPage'));
const TravelerDashboard = lazy(() => import('@/pages/traveler/TravelerDashboard'));
const TripCreationPage = lazy(() => import('@/pages/traveler/TripCreationPage'));
const AvailableOrdersPage = lazy(() => import('@/pages/traveler/AvailableOrdersPage'));
const BecomeTravelerPage = lazy(() => import('@/pages/traveler/BecomeTravelerPage'));
const TravelerProfilePage = lazy(() => import('@/pages/traveler/TravelerProfilePage'));
const ActiveRoutesPage = lazy(() => import('@/pages/traveler/ActiveRoutesPage'));
const RouteDetailsPage = lazy(() => import('@/pages/traveler/RouteDetailsPage'));
const TravelerOffersPage = lazy(() => import('@/pages/traveler/TravelerOffersPage'));
const DeliveryMatchingPage = lazy(() => import('@/pages/traveler/DeliveryMatchingPage'));
const RouteMapPage = lazy(() => import('@/pages/traveler/RouteMapPage'));
const TravelerRatingPage = lazy(() => import('@/pages/traveler/TravelerRatingPage'));
const MarketplaceProfilePage = lazy(() => import('@/pages/marketplace/PublicSellerProfilePage'));
const CategoryTreePage = lazy(() => import('@/pages/marketplace/CategoryTreePage'));
const SellerDashboard = lazy(() => import('@/pages/seller/SellerDashboard'));
const CreateListingPage = lazy(() => import('@/pages/seller/CreateListing'));
const MyListingsPage = lazy(() => import('@/pages/seller/MyListings'));
const UserDashboard = lazy(() => import('@/pages/user/UserDashboard'));
const SavedItemsPage = lazy(() => import('@/pages/user/SavedItemsPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const ActivityPage = lazy(() => import('@/pages/profile/ActivityPage'));
const WalletPage = lazy(() => import('@/pages/wallet/WalletPage'));
const EscrowPage = lazy(() => import('@/pages/wallet/EscrowPage'));
const TransactionsPage = lazy(() => import('@/pages/wallet/TransactionsPage'));
const WithdrawDepositPage = lazy(() => import('@/pages/wallet/WithdrawDepositPage'));
const OrdersPage = lazy(() => import('@/pages/OrdersPage'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="large" />
  </div>
);

export default function AppRouter() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/category/:slug" element={<SearchPage />} />
          
          <Route path="/auth/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/auth/register" element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
          
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<ControlCenterPage />} />
            <Route path="threat-map" element={<ThreatMap />} />
            <Route path="servers" element={<ServerMonitor />} />
            <Route path="studio" element={<Studio />} />
            <Route path="stego" element={<Steganography />} />
            <Route path="xyops" element={<XyOpsPage />} />
            <Route path="apocalypse" element={<Apocalypse />} />
            <Route path="cms" element={<CmsManager />} />
            <Route path="ads" element={<AdsManager />} />
            <Route path="travelers" element={<TravelersManager />} />
            <Route path="orders" element={<PasteOrdersManager />} />
            <Route path="guarantees" element={<FinancialGuarantees />} />
          </Route>
          
          <Route path="/founder" element={<FounderDashboard />} />
          <Route path="/dashboards" element={<UnifiedDashboard />} />
          <Route path="/checkout/fulfillment" element={<FulfillmentDemoPage />} />
          <Route path="/demo/fulfillment" element={<FulfillmentDemoPage />} />
          <Route path="/auctions/:id" element={<AuctionDetailPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/policies/:pageId" element={<GenericContentPage />} />
          <Route path="/help/:pageId" element={<GenericContentPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/policies/dispute-resolution" element={<DisputeResolutionPage />} />
          <Route path="/policies/fees-pricing" element={<FeesPricingPage />} />
          <Route path="/policies/shipping-delivery" element={<ShippingDeliveryPage />} />
          <Route path="/contact" element={<ContactSupportPage />} />
          <Route path="/help/bidding" element={<BiddingHelpPage />} />
          <Route path="/trust" element={<TrustSafetyPage />} />
          <Route path="/trust/kyc" element={<KYCVerificationPage />} />
          <Route path="/trust/safety-tips" element={<TrustSafetyTipsPage />} />
          <Route path="/trust/buyer-protection" element={<TrustBuyerProtectionPage />} />
          <Route path="/trust/seller-protection" element={<TrustSellerProtectionPage />} />
          <Route path="/legal/terms" element={<TermsPage />} />
          <Route path="/legal/privacy" element={<PrivacyPage />} />
          <Route path="/legal/cookies" element={<CookiesPage />} />
          <Route path="/legal/community-guidelines" element={<CommunityGuidelinesPage />} />
          <Route path="/payments/fees" element={<PaymentsFeesPage />} />
          <Route path="/payments/cancellation-refunds" element={<PaymentsCancellationPage />} />
          <Route path="/payments/disputes" element={<PaymentsDisputesPage />} />
          <Route path="/affiliate/program" element={<AffiliateProgramPage />} />
          <Route path="/sell" element={<SellPage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/help/selling" element={<HelpSellingPage />} />
          <Route path="/plugins" element={<PluginMarketplacePage />} />
          <Route
            path="/live"
            element={
              <LiveStreamPage
                userId={user?.id ? String(user.id) : 'guest'}
                username={user?.username ? String(user.username) : user?.name ? String(user.name) : 'Guest'}
              />
            }
          />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:id" element={<OrderSuccessPage />} />
          <Route path="/traveler" element={<TravelerDashboard />} />
          <Route path="/traveler/create-trip" element={<TripCreationPage />} />
          <Route path="/traveler/available-orders" element={<AvailableOrdersPage />} />
          <Route path="/traveler/become" element={<BecomeTravelerPage />} />
          <Route path="/traveler/profile" element={<TravelerProfilePage />} />
          <Route path="/traveler/routes" element={<ActiveRoutesPage />} />
          <Route path="/traveler/route/:id" element={<RouteDetailsPage />} />
          <Route path="/traveler/offers" element={<TravelerOffersPage />} />
          <Route path="/traveler/delivery" element={<DeliveryMatchingPage />} />
          <Route path="/traveler/map" element={<RouteMapPage />} />
          <Route path="/traveler/rating" element={<TravelerRatingPage />} />
          <Route path="/marketplace/seller/:id" element={<MarketplaceProfilePage />} />
          <Route path="/marketplace/categories" element={<CategoryTreePage />} />
          <Route path="/seller" element={<SellerDashboard />} />
          <Route path="/seller/create-listing" element={<CreateListingPage />} />
          <Route path="/seller/my-listings" element={<MyListingsPage />} />
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/saved-items" element={<SavedItemsPage />} />
          <Route path="/wallet/dashboard" element={<WalletPage />} />
          <Route path="/wallet/transactions" element={<TransactionsPage />} />
          <Route path="/wallet/escrow" element={<EscrowPage />} />
          <Route path="/wallet/withdraw-deposit" element={<WithdrawDepositPage />} />
          <Route path="/profile/settings" element={<SettingsPage />} />
          <Route path="/profile/activity" element={<ActivityPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Suspense>
  );
}