import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/auth/screens/forgot_password_screen.dart';
import '../../features/auth/screens/otp_verification_screen.dart';
import '../../features/home/screens/main_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/search/screens/search_screen.dart';
import '../../features/categories/screens/categories_screen.dart';
import '../../features/categories/screens/category_products_screen.dart';
import '../../features/products/screens/product_details_screen.dart';
import '../../features/cart/screens/cart_screen.dart';
import '../../features/checkout/screens/checkout_screen.dart';
import '../../features/checkout/screens/payment_screen.dart';
import '../../features/checkout/screens/order_success_screen.dart';
import '../../features/orders/screens/orders_screen.dart';
import '../../features/orders/screens/order_details_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/profile/screens/edit_profile_screen.dart';
import '../../features/profile/screens/addresses_screen.dart';
import '../../features/profile/screens/add_address_screen.dart';
import '../../features/wishlist/screens/wishlist_screen.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/settings/screens/settings_screen.dart';
import '../../features/seller/screens/seller_dashboard_screen.dart';
import '../../features/seller/screens/my_listings_screen.dart';
import '../../features/seller/screens/create_listing_screen.dart';
import '../../features/traveler/screens/traveler_home_screen.dart';
import '../../features/traveler/screens/create_trip_screen.dart';
import '../../features/traveler/screens/nearby_requests_screen.dart';
import '../../features/traveler/screens/earnings_screen.dart';
import '../../features/traveler/screens/deliveries_screen.dart';
import '../../features/traveler/screens/delivery_detail_screen.dart';
import '../../features/traveler/screens/trip_detail_screen.dart';
import '../../features/traveler/screens/evidence_capture_screen.dart';
import '../../features/onboarding/screens/onboarding_screen.dart';
import '../../features/onboarding/screens/splash_screen.dart';
import '../../features/buyer/screens/live_tracking_screen.dart';
import '../../features/smart_buyer/screens/smart_buyer_screen.dart';
// Brainstorm Features
import '../../features/voice_commerce/screens/voice_search_screen.dart';
import '../../features/ar_preview/screens/ar_preview_screen.dart';
import '../../features/ai_chatbot/screens/chatbot_screen.dart';
import '../../features/crypto_wallet/screens/crypto_wallet_screen.dart';
import '../../features/wholesale/screens/wholesale_screen.dart';
import '../../features/vr_showroom/screens/vr_showroom_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);
  
  return GoRouter(
    initialLocation: '/splash',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isLoggedIn = authState.isAuthenticated;
      final isAuthRoute = state.matchedLocation.startsWith('/auth');
      final isSplash = state.matchedLocation == '/splash';
      final isOnboarding = state.matchedLocation == '/onboarding';
      
      if (isSplash || isOnboarding) return null;
      
      // If not logged in and trying to access protected route
      if (!isLoggedIn && !isAuthRoute && state.matchedLocation != '/') {
        return '/auth/login';
      }
      
      return null;
    },
    routes: [
      // Splash & Onboarding
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      
      // Auth Routes
      GoRoute(
        path: '/auth/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/auth/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/auth/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/auth/otp',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return OtpVerificationScreen(
            email: extra?['email'] ?? '',
            type: extra?['type'] ?? 'register',
          );
        },
      ),
      
      // Main App Shell
      ShellRoute(
        builder: (context, state, child) => MainScreen(child: child),
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: '/categories',
            builder: (context, state) => const CategoriesScreen(),
          ),
          GoRoute(
            path: '/cart',
            builder: (context, state) => const CartScreen(),
          ),
          GoRoute(
            path: '/wishlist',
            builder: (context, state) => const WishlistScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),
      
      // Search
      GoRoute(
        path: '/search',
        builder: (context, state) {
          final query = state.uri.queryParameters['q'] ?? '';
          return SearchScreen(initialQuery: query);
        },
      ),
      
      // Category Products
      GoRoute(
        path: '/category/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final name = state.uri.queryParameters['name'] ?? '';
          return CategoryProductsScreen(categoryId: id, categoryName: name);
        },
      ),
      
      // Product Details
      GoRoute(
        path: '/product/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return ProductDetailsScreen(productId: id);
        },
      ),
      
      // Checkout Flow
      GoRoute(
        path: '/checkout',
        builder: (context, state) => const CheckoutScreen(),
      ),
      GoRoute(
        path: '/payment',
        builder: (context, state) => const PaymentScreen(),
      ),
      GoRoute(
        path: '/order-success',
        builder: (context, state) {
          final orderId = state.uri.queryParameters['orderId'] ?? '';
          return OrderSuccessScreen(orderId: orderId);
        },
      ),
      
      // Orders
      GoRoute(
        path: '/orders',
        builder: (context, state) => const OrdersScreen(),
      ),
      GoRoute(
        path: '/order/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return OrderDetailsScreen(orderId: id);
        },
      ),
      
      // Profile
      GoRoute(
        path: '/edit-profile',
        builder: (context, state) => const EditProfileScreen(),
      ),
      GoRoute(
        path: '/addresses',
        builder: (context, state) => const AddressesScreen(),
      ),
      GoRoute(
        path: '/add-address',
        builder: (context, state) => const AddAddressScreen(),
      ),
      
      // Notifications
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      
      // Settings
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
      
      // Seller
      GoRoute(
        path: '/seller/dashboard',
        builder: (context, state) => const SellerDashboardScreen(),
      ),
      GoRoute(
        path: '/seller/listings',
        builder: (context, state) => const MyListingsScreen(),
      ),
      GoRoute(
        path: '/seller/create-listing',
        builder: (context, state) => const CreateListingScreen(),
      ),
      
      // Traveler
      GoRoute(
        path: '/traveler/dashboard',
        builder: (context, state) => const TravelerHomeScreen(),
      ),
      GoRoute(
        path: '/traveler/create-trip',
        builder: (context, state) => const CreateTripScreen(),
      ),
      GoRoute(
        path: '/traveler/nearby-requests',
        builder: (context, state) => const NearbyRequestsScreen(),
      ),
      GoRoute(
        path: '/traveler/earnings',
        builder: (context, state) => const EarningsScreen(),
      ),
      GoRoute(
        path: '/traveler/deliveries',
        builder: (context, state) => const DeliveriesScreen(),
      ),
      GoRoute(
        path: '/traveler/delivery/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return DeliveryDetailScreen(deliveryId: id);
        },
      ),
      GoRoute(
        path: '/traveler/trip/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return TripDetailScreen(tripId: id);
        },
      ),
      GoRoute(
        path: '/traveler/evidence/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final type = state.uri.queryParameters['type'] ?? 'pickup';
          return EvidenceCaptureScreen(deliveryId: id, type: type);
        },
      ),
      
      // Live Tracking (Buyer)
      GoRoute(
        path: '/tracking/:deliveryId',
        builder: (context, state) {
          final deliveryId = state.pathParameters['deliveryId']!;
          return LiveTrackingScreen(deliveryId: deliveryId);
        },
      ),
      
      // Smart Buyer (AI Camera/Voice Search)
      GoRoute(
        path: '/smart-buyer',
        builder: (context, state) => const SmartBuyerScreen(),
      ),
      
      // Voice Commerce - البحث الصوتي
      GoRoute(
        path: '/voice-search',
        builder: (context, state) => const VoiceSearchScreen(),
      ),
      
      // AR Preview - معاينة الواقع المعزز
      GoRoute(
        path: '/ar-preview',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return ARPreviewScreen(
            productId: extra?['productId'] ?? state.uri.queryParameters['productId'] ?? '',
            productName: extra?['productName'] ?? state.uri.queryParameters['productName'] ?? 'منتج',
            modelUrl: extra?['modelUrl'],
          );
        },
      ),
      
      // AI Chatbot - المساعد الذكي
      GoRoute(
        path: '/chatbot',
        builder: (context, state) => const ChatbotScreen(),
      ),
      
      // Crypto Wallet - محفظة العملات الرقمية
      GoRoute(
        path: '/crypto-wallet',
        builder: (context, state) => const CryptoWalletScreen(),
      ),
      
      // Wholesale - سوق الجملة
      GoRoute(
        path: '/wholesale',
        builder: (context, state) => const WholesaleScreen(),
      ),
      
      // VR Showroom - صالة العرض الافتراضية
      GoRoute(
        path: '/vr-showroom',
        builder: (context, state) => const VRShowroomScreen(),
      ),
    ],
  );
});
