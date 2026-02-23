'use client';

import { Component, ReactNode } from 'react';

// Generic error boundary component for marketplace routes
interface MarketplaceErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  routeName?: string;
  onError?: (error: Error, errorInfo: any) => void;
}

interface MarketplaceErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

class MarketplaceErrorBoundary extends Component<
  MarketplaceErrorBoundaryProps,
  MarketplaceErrorBoundaryState
> {
  constructor(props: MarketplaceErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): MarketplaceErrorBoundaryState {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error to monitoring service
    const errorData = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      route: this.props.routeName,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    };

    console.error('Marketplace Error Boundary:', errorData);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Send to analytics/monitoring
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          route: this.props.routeName,
          error_id: this.state.errorId,
        }
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Something went wrong
            </h2>
            <p className="text-red-700 mb-6">
              We encountered an error loading {this.props.routeName || 'this page'}.
              Our team has been notified and is working to fix this issue.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              >
                Go Home
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Route-specific error boundaries
export const SearchErrorBoundary = ({ children }: { children: ReactNode }) => (
  <MarketplaceErrorBoundary
    routeName="Search"
    fallback={
      <div className="min-h-[600px] flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Unavailable</h3>
          <p className="text-gray-600 mb-4">We're having trouble loading search results.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Search
          </button>
        </div>
      </div>
    }
  >
    {children}
  </MarketplaceErrorBoundary>
);

export const ProductErrorBoundary = ({ children }: { children: ReactNode }) => (
  <MarketplaceErrorBoundary
    routeName="Product Details"
    fallback={
      <div className="min-h-[600px] flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Unavailable</h3>
          <p className="text-gray-600 mb-4">This product is temporarily unavailable.</p>
          <div className="space-x-2">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Browse Products
            </button>
          </div>
        </div>
      </div>
    }
  >
    {children}
  </MarketplaceErrorBoundary>
);

export const CartErrorBoundary = ({ children }: { children: ReactNode }) => (
  <MarketplaceErrorBoundary
    routeName="Shopping Cart"
    fallback={
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">🛒</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cart Error</h3>
          <p className="text-gray-600 mb-4">There was a problem loading your cart.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Reload Cart
          </button>
        </div>
      </div>
    }
  >
    {children}
  </MarketplaceErrorBoundary>
);

export const CheckoutErrorBoundary = ({ children }: { children: ReactNode }) => (
  <MarketplaceErrorBoundary
    routeName="Checkout"
    fallback={
      <div className="min-h-[500px] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">💳</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Checkout Error</h3>
          <p className="text-gray-600 mb-4">
            There was a problem with the checkout process. Your cart items are safe.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/cart'}
              className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Back to Cart
            </button>
          </div>
        </div>
      </div>
    }
  >
    {children}
  </MarketplaceErrorBoundary>
);

export const DashboardErrorBoundary = ({ children }: { children: ReactNode }) => (
  <MarketplaceErrorBoundary
    routeName="Dashboard"
    fallback={
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard Error</h3>
          <p className="text-gray-600 mb-4">Unable to load your dashboard data.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Reload Dashboard
          </button>
        </div>
      </div>
    }
  >
    {children}
  </MarketplaceErrorBoundary>
);

// Generic marketplace error boundary
export default MarketplaceErrorBoundary;
