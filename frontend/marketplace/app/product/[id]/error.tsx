'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Product page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Unable to Load Product
        </h1>
        <p className="text-gray-600 mb-6">
          We encountered an error while loading this product. Please try again.
        </p>
        <div className="space-y-3">
          <Button onClick={reset} className="w-full">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
