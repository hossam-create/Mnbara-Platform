import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../theme";

import { RootStackParamList } from "./RootStackParamList";

// Import auth screens
import OnboardingScreen from "../features/auth/screens/OnboardingScreen";
import LoginScreen from "../features/auth/screens/LoginScreen";
import RegisterScreen from "../features/auth/screens/RegisterScreen";
import ForgotPasswordScreen from "../features/auth/screens/ForgotPasswordScreen";
import OTPVerificationScreen from "../features/auth/screens/OTPVerificationScreen";
import ProfileSetupScreen from "../features/auth/screens/ProfileSetupScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

interface AuthNavigatorProps {
  showOnboarding?: boolean;
}

const AuthNavigator: React.FC<AuthNavigatorProps> = ({ showOnboarding = false }) => {
  const theme = useTheme();

  return (
    <Stack.Navigator
        initialRouteName={showOnboarding ? "Onboarding" : "Login"}
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: theme.colors.background },
        }}
    >
      {showOnboarding && (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      )}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
