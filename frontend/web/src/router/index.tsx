// ============================================
// 🧭 React Router Configuration - COMPLETE
// ============================================

import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

// Lazy load pages
const HomePage = lazy(() => import('../App'));
const ProductsPage = lazy(() => import('../pages/products/ProductsPage'));
const ProductDetailPage = lazy(() => import('../pages/products/ProductDetailPage'));
const AuctionsPage = lazy(() => import('../pages/auctions/AuctionsPage'));
const AuctionDetailPage = lazy(() => import('../pages/auctions/AuctionDetailPage'));
const SellerDashboard = lazy(() => import('../pages/seller/SellerDashboard'));
const SellerOrdersPage = lazy(() => import('../pages/seller/SellerOrdersPage'));
const TravelerDashboard = lazy(() => import('../pages/traveler/TravelerDashboard'));
const UserDashboard = lazy(() => import('../pages/user/UserDashboard'));
const ChatPage = lazy(() => import('../pages/chat/ChatPage'));
const WalletPage = lazy(() => import('../pages/wallet/WalletPage'));
const CartPage = lazy(() => import('../pages/cart/CartPage'));
const CheckoutPage = lazy(() => import('../pages/cart/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('../pages/cart/OrderConfirmationPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const DisputesDashboard = lazy(() => import('../pages/admin/disputes/DisputesDashboard'));
const AnalyticsDashboard = lazy(() => import('../pages/admin/analytics/AnalyticsDashboard'));
const FeatureFlagsDashboard = lazy(() => import('../pages/admin/feature-flags/FeatureFlagsDashboard'));
const KYCPage = lazy(() => import('../pages/kyc/KYCPage'));
const RewardsPage = lazy(() => import('../pages/rewards/RewardsPage'));

// Legal pages
const UserAgreement = lazy(() => import('../pages/legal/UserAgreement'));
const PrivacyPolicy = lazy(() => import('../pages/legal/PrivacyPolicy'));
const TrustGuarantee = lazy(() => import('../pages/legal/TrustGuarantee'));
const DisputeResolution = lazy(() => import('../pages/legal/DisputeResolution'));
const TravelerAgreement = lazy(() => import('../pages/legal/TravelerAgreement'));
const BuyerResponsibilities = lazy(() => import('../pages/legal/BuyerResponsibilities'));
const CookiesPolicy = lazy(() => import('../pages/legal/CookiesPolicy'));
const AITransparency = lazy(() => import('../pages/legal/AITransparency'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

// Navigation wrapper that uses auth context
const AuthAwareNavigation = () => {
  const { user, isAuthenticated } = useAuth();
  
  // Map admin role to seller for navigation display purposes
  const displayRole = user?.role === 'admin' ? 'seller' : user?.role;
  
  return (
    <Navigation 
      user={isAuthenticated && user ? { 
        name: user.fullName, 
        role: displayRole as 'seller' | 'traveler' | 'buyer',
        avatar: user.avatarUrl 
      } : undefined} 
      cartCount={3} 
    />
  );
};

// Main Layout with Nav and Footer
const MainLayout = () => (
  <div className="min-h-screen flex flex-col">
    <AuthAwareNavigation />
    <main className="flex-1">
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </main>
    <Footer />
  </div>
);

// Auth Layout (no nav/footer)
const AuthLayout = () => (
  <Suspense fallback={<PageLoader />}>
    <Outlet />
  </Suspense>
);

// Dashboard Layout (with sidebar potential)
const DashboardLayout = () => (
  <div className="min-h-screen flex flex-col">
    <AuthAwareNavigation />
    <main className="flex-1">
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </main>
  </div>
);

// Protected Dashboard Layout - wraps all dashboard routes with auth check
const ProtectedDashboardLayout = () => (
  <ProtectedRoute>
    <DashboardLayout />
  </ProtectedRoute>
);

// Seller Protected Layout - requires seller role
const SellerProtectedLayout = () => (
  <ProtectedRoute requiredRoles={['seller', 'admin']}>
    <Outlet />
  </ProtectedRoute>
);

// Traveler Protected Layout - requires traveler role and KYC
const TravelerProtectedLayout = () => (
  <ProtectedRoute requiredRoles={['traveler', 'admin']} requireKyc>
    <Outlet />
  </ProtectedRoute>
);



// Router configuration
export const router = createBrowserRouter([
  // Main public routes
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'auctions', element: <AuctionsPage /> },
      { path: 'auctions/:id', element: <AuctionDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      
      // Legal pages
      { path: 'legal/user-agreement', element: <UserAgreement /> },
      { path: 'legal/privacy-policy', element: <PrivacyPolicy /> },
      { path: 'legal/trust-guarantee', element: <TrustGuarantee /> },
      { path: 'legal/dispute-resolution', element: <DisputeResolution /> },
      { path: 'legal/traveler-agreement', element: <TravelerAgreement /> },
      { path: 'legal/buyer-responsibilities', element: <BuyerResponsibilities /> },
      { path: 'legal/cookies-policy', element: <CookiesPolicy /> },
      { path: 'legal/ai-transparency', element: <AITransparency /> },
      { 
        path: 'checkout', 
        element: (
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'order-confirmation', 
        element: (
          <ProtectedRoute>
            <OrderConfirmationPage />
          </ProtectedRoute>
        ) 
      },
    ],
  },

  // Auth routes (no nav/footer)
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <div className="min-h-screen flex items-center justify-center">Forgot Password</div> },
    ],
  },

  // Protected Dashboard routes
  {
    path: '/',
    element: <ProtectedDashboardLayout />,
    children: [
      { path: 'profile', element: <UserDashboard /> },
      { path: 'dashboard', element: <UserDashboard /> },
      { path: 'orders', element: <div className="pt-20 text-center">Orders Page</div> },
      { path: 'orders/:id', element: <div className="pt-20 text-center">Order Detail</div> },
      { path: 'wishlist', element: <div className="pt-20 text-center">Wishlist Page</div> },
      
      // Chat & Wallet (available to all authenticated users)
      { path: 'chat', element: <ChatPage /> },
      { path: 'chat/:conversationId', element: <ChatPage /> },
      { path: 'wallet', element: <WalletPage /> },
      { path: 'wallet/deposit', element: <WalletPage /> },
      { path: 'wallet/withdraw', element: <WalletPage /> },
      
      // Settings
      { path: 'settings', element: <div className="pt-20 text-center">Settings</div> },
      { path: 'settings/profile', element: <div className="pt-20 text-center">Profile Settings</div> },
      { path: 'settings/security', element: <div className="pt-20 text-center">Security Settings</div> },
      { path: 'settings/notifications', element: <div className="pt-20 text-center">Notification Settings</div> },
      
      // KYC
      { path: 'kyc', element: <KYCPage /> },
      
      // Rewards
      { path: 'rewards', element: <RewardsPage /> },
      
      // Seller routes (nested with role protection)
      {
        element: <SellerProtectedLayout />,
        children: [
          { path: 'seller', element: <SellerDashboard /> },
          { path: 'seller/products', element: <SellerDashboard /> },
          { path: 'seller/products/new', element: <SellerDashboard /> },
          { path: 'seller/orders', element: <SellerOrdersPage /> },
          { path: 'seller/analytics', element: <SellerDashboard /> },
        ],
      },
      
      // Traveler routes (nested with role + KYC protection)
      {
        element: <TravelerProtectedLayout />,
        children: [
          { path: 'traveler', element: <TravelerDashboard /> },
          { path: 'traveler/trips', element: <div className="pt-20 text-center">My Trips</div> },
          { path: 'traveler/trips/new', element: <div className="pt-20 text-center">Add Trip</div> },
          { path: 'traveler/requests', element: <div className="pt-20 text-center">Nearby Requests</div> },
          { path: 'traveler/deliveries', element: <div className="pt-20 text-center">My Deliveries</div> },
          { path: 'traveler/earnings', element: <div className="pt-20 text-center">Traveler Earnings</div> },
        ],
      },
    ],
  },

  // Admin routes (separate layout with admin role protection)
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredRoles={['admin']}>
        <Suspense fallback={<PageLoader />}>
          <AdminDashboard />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/disputes',
    element: (
      <ProtectedRoute requiredRoles={['admin']}>
        <Suspense fallback={<PageLoader />}>
          <DisputesDashboard />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/analytics',
    element: (
      <ProtectedRoute requiredRoles={['admin']}>
        <Suspense fallback={<PageLoader />}>
          <AnalyticsDashboard />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/feature-flags',
    element: (
      <ProtectedRoute requiredRoles={['admin']}>
        <Suspense fallback={<PageLoader />}>
          <FeatureFlagsDashboard />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  // 404 Not Found
  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-8xl mb-4">🔍</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
          <a href="/" className="px-6 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
            Go Home
          </a>
        </div>
      </div>
    ),
  },
]);

// App Router with AuthProvider wrapper
export function AppRouter() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default AppRouter;
