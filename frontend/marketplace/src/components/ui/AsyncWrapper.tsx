'use client';

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AsyncWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
}

/**
 * AsyncWrapper - Production-grade wrapper for async components
 * Provides Suspense boundaries and error boundaries
 */
export function AsyncWrapper({
  children,
  fallback = <LoadingSpinner size="medium" />,
  errorFallback: ErrorFallback
}: AsyncWrapperProps) {
  const defaultErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
      <h3 className="text-red-800 font-medium">Something went wrong</h3>
      <p className="text-red-600 text-sm mt-1">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  );

  const FinalErrorFallback = ErrorFallback || defaultErrorFallback;

  return (
    <ErrorBoundary FallbackComponent={FinalErrorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * MarketplaceAsyncWrapper - Specialized wrapper for marketplace components
 * Includes marketplace-specific error handling and loading states
 */
export function MarketplaceAsyncWrapper({
  children,
  componentName = 'Component'
}: {
  children: React.ReactNode;
  componentName?: string;
}) {
  const marketplaceErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
    <div className="p-6 border border-orange-200 rounded-lg bg-orange-50 text-center">
      <div className="text-4xl mb-2">🛒</div>
      <h3 className="text-orange-800 font-semibold mb-2">Marketplace Error</h3>
      <p className="text-orange-700 text-sm mb-4">
        Unable to load {componentName}. This might be due to a network issue.
      </p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
      >
        Retry
      </button>
    </div>
  );

  const marketplaceLoadingFallback = (
    <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 text-center">
      <LoadingSpinner size="large" className="mx-auto mb-3" />
      <p className="text-gray-600 text-sm">Loading {componentName}...</p>
    </div>
  );

  return (
    <AsyncWrapper
      fallback={marketplaceLoadingFallback}
      errorFallback={marketplaceErrorFallback}
    >
      {children}
    </AsyncWrapper>
  );
}
