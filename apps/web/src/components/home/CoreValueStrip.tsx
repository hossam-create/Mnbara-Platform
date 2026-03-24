import { useTranslation } from 'react-i18next';

// Value Card interface for CMS data
export interface ValueData {
  id: string;
  title: string;
  description: string;
  icon: string; // Icon name (globe, link, dollar, shield)
  color: string; // Color classes (bg-blue-50 text-brand-blue)
}

export interface CoreValueStripConfig {
  showCTA?: boolean;
  ctaText?: string;
}

interface CoreValueStripProps {
  title?: string;
  values?: ValueData[];
  config?: CoreValueStripConfig;
}

// Icon mapping
const IconMap: Record<string, JSX.Element> = {
  globe: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  link: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  dollar: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  shield: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
};

const getIcon = (iconName: string) => IconMap[iconName] || IconMap.globe;

// Default values (fallback if no CMS data)
const DEFAULT_VALUES: ValueData[] = [
  { id: '1', title: 'homepage.values.items.travelEarn.title', description: 'homepage.values.items.travelEarn.desc', icon: 'globe', color: 'bg-blue-50 text-brand-blue' },
  { id: '2', title: 'homepage.values.items.pasteLink.title', description: 'homepage.values.items.pasteLink.desc', icon: 'link', color: 'bg-purple-50 text-purple-600' },
  { id: '3', title: 'homepage.values.items.auctions.title', description: 'homepage.values.items.auctions.desc', icon: 'dollar', color: 'bg-green-50 text-green-600' },
  { id: '4', title: 'homepage.values.items.protection.title', description: 'homepage.values.items.protection.desc', icon: 'shield', color: 'bg-orange-50 text-orange-600' },
];

export default function CoreValueStrip({ title, values, config }: CoreValueStripProps) {
  const { t } = useTranslation();
  const displayValues = values && values.length > 0 ? values : DEFAULT_VALUES;
  const sectionTitle = title || t('homepage.values.title');
  const showCTA = config?.showCTA !== false;
  const ctaText = config?.ctaText || t('homepage.values.cta');

  return (
    <section className="bg-gradient-to-br from-brand-blue to-brand-blueDark py-16">
      <div className="max-w-[1400px] mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">{t(sectionTitle)}</h2>
          <p className="text-lg text-white/80">
            {t('homepage.values.subtitle')}
          </p>
        </div>

        {/* Value Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayValues.map((card) => (
            <div
              key={card.id}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              <div className={`inline-flex p-3 rounded-lg ${card.color} mb-4`}>
                {getIcon(card.icon)}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t(card.title)}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t(card.description)}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        {showCTA && (
          <div className="text-center mt-12">
            <p className="text-white/90 mb-4">{t('homepage.values.ctaSubtitle')}</p>
            <button className="px-8 py-3 bg-brand-yellow hover:bg-yellow-400 text-gray-900 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
              {t(ctaText)}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
