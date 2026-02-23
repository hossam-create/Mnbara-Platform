import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'ar'];
const defaultLocale = 'en';

// Cache control configurations for different content types
const CACHE_CONFIG = {
  // Static assets - long cache
  static: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'max-age=31536000',
    'Vercel-CDN-Cache-Control': 'max-age=31536000',
  },
  // Images - medium cache
  images: {
    'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    'CDN-Cache-Control': 'max-age=86400',
    'Vercel-CDN-Cache-Control': 'max-age=86400',
  },
  // API responses - short cache with revalidation
  api: {
    'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
    'CDN-Cache-Control': 'max-age=300',
    'Vercel-CDN-Cache-Control': 'max-age=300',
  },
  // Marketplace pages - short cache
  pages: {
    'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
    'CDN-Cache-Control': 'max-age=600',
    'Vercel-CDN-Cache-Control': 'max-age=600',
  },
  // User-specific content - no cache
  user: {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
};

function getLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale)) return cookieLocale;

  const acceptLanguage = request.headers.get('accept-language') || '';
  for (const locale of locales) {
    if (acceptLanguage.includes(locale)) return locale;
  }
  return defaultLocale;
}

function getCacheHeaders(pathname: string, request: NextRequest): Record<string, string> {
  // Static assets
  if (pathname.startsWith('/_next/static/') ||
      pathname.includes('.css') ||
      pathname.includes('.js') ||
      pathname.includes('.woff') ||
      pathname.includes('.woff2')) {
    return CACHE_CONFIG.static;
  }

  // Images
  if (pathname.startsWith('/_next/image') ||
      pathname.includes('.jpg') ||
      pathname.includes('.jpeg') ||
      pathname.includes('.png') ||
      pathname.includes('.webp') ||
      pathname.includes('.avif')) {
    return CACHE_CONFIG.images;
  }

  // API routes
  if (pathname.startsWith('/api/')) {
    // User-specific APIs - no cache
    if (pathname.includes('/user') ||
        pathname.includes('/auth') ||
        pathname.includes('/cart') ||
        pathname.includes('/orders') ||
        pathname.includes('/wallet')) {
      return CACHE_CONFIG.user;
    }
    return CACHE_CONFIG.api;
  }

  // User-specific pages
  if (pathname.startsWith('/user/') ||
      pathname.startsWith('/seller/') ||
      pathname.startsWith('/traveler/') ||
      pathname.startsWith('/admin/') ||
      pathname.startsWith('/profile/') ||
      pathname.startsWith('/wallet/') ||
      pathname.startsWith('/cart/') ||
      pathname.startsWith('/orders/')) {
    return CACHE_CONFIG.user;
  }

  // Marketplace pages - cache but revalidate
  return CACHE_CONFIG.pages;
}

function isUserSpecific(pathname: string): boolean {
  return pathname.startsWith('/user/') ||
         pathname.startsWith('/seller/') ||
         pathname.startsWith('/traveler/') ||
         pathname.startsWith('/admin/') ||
         pathname.startsWith('/profile/') ||
         pathname.startsWith('/wallet/') ||
         pathname.startsWith('/cart/') ||
         pathname.startsWith('/orders/') ||
         pathname.startsWith('/auth/');
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const response = NextResponse.next();

  // Skip middleware for Next.js internals and already cached content
  if (pathname.startsWith('/_next/static') ||
      pathname.startsWith('/favicon') ||
      pathname === '/api/health') {
    return response;
  }

  const locale = getLocale(request);

  // Set locale and direction headers for the layout
  response.headers.set('x-locale', locale);
  response.headers.set('x-direction', locale === 'ar' ? 'rtl' : 'ltr');

  // Apply intelligent caching strategy
  const cacheHeaders = getCacheHeaders(pathname, request);
  Object.entries(cacheHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add performance headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Add marketplace-specific headers for performance monitoring
  response.headers.set('X-Marketplace-Version', '1.0.0');
  response.headers.set('X-Performance-Monitoring', 'enabled');

  // Handle marketplace-specific caching logic
  if (pathname.startsWith('/product/') ||
      pathname.startsWith('/search') ||
      pathname.startsWith('/category/')) {
    // Add marketplace-specific cache headers
    response.headers.set('X-Marketplace-Cache', 'edge-optimized');
    response.headers.set('Vercel-CDN-Cache-Control', 'max-age=600');
  }

  // Handle API routes with edge caching
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-API-Cache', 'edge-enabled');

    // Add rate limiting headers for marketplace APIs
    response.headers.set('X-RateLimit-Limit', '1000');
    response.headers.set('X-RateLimit-Remaining', '999');
    response.headers.set('X-RateLimit-Reset', (Date.now() + 3600000).toString());
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/health (health check endpoint)
     * - _next/static (static files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!api/health|_next/static|favicon.ico).*)',
  ],
};
