# Navigation Quick Reference Guide
## Mnbara Mobile App - React Native Navigation

**Last Updated:** March 2, 2026  
**Framework:** React Navigation 6.x  
**Status:** ✅ Fully Preserved

---

## Quick Navigation Overview

```
AppNavigator (Root)
├── AuthNavigator (Login/Register/Onboarding)
└── MainNavigator (Authenticated User)
    ├── HomeTab (Home Stack)
    ├── MyDeliveriesTab / MyTripsTab (Delivery/Trip Stack - role-based)
    ├── MessagesTab (Chat Stack)
    └── ProfileTab (Profile Stack)
```

---

## File Locations

| Component | Location |
|-----------|----------|
| Root Navigator | `src/navigation/AppNavigator.tsx` |
| Auth Navigator | `src/navigation/AuthNavigator.tsx` |
| Main Navigator | `src/navigation/MainNavigator.tsx` |
| Route Types | `src/navigation/RootStackParamList.ts` |
| App Entry | `src/App.tsx` |
| Theme System | `src/theme/` |
| Redux Store | `src/store/` |

---

## Navigation Routes

### Authentication Routes
```typescript
Splash              // Splash screen
Onboarding          // Onboarding flow (optional)
Login               // Login screen
Register            // Registration screen
ForgotPassword      // Password recovery
OTPVerification     // OTP verification
ProfileSetup        // Initial profile setup
```

### Main App Routes
```typescript
// Tabs
HomeTab             // Home tab
MyDeliveriesTab     // Deliveries tab (shoppers)
MyTripsTab          // Trips tab (travelers)
MessagesTab         // Messages tab
ProfileTab          // Profile tab

// Home Stack
ShopperHome         // Shopper home screen
TravelerHome        // Traveler home screen
SearchTrips         // Search trips screen
CreateDelivery      // Create delivery screen
TripDetailsHome     // Trip details from home

// Delivery Stack
MyDeliveriesList    // List of deliveries
DeliveryDetails     // Delivery details
CreateDeliveryRequest // Create delivery request
Tracking            // Delivery tracking
DeliveryConfirmation // Delivery confirmation

// Trip Stack
MyTripsList         // List of trips
TripDetailsTrip     // Trip details
CreateTrip          // Create trip
TripRequests        // Trip requests
ActiveTrip          // Active trip

// Chat Stack
Conversations       // Conversations list
Chat                // Chat screen

// Profile Stack
ProfileScreen       // User profile
EditProfile         // Edit profile
Settings            // Settings
Verification        // Verification
PaymentMethods      // Payment methods
Wallet              // Wallet
NotificationsSettings // Notification settings

// Matching
MatchingResults     // Matching results
MatchDetails        // Match details
AcceptMatch         // Accept match

// Common
WebView             // Web view screen
ImagePreview        // Image preview
FullScreenMap       // Full screen map
```

---

## Navigating Between Screens

### Using React Navigation Hook

```typescript
import { useNavigation } from '@react-navigation/native';

const MyComponent = () => {
  const navigation = useNavigation();

  // Navigate to a screen
  navigation.navigate('DeliveryDetails', { deliveryId: '123' });

  // Navigate with reset
  navigation.reset({
    index: 0,
    routes: [{ name: 'HomeTab' }],
  });

  // Go back
  navigation.goBack();

  // Replace current screen
  navigation.replace('Login');
};
```

### Passing Parameters

```typescript
// Navigate with parameters
navigation.navigate('Chat', {
  conversationId: 'conv-123',
  participantName: 'John Doe'
});

// Access parameters in screen
import { useRoute } from '@react-navigation/native';

const ChatScreen = () => {
  const route = useRoute();
  const { conversationId, participantName } = route.params;
};
```

---

## Redux Integration

### Authentication State

```typescript
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const MyComponent = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = user?.role; // 'shopper' or 'traveler'
};
```

### Navigation Based on Auth State

The `AppNavigator` automatically handles navigation based on:
- `isAuthenticated` - Shows MainNavigator if true, AuthNavigator if false
- `isOnboardingCompleted` - Shows onboarding if false
- `userRole` - Determines which tabs to show (shopper vs. traveler)

---

## Theme Integration

### Using Theme in Navigation

```typescript
import { useTheme } from '../theme';

const MyComponent = () => {
  const theme = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>Hello</Text>
    </View>
  );
};
```

### Theme Colors Available

```typescript
theme.colors.primary      // Primary brand color
theme.colors.secondary    // Secondary color
theme.colors.background   // Background color
theme.colors.text         // Text color
theme.colors.gray         // Gray color
theme.colors.error        // Error color
theme.colors.success      // Success color
theme.colors.warning      // Warning color
```

---

## Screen Implementation Template

### Basic Screen Template

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../theme';

interface RouteParams {
  deliveryId: string;
}

const DeliveryDetailsScreen: React.FC = () => {
  const route = useRoute();
  const { deliveryId } = route.params as RouteParams;
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>
        Delivery: {deliveryId}
      </Text>
    </View>
  );
};

export default DeliveryDetailsScreen;
```

---

## Adding New Routes

### Step 1: Add Route Type

```typescript
// In RootStackParamList.ts
export type RootStackParamList = {
  // ... existing routes
  MyNewScreen: { param1: string; param2?: number };
};
```

### Step 2: Create Screen Component

```typescript
// In features/myfeature/screens/MyNewScreen.tsx
const MyNewScreen: React.FC = () => {
  // Implementation
};

export default MyNewScreen;
```

### Step 3: Add to Navigator

```typescript
// In MainNavigator.tsx or appropriate navigator
<MyStack.Screen 
  name="MyNewScreen" 
  component={MyNewScreen}
  options={{ title: 'My New Screen' }}
/>
```

### Step 4: Navigate to Screen

```typescript
navigation.navigate('MyNewScreen', { param1: 'value' });
```

---

## Common Navigation Patterns

### Conditional Navigation Based on Role

```typescript
const MainNavigator: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const isTraveler = user?.role === 'traveler';

  return (
    <Tab.Navigator>
      {/* ... */}
      <Tab.Screen
        name={isTraveler ? 'MyTripsTab' : 'MyDeliveriesTab'}
        component={isTraveler ? TripStackNavigator : DeliveryStackNavigator}
      />
    </Tab.Navigator>
  );
};
```

### Conditional Onboarding

```typescript
const AppNavigator: React.FC = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isOnboardingCompleted = useSelector(selectIsOnboardingCompleted);

  const showOnboarding = !isOnboardingCompleted && !isAuthenticated;

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <MainNavigator />
      ) : showOnboarding ? (
        <AuthNavigator showOnboarding={true} />
      ) : (
        <AuthNavigator showOnboarding={false} />
      )}
    </NavigationContainer>
  );
};
```

### Stack Reset on Logout

```typescript
const handleLogout = () => {
  dispatch(logout());
  navigation.reset({
    index: 0,
    routes: [{ name: 'Login' }],
  });
};
```

---

## Debugging Navigation

### Enable Navigation Logging

```typescript
// In AppNavigator.tsx
<NavigationContainer
  onStateChange={(state) => {
    console.log('Navigation state:', state);
  }}
>
  {/* ... */}
</NavigationContainer>
```

### Check Current Route

```typescript
import { useRoute } from '@react-navigation/native';

const MyComponent = () => {
  const route = useRoute();
  console.log('Current route:', route.name);
  console.log('Route params:', route.params);
};
```

---

## Performance Tips

1. **Use useFocusEffect for screen-specific logic**
   ```typescript
   import { useFocusEffect } from '@react-navigation/native';

   useFocusEffect(
     React.useCallback(() => {
       // Load data when screen is focused
       loadData();
     }, [])
   );
   ```

2. **Memoize navigation callbacks**
   ```typescript
   const handleNavigate = useCallback(() => {
     navigation.navigate('Screen');
   }, [navigation]);
   ```

3. **Use lazy loading for screens**
   ```typescript
   const LazyScreen = React.lazy(() => import('./MyScreen'));
   ```

---

## Troubleshooting

### Issue: "Cannot find module" for navigation

**Solution:** Check that all imports use correct paths:
```typescript
// ✅ Correct
import { AppNavigator } from './navigation/AppNavigator';

// ❌ Incorrect
import { AppNavigator } from './AppNavigator';
```

### Issue: Navigation not working after login

**Solution:** Ensure Redux state is updated before navigation:
```typescript
// Dispatch login action first
dispatch(loginSuccess(user));

// Then navigate
navigation.reset({
  index: 0,
  routes: [{ name: 'HomeTab' }],
});
```

### Issue: Theme not applying to navigation

**Solution:** Ensure theme is passed to NavigationContainer:
```typescript
const theme = themeMode === 'dark' ? darkTheme : lightTheme;

<NavigationContainer theme={theme}>
  {/* ... */}
</NavigationContainer>
```

---

## Resources

- **React Navigation Docs:** https://reactnavigation.org/
- **Navigation Type Definitions:** `src/navigation/RootStackParamList.ts`
- **Navigation Implementation:** `src/navigation/`
- **Full Report:** `NAVIGATION_PRESERVATION_REPORT.md`

---

**Quick Reference Version:** 1.0  
**Last Updated:** March 2, 2026  
**Status:** ✅ Ready for Use

