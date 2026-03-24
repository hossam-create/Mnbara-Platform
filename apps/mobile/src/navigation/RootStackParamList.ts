// Navigation types for Mnbara app

export type RootStackParamList = {
  // Auth Stack
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OTPVerification: { email?: string; phone?: string; type: 'email' | 'phone' };
  ProfileSetup: { role: 'shopper' | 'traveler' };
  
  // Main Tabs
  HomeTab: undefined;
  MyDeliveriesTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
  
  // Home Stack
  ShopperHome: undefined;
  TravelerHome: undefined;
  SearchTrips: { origin?: string; destination?: string };
  CreateDelivery: undefined;
  TripDetailsHome: { tripId: string };
  
  // Delivery Stack
  MyDeliveriesList: undefined;
  DeliveryDetails: { deliveryId: string };
  CreateDeliveryRequest: undefined;
  Tracking: { deliveryId: string };
  DeliveryConfirmation: { deliveryId: string };
  
  // Trip Stack
  MyTripsList: undefined;
  TripDetailsTrip: { tripId: string };
  CreateTrip: undefined;
  TripRequests: { tripId: string };
  ActiveTrip: { tripId: string };
  
  // Matching
  MatchingResults: { deliveryId: string };
  MatchDetails: { matchId: string };
  AcceptMatch: { matchId: string };
  
  // Chat
  Conversations: undefined;
  Chat: { conversationId: string; participantName?: string };
  
  // Profile
  ProfileScreen: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Verification: undefined;
  PaymentMethods: undefined;
  Wallet: undefined;
  NotificationsSettings: undefined;
  
  // Common
  WebView: { url: string; title: string };
  ImagePreview: { uri: string };
  FullScreenMap: {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
    markers?: Array<{ latitude: number; longitude: number; title?: string }>;
  };
};

// Tab navigation types
export type BottomTabParamList = {
  HomeTab: undefined;
  MyDeliveriesTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};
