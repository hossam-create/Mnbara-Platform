import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
    ConsentWelcomeScreen,
    PrivacyPolicyScreen,
    TermsOfServiceScreen,
    DataConsentScreen,
} from '../screens/onboarding';

export type OnboardingStackParamList = {
    ConsentWelcome: undefined;
    PrivacyPolicy: undefined;
    TermsOfService: undefined;
    DataConsent: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ConsentWelcome" component={ConsentWelcomeScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
            <Stack.Screen name="DataConsent" component={DataConsentScreen} />
        </Stack.Navigator>
    );
};
