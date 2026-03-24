// ============================================
// Mnbara Mobile App - Entry Point
// ============================================

import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider } from './theme';
import { RootNavigator } from './navigation/RootNavigator';
import { store, persistor } from './store';
import { useAppSelector } from './hooks/useRedux';

// Component to handle navigation based on auth state
function NavigationHandler() {
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);

  // For now, just render the root navigator
  // The navigator will handle auth state redirect
  return <RootNavigator />;
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <NavigationHandler />
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}
