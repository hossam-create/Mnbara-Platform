import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { StatusBar, Platform } from 'react-native';
import { RootState } from '../store';
import { lightTheme, darkTheme } from '../theme';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import SplashScreen from '../features/auth/screens/SplashScreen';

// Redux selectors
const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
const selectIsOnboardingCompleted = (state: RootState) => 
  state.auth.isOnboardingCompleted;
const selectThemeMode = (state: RootState) => state.auth.themeMode || 'light';

const AppNavigator: React.FC = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isOnboardingCompleted = useSelector(selectIsOnboardingCompleted);
  const themeMode = useSelector(selectThemeMode);
  const [isLoading, setIsLoading] = React.useState(true);

  // Check initial auth state
  useEffect(() => {
    // Simulate splash screen delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Determine if we should show splash screen
  if (isLoading) {
    return <SplashScreen onFinish={() => setIsLoading(false)} />;
  }

  // Determine if we should show onboarding
  const showOnboarding = !isOnboardingCompleted && !isAuthenticated;

  // Determine theme based on user preference
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <NavigationContainer theme={theme}>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
        translucent={false}
      />
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

export default AppNavigator;
