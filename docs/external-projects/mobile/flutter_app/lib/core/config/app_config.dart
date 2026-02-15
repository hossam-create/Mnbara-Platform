class AppConfig {
  static const String appName = 'منبره';
  static const String appNameEn = 'Mnbara';
  
  // API Configuration
  static const String baseUrl = 'https://api.mnbara.com/v1';
  static const String devBaseUrl = 'http://localhost:3000/api/v1';
  
  // Stripe Configuration
  static const String stripePublishableKey = 'pk_live_YOUR_STRIPE_KEY';
  static const String stripePublishableKeyDev = 'pk_test_YOUR_STRIPE_TEST_KEY';
  
  // Google Maps
  static const String googleMapsApiKey = 'YOUR_GOOGLE_MAPS_API_KEY';
  
  // Firebase
  static const String firebaseProjectId = 'mnbara-app';
  
  // App Store / Play Store
  static const String appStoreId = 'YOUR_APP_STORE_ID';
  static const String playStoreId = 'com.mnbara.app';
  
  // Social Links
  static const String websiteUrl = 'https://mnbara.com';
  static const String supportEmail = 'support@mnbara.com';
  static const String privacyPolicyUrl = 'https://mnbara.com/privacy';
  static const String termsOfServiceUrl = 'https://mnbara.com/terms';
  
  // Feature Flags
  static const bool enableSocialLogin = true;
  static const bool enableApplePay = true;
  static const bool enableBiometric = true;
  
  // Cache Configuration
  static const int cacheMaxAge = 7; // days
  static const int maxCacheSize = 100; // MB
  
  // Pagination
  static const int defaultPageSize = 20;
  
  // Image Configuration
  static const int maxImageSize = 5; // MB
  static const int maxImagesPerListing = 10;
  
  // Shipping
  static const double freeShippingThreshold = 200; // SAR
  static const double defaultShippingCost = 25; // SAR
  
  // VAT
  static const double vatRate = 0.15; // 15%
  
  // Environment
  static bool get isProduction => const String.fromEnvironment('ENV') == 'production';
  static String get apiBaseUrl => isProduction ? baseUrl : devBaseUrl;
  static String get stripeKey => isProduction ? stripePublishableKey : stripePublishableKeyDev;
}
