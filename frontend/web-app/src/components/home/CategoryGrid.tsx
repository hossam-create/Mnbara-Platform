import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Category interface for CMS data
export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  icon: string; // Icon name (smartphone, shirt, home, etc.)
  color: string; // Gradient class (from-blue-500 to-blue-600)
}

export interface CategoryGridConfig {
  columns?: number;
}

interface CategoryGridProps {
  title?: string;
  categories?: CategoryData[];
  config?: CategoryGridConfig;
}

// Icon mapping
const IconMap: Record<string, JSX.Element> = {
  smartphone: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  shirt: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  home: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  activity: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  star: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  globe: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const getIcon = (iconName: string) => IconMap[iconName] || IconMap.star;

// Default categories (fallback if no CMS data)
const DEFAULT_CATEGORIES: CategoryData[] = [
  { id: '1', name: 'homepage.categories.items.electronics', slug: 'electronics', icon: 'smartphone', color: 'from-blue-500 to-blue-600' },
  { id: '2', name: 'homepage.categories.items.fashion', slug: 'fashion', icon: 'shirt', color: 'from-pink-500 to-pink-600' },
  { id: '3', name: 'homepage.categories.items.homeGarden', slug: 'home-garden', icon: 'home', color: 'from-green-500 to-green-600' },
  { id: '4', name: 'homepage.categories.items.sports', slug: 'sports', icon: 'activity', color: 'from-orange-500 to-orange-600' },
  { id: '5', name: 'homepage.categories.items.collectibles', slug: 'collectibles', icon: 'star', color: 'from-purple-500 to-purple-600' },
  { id: '6', name: 'homepage.categories.items.travelRequests', slug: 'travel-requests', icon: 'globe', color: 'from-cyan-500 to-cyan-600' },
];

export default function CategoryGrid({ title, categories, config }: CategoryGridProps) {
  const { t } = useTranslation();
  const displayCategories = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const sectionTitle = title || t('homepage.categories.title');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const columns = config?.columns || 6;

  return (
    <section className="max-w-[1400px] mx-auto px-4 py-12">
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{t(sectionTitle)}</h2>
        <p className="text-sm text-gray-600">{t('homepage.categories.subtitle')}</p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {displayCategories.map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.slug}`}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-br shadow-md hover:shadow-xl transition-all transform hover:scale-105"
          >
            <div className={`bg-gradient-to-br ${category.color} p-6 text-white`}>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="opacity-90 group-hover:opacity-100 transition-opacity">
                  {getIcon(category.icon)}
                </div>
                <h3 className="font-semibold text-sm leading-tight">{t(category.name)}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
