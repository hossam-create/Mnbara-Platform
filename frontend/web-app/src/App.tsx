import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

// Layout components
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'
import LoadingSpinner from './components/ui/LoadingSpinner'

// Auth components
import ProtectedRoute from './components/auth/ProtectedRoute'
import { useAuth } from './hooks/useAuth'

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'))
const SearchPage = React.lazy(() => import('./pages/SearchPage'))
const ProductPage = React.lazy(() => import('./pages/ProductPage'))
const CategoryPage = React.lazy(() => import('./pages/CategoryPage'))
const SellPage = React.lazy(() => import('./pages/SellPage'))
const CartPage = React.lazy(() => import('./pages/CartPage'))
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage'))
const WatchlistPage = React.lazy(() => import('./pages/WatchlistPage'))
const OrdersPage = React.lazy(() => import('./pages/OrdersPage'))
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'))
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'))
const HelpPage = React.lazy(() => import('./pages/HelpPage'))

// Auth pages
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'))
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = React.lazy(() => import('./pages/auth/ResetPasswordPage'))
const VerifyEmailPage = React.lazy(() => import('./pages/auth/VerifyEmailPage'))

// Seller pages
const SellerDashboard = React.lazy(() => import('./pages/seller/SellerDashboard'))
const MyListings = React.lazy(() => import('./pages/seller/MyListings'))
const CreateListing = React.lazy(() => import('./pages/seller/CreateListing'))
const EditListing = React.lazy(() => import('./pages/seller/EditListing'))
const SellerAnalytics = React.lazy(() => import('./pages/seller/SellerAnalytics'))

// Feature pages (Brainstorm 2026)
const ARPreviewPage = React.lazy(() => import('./pages/features/ARPreviewPage'))
const VRShowroomPage = React.lazy(() => import('./pages/features/VRShowroomPage'))
const VoiceSearchPage = React.lazy(() => import('./pages/features/VoiceSearchPage'))
const ChatbotPage = React.lazy(() => import('./pages/features/ChatbotPage'))
const WholesalePage = React.lazy(() => import('./pages/features/WholesalePage'))
const CryptoPaymentPage = React.lazy(() => import('./pages/features/CryptoPaymentPage'))

// Error pages
const NotFoundPage = React.lazy(() => import('./pages/errors/NotFoundPage'))
const ServerErrorPage = React.lazy(() => import('./pages/errors/ServerErrorPage'))

/**
 * Main App Component - eBay-Level Routing and Layout
 * 
 * Features:
 * - Lazy loading for performance
 * - Protected routes for authentication
 * - Animated page transitions
 * - SEO-friendly routing
 * - Error boundaries
 */
function App() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="App">
      <AnimatePresence mode="wait">
        <Suspense 
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <LoadingSpinner size="large" />
            </div>
          }
        >
          <Routes>
            {/* Public routes with main layout */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="product/:id" element={<ProductPage />} />
              <Route path="category/:slug" element={<CategoryPage />} />
              <Route path="help" element={<HelpPage />} />
              <Route path="help/:topic" element={<HelpPage />} />
              {/* Brainstorm 2026 Features */}
              <Route path="ar-preview" element={<ARPreviewPage />} />
              <Route path="vr-showroom" element={<VRShowroomPage />} />
              <Route path="voice-search" element={<VoiceSearchPage />} />
              <Route path="chatbot" element={<ChatbotPage />} />
              <Route path="wholesale" element={<WholesalePage />} />
              <Route path="crypto" element={<CryptoPaymentPage />} />
            </Route>

            {/* Auth routes with auth layout */}
            <Route path="/auth" element={<AuthLayout />}>
              <Route 
                path="login" 
                element={
                  isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
                } 
              />
              <Route 
                path="register" 
                element={
                  isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
                } 
              />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route path="verify-email" element={<VerifyEmailPage />} />
            </Route>

            {/* Protected routes with main layout */}
            <Route path="/" element={<MainLayout />}>
              <Route 
                path="sell" 
                element={
                  <ProtectedRoute>
                    <SellPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="cart" 
                element={
                  <ProtectedRoute>
                    <CartPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="checkout" 
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="watchlist" 
                element={
                  <ProtectedRoute>
                    <WatchlistPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="orders" 
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="settings" 
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } 
              />
            </Route>

            {/* Seller routes */}
            <Route path="/seller" element={<MainLayout />}>
              <Route 
                index 
                element={
                  <ProtectedRoute>
                    <SellerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="listings" 
                element={
                  <ProtectedRoute>
                    <MyListings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="listings/create" 
                element={
                  <ProtectedRoute>
                    <CreateListing />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="listings/:id/edit" 
                element={
                  <ProtectedRoute>
                    <EditListing />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="analytics" 
                element={
                  <ProtectedRoute>
                    <SellerAnalytics />
                  </ProtectedRoute>
                } 
              />
            </Route>

            {/* Error routes */}
            <Route path="/error" element={<ServerErrorPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </div>
  )
}

export default App