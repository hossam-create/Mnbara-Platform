import { unstable_cache } from 'next/cache';
import cmsService, { CmsPageResponse } from '@/services/cmsService';
import { FALLBACK_HOMEPAGE_DATA } from '@/services/cmsFallbackData';
import HomePage from '@/pages/HomePage';

// Cached homepage data fetcher
const getHomepageData = unstable_cache(
  async (): Promise<CmsPageResponse> => {
    try {
      console.log('🔄 Fetching homepage data from CMS (cached)...');
      const data = await cmsService.getHomepage();
      return data;
    } catch (error) {
      console.warn('⚠️ Failed to fetch homepage from CMS, using fallback data:', error);
      return FALLBACK_HOMEPAGE_DATA;
    }
  },
  ['homepage-cached'], // Cache key
  {
    revalidate: 300, // Revalidate every 5 minutes
    tags: ['homepage', 'cms', 'marketplace'], // Cache tags for manual revalidation
  }
);

// Server component with cached data
export default async function Home() {
  // Fetch data on server with caching
  const pageData = await getHomepageData();

  // Pass cached data to client component
  return <HomePage initialData={pageData} />;
}
