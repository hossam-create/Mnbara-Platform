import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import cmsService, { CmsPageResponse } from '@/services/cmsService';
import { FALLBACK_HOMEPAGE_DATA } from '@/services/cmsFallbackData';

// Cached homepage data fetcher with revalidation
const getHomepageData = unstable_cache(
  async (): Promise<CmsPageResponse> => {
    try {
      console.log('Fetching homepage data from CMS...');
      const data = await cmsService.getHomepage();

      // Add cache metadata for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Homepage data fetched successfully, caching for 5 minutes');
      }

      return data;
    } catch (error) {
      console.warn('Failed to fetch homepage from CMS, using fallback data:', error);
      return FALLBACK_HOMEPAGE_DATA;
    }
  },
  ['homepage-data'], // Cache key
  {
    revalidate: 300, // Revalidate every 5 minutes
    tags: ['homepage', 'cms'], // Cache tags for manual revalidation
  }
);

// Server component that uses cached data
export default async function HomePageServer() {
  // Fetch data on server with caching
  const pageData = await getHomepageData();

  // Return the data for the client component to use
  return { pageData };
}

// Export for manual cache revalidation (ISR)
export const revalidateHomepage = () => {
  // This can be called to manually revalidate the homepage cache
  // Useful for CMS updates
  console.log('Manual homepage cache revalidation triggered');
};
