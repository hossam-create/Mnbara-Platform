import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { MFAVerificationScreen } from '../screens/auth/MFAVerificationScreen';
import { AuthStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName="Welcome"
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: true,
          headerTitle: 'Sign In',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          headerShown: true,
          headerTitle: 'Create Account',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          headerShown: true,
          headerTitle: 'Reset Password',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="MFAVerification"
        component={MFAVerificationScreen}
        options={{
          headerShown: true,
          headerTitle: 'Verify Identity',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
};
