"use client";

import { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import cmsService, { CmsSection, CmsPageResponse } from '../services/cmsService';
import { FALLBACK_HOMEPAGE_DATA } from '../services/cmsFallbackData';

// Section Components
import HeroCarousel from '../components/home/HeroCarousel';
import DealsSection from '../components/home/DealsSection';
import CategoryGrid from '../components/home/CategoryGrid';
import CoreValueStrip from '../components/home/CoreValueStrip';

interface HomePageProps {
  initialData?: CmsPageResponse;
}

// Loading Skeleton
function SectionSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  );
}

// Error State
function ErrorState({ message }: { message: string }) {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-12 text-center">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8">
        <h2 className="text-xl font-bold text-red-600 mb-2">Failed to load content</h2>
        <p className="text-gray-600">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

// Section Renderer
function renderSection(section: CmsSection) {
  const { type, items, config, title } = section;

  switch (type) {
    case 'carousel':
      return (
        <HeroCarousel
          key={section.id}
          slides={items.map((item) => item.data as any)}
          config={config}
        />
      );

    case 'deals':
      return (
        <DealsSection
          key={section.id}
          title={title}
          products={items.map((item) => item.data as any)}
          config={config}
        />
      );

    case 'categories':
      return (
        <CategoryGrid
          key={section.id}
          title={title}
          categories={items.map((item) => item.data as any)}
          config={config}
        />
      );

    case 'values':
      return (
        <CoreValueStrip
          key={section.id}
          title={title}
          values={items.map((item) => item.data as any)}
          config={config}
        />
      );

    case 'banner':
      // Future: Implement AdBanner component
      return null;

    case 'products':
      // Future: Implement ProductsSection component
      return null;

    default:
      console.warn(`Unknown section type: ${type}`);
      return null;
  }
}

export default function HomePage({ initialData }: HomePageProps = {}) {
  const [pageData, setPageData] = useState<CmsPageResponse | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if we don't have initial data
    if (initialData) {
      setPageData(initialData);
      setLoading(false);
      return;
    }

    async function fetchHomepage() {
      try {
        setLoading(true);
        setError(null);
        const data = await cmsService.getHomepage();
        setPageData(data);
      } catch (err: any) {
        console.warn('Failed to fetch homepage from CMS, using fallback data:', err);
        // Silent fallback - do not show error to user
        setPageData(FALLBACK_HOMEPAGE_DATA);
      } finally {
        setLoading(false);
      }
    }

    fetchHomepage();
  }, [initialData]);

  if (error) {
    return (
      <MainLayout>
        <ErrorState message={error} />
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-8 py-8">
          <div className="h-[400px] bg-gray-200 animate-pulse"></div>
          <div className="max-w-[1400px] mx-auto px-4">
            <SectionSkeleton />
          </div>
          <div className="max-w-[1400px] mx-auto px-4">
            <SectionSkeleton />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!pageData || pageData.sections.length === 0) {
    return (
      <MainLayout>
        <div className="max-w-[1400px] mx-auto px-4 py-12 text-center">
          <h2 className="text-xl font-bold text-gray-600">No content available</h2>
          <p className="text-gray-500 mt-2">Please check back later.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Render sections dynamically based on API response */}
      {pageData.sections
        .filter((section) => section.enabled)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((section) => renderSection(section))}
    </MainLayout>
  );
}