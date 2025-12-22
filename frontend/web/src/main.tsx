import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';

import { initSentry } from './config/sentry';
import { ErrorBoundary } from './components/infra/ErrorBoundary.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { CurrencyProvider } from './context/CurrencyContext.tsx';
import { SecurityProvider } from './context/SecurityContext';
import { WalletProvider } from './context/WalletContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Initialize Sentry before rendering
// Requirements: 20.3 - Configure alerts for payment failures, auction timer drift, and service health
initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <SecurityProvider>
        <AuthProvider>
          <NotificationProvider>
            <WalletProvider>
              <LanguageProvider>
                <CurrencyProvider>
                  <BrowserRouter>
                    <App />
                  </BrowserRouter>
                </CurrencyProvider>
              </LanguageProvider>
            </WalletProvider>
          </NotificationProvider>
        </AuthProvider>
      </SecurityProvider>
    </ErrorBoundary>
  </StrictMode>,
);
