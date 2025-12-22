// Navigation type definitions for MNBARA mobile app

import { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack - handles auth state
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Onboarding: undefined;
  // Modal screens accessible from anywhere
  Auction: { auctionId: string };
  Product: { productId: string };
  Order: { orderId: string };
  Trip: { tripId: string };
};

// Auth Stack - login/register flow
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  MFAVerification: { email: string };
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Auctions: undefined;
  Orders: undefined;
  Profile: undefined;
};

// Traveler Stack - traveler-specific screens
export type TravelerStackParamList = {
  TravelerHome: undefined;
  CreateTrip: undefined;
  TripDetail: { tripId: string };
  NearbyRequests: undefined;
  Deliveries: undefined;
  DeliveryDetail: { matchId: string };
  Earnings: undefined;
  EvidenceCapture: { matchId: string; type: 'pickup' | 'delivery' };
};

// Profile Stack - nested in Profile tab
export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Wallet: undefined;
  KYC: undefined;
  Traveler: NavigatorScreenParams<TravelerStackParamList>;
  Rewards: undefined;
  NotificationPreferences: undefined;
  Notifications: undefined;
};

// Declare global navigation types for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
