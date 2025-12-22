import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TravelerStackParamList } from '../types/navigation';

// Traveler screens
import { TravelerHomeScreen } from '../screens/traveler/TravelerHomeScreen';
import { CreateTripScreen } from '../screens/traveler/CreateTripScreen';
import { TripDetailScreen } from '../screens/traveler/TripDetailScreen';
import { NearbyRequestsScreen } from '../screens/traveler/NearbyRequestsScreen';
import { DeliveriesScreen } from '../screens/traveler/DeliveriesScreen';
import { DeliveryDetailScreen } from '../screens/traveler/DeliveryDetailScreen';
import { EarningsScreen } from '../screens/traveler/EarningsScreen';
import { EvidenceCaptureScreen } from '../screens/traveler/EvidenceCaptureScreen';

const Stack = createNativeStackNavigator<TravelerStackParamList>();

export const TravelerNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
        headerTintColor: '#007AFF',
      }}
      initialRouteName="TravelerHome"
    >
      <Stack.Screen
        name="TravelerHome"
        component={TravelerHomeScreen}
        options={{ headerTitle: 'Traveler Dashboard' }}
      />
      <Stack.Screen
        name="CreateTrip"
        component={CreateTripScreen}
        options={{ headerTitle: 'Create Trip' }}
      />
      <Stack.Screen
        name="TripDetail"
        component={TripDetailScreen}
        options={{ headerTitle: 'Trip Details' }}
      />
      <Stack.Screen
        name="NearbyRequests"
        component={NearbyRequestsScreen}
        options={{ headerTitle: 'Nearby Requests' }}
      />
      <Stack.Screen
        name="Deliveries"
        component={DeliveriesScreen}
        options={{ headerTitle: 'My Deliveries' }}
      />
      <Stack.Screen
        name="DeliveryDetail"
        component={DeliveryDetailScreen}
        options={{ headerTitle: 'Delivery Details' }}
      />
      <Stack.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ headerTitle: 'Earnings' }}
      />
      <Stack.Screen
        name="EvidenceCapture"
        component={EvidenceCaptureScreen}
        options={{ headerTitle: 'Capture Evidence' }}
      />
    </Stack.Navigator>
  );
};
