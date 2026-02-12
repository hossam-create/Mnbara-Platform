import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../theme";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { User, UserRole } from "../domain/entities/user.entity";

import { RootStackParamList, BottomTabParamList } from "./RootStackParamList";

const Tab = createBottomTabNavigator<BottomTabParamList>();
const HomeStack = createNativeStackNavigator<RootStackParamList>();
const DeliveryStack = createNativeStackNavigator<RootStackParamList>();
const TripStack = createNativeStackNavigator<RootStackParamList>();
const MessagesStack = createNativeStackNavigator<RootStackParamList>();
const ProfileStack = createNativeStackNavigator<RootStackParamList>();

// Placeholder screens for development
const PlaceholderScreen: React.FC<{ title: string }> = ({ title }) => {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>{title}</Text>
    </View>
  );
};

// Home Stack Navigator
const HomeStackNavigator: React.FC = () => {
  const theme = useTheme();
  const user = useSelector((state: RootState) => state.auth.user) as User;
  const isTraveler = user?.role === "traveler";

  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <HomeStack.Screen name="ShopperHome" component={() => <PlaceholderScreen title="Shopper Home" />} />
      <HomeStack.Screen name="TravelerHome" component={() => <PlaceholderScreen title="Traveler Home" />} />
      <HomeStack.Screen name="SearchTrips" component={() => <PlaceholderScreen title="Search Trips" />} />
      <HomeStack.Screen name="CreateDelivery" component={() => <PlaceholderScreen title="Create Delivery" />} />
      <HomeStack.Screen name="TripDetailsHome" component={() => <PlaceholderScreen title="Trip Details" />} />
    </HomeStack.Navigator>
  );
};

// Delivery Stack Navigator
const DeliveryStackNavigator: React.FC = () => {
  const theme = useTheme();
  return (
    <DeliveryStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <DeliveryStack.Screen name="MyDeliveriesList" component={() => <PlaceholderScreen title="My Deliveries" />} />
      <DeliveryStack.Screen name="DeliveryDetails" component={() => <PlaceholderScreen title="Delivery Details" />} />
      <DeliveryStack.Screen name="CreateDeliveryRequest" component={() => <PlaceholderScreen title="Create Delivery Request" />} />
      <DeliveryStack.Screen name="Tracking" component={() => <PlaceholderScreen title="Tracking" />} />
      <DeliveryStack.Screen name="DeliveryConfirmation" component={() => <PlaceholderScreen title="Delivery Confirmation" />} />
    </DeliveryStack.Navigator>
  );
};

// Trip Stack Navigator
const TripStackNavigator: React.FC = () => {
  const theme = useTheme();
  return (
    <TripStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <TripStack.Screen name="MyTripsList" component={() => <PlaceholderScreen title="My Trips" />} />
      <TripStack.Screen name="TripDetailsTrip" component={() => <PlaceholderScreen title="Trip Details" />} />
      <TripStack.Screen name="CreateTrip" component={() => <PlaceholderScreen title="Create Trip" />} />
      <TripStack.Screen name="TripRequests" component={() => <PlaceholderScreen title="Trip Requests" />} />
      <TripStack.Screen name="ActiveTrip" component={() => <PlaceholderScreen title="Active Trip" />} />
    </TripStack.Navigator>
  );
};

// Messages Stack Navigator
const MessagesStackNavigator: React.FC = () => {
  const theme = useTheme();
  return (
    <MessagesStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <MessagesStack.Screen name="Conversations" component={() => <PlaceholderScreen title="Conversations" />} />
      <MessagesStack.Screen name="Chat" component={() => <PlaceholderScreen title="Chat" />} />
    </MessagesStack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileStackNavigator: React.FC = () => {
  const theme = useTheme();
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <ProfileStack.Screen name="ProfileScreen" component={() => <PlaceholderScreen title="Profile" />} />
      <ProfileStack.Screen name="EditProfile" component={() => <PlaceholderScreen title="Edit Profile" />} />
      <ProfileStack.Screen name="Settings" component={() => <PlaceholderScreen title="Settings" />} />
      <ProfileStack.Screen name="Verification" component={() => <PlaceholderScreen title="Verification" />} />
      <ProfileStack.Screen name="PaymentMethods" component={() => <PlaceholderScreen title="Payment Methods" />} />
      <ProfileStack.Screen name="Wallet" component={() => <PlaceholderScreen title="Wallet" />} />
      <ProfileStack.Screen name="NotificationsSettings" component={() => <PlaceholderScreen title="Notification Settings" />} />
    </ProfileStack.Navigator>
  );
};

// Main Tab Navigator
const MainNavigator: React.FC = () => {
  const theme = useTheme();
  const user = useSelector((state: RootState) => state.auth.user) as User;
  const isTraveler = user?.role === "traveler";

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name={isTraveler ? "MyTripsTab" : "MyDeliveriesTab"}
        component={isTraveler ? TripStackNavigator : DeliveryStackNavigator}
        options={{
          tabBarLabel: isTraveler ? "My Trips" : "My Deliveries",
        }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesStackNavigator}
        options={{
          tabBarLabel: "Messages",
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: "Profile",
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
