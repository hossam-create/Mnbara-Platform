import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import { initSentry } from './config/sentry';
import './index.css';

// Initialize Sentry before rendering
// Requirements: 20.3 - Configure alerts for payment failures, auction timer drift, and service health
initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }: { error: Error; resetError: () => void }) => (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          padding: '24px',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#111827', marginBottom: '8px' }}>Something went wrong</h1>
          <p style={{ color: '#6B7280', marginBottom: '16px' }}>{error.message}</p>
          <button 
            onClick={resetError}
            style={{
              backgroundColor: '#3B82F6',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      )}
      showDialog
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);
