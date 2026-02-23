import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Loading components for different marketplace sections
const ProductListLoading = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="bg-gray-200 aspect-square rounded-lg mb-3"></div>
        <div className="bg-gray-200 h-4 rounded mb-2"></div>
        <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
        <div className="bg-gray-200 h-5 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

const CartLoading = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="animate-pulse flex gap-4 p-4 border rounded">
        <div className="bg-gray-200 w-16 h-16 rounded"></div>
        <div className="flex-1 space-y-2">
          <div className="bg-gray-200 h-4 rounded"></div>
          <div className="bg-gray-200 h-4 rounded w-3/4"></div>
        </div>
      </div>
    ))}
  </div>
);

const DashboardLoading = () => (
  <div className="space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse p-6 border rounded-lg">
          <div className="bg-gray-200 h-6 w-20 mb-2"></div>
          <div className="bg-gray-200 h-8 w-12 mb-2"></div>
          <div className="bg-gray-200 h-4 w-24"></div>
        </div>
      ))}
    </div>

    {/* Content Area */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="animate-pulse space-y-4">
        <div className="bg-gray-200 h-48 rounded"></div>
        <div className="bg-gray-200 h-32 rounded"></div>
      </div>
      <div className="animate-pulse space-y-4">
        <div className="bg-gray-200 h-32 rounded"></div>
        <div className="bg-gray-200 h-40 rounded"></div>
      </div>
    </div>
  </div>
);

const ProductDetailLoading = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
    {/* Images */}
    <div className="space-y-4">
      <div className="bg-gray-200 aspect-square rounded-lg"></div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-200 w-16 h-16 rounded"></div>
        ))}
      </div>
    </div>

    {/* Details */}
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="bg-gray-200 h-8 rounded"></div>
        <div className="bg-gray-200 h-6 rounded w-3/4"></div>
      </div>
      <div className="bg-gray-200 h-6 rounded w-1/4"></div>
      <div className="space-y-2">
        <div className="bg-gray-200 h-4 rounded"></div>
        <div className="bg-gray-200 h-4 rounded"></div>
        <div className="bg-gray-200 h-4 rounded w-3/4"></div>
      </div>
      <div className="bg-gray-200 h-12 rounded"></div>
    </div>
  </div>
);

// Error fallback for marketplace sections
const MarketplaceErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="p-8 text-center border border-red-200 rounded-lg bg-red-50">
    <div className="text-red-600 text-lg font-semibold mb-2">Unable to load content</div>
    <div className="text-red-500 text-sm mb-4">{error.message}</div>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
    >
      Try Again
    </button>
  </div>
);

// Marketplace Suspense wrappers for different data sections
export const ProductListSuspense = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary FallbackComponent={MarketplaceErrorFallback}>
    <Suspense fallback={<ProductListLoading />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const CartSuspense = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary FallbackComponent={MarketplaceErrorFallback}>
    <Suspense fallback={<CartLoading />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const DashboardSuspense = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary FallbackComponent={MarketplaceErrorFallback}>
    <Suspense fallback={<DashboardLoading />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const ProductDetailSuspense = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary FallbackComponent={MarketplaceErrorFallback}>
    <Suspense fallback={<ProductDetailLoading />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

// Generic marketplace suspense wrapper
export const MarketplaceSuspense = ({
  children,
  fallback,
  section = 'content'
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  section?: string;
}) => {
  const defaultFallback = (
    <div className="animate-pulse p-8 text-center">
      <div className="text-gray-500">Loading {section}...</div>
    </div>
  );

  return (
    <ErrorBoundary FallbackComponent={MarketplaceErrorFallback}>
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

// Async data section wrapper with loading states
export function AsyncDataSection<T>({
  data,
  loading,
  error,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent
}: {
  data?: T[] | T | null;
  loading?: boolean;
  error?: Error | string | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}) {
  if (loading) {
    return <>{loadingComponent || <div className="animate-pulse p-4">Loading...</div>}</>;
  }

  if (error) {
    return <>{errorComponent || <div className="text-red-600 p-4">Error loading data</div>}</>;
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return <>{emptyComponent || <div className="text-gray-500 p-4 text-center">No data available</div>}</>;
  }

  return <>{children}</>;
}
