import Link from 'next/link';
import type { Category, RequestItem } from '@/data/marketplace';
import { fetchApi } from '@/lib/serverApi';
import styles from './page.module.css';

type CategoriesResponse = {
  data: Category[];
  total: number;
};

type RequestsResponse = {
  data: RequestItem[];
  total: number;
};

export default async function HomePage() {
  const categoriesPromise = fetchApi<CategoriesResponse>('/api/categories', {
    next: { revalidate: 300 },
  });
  const trendingPromise = fetchApi<RequestsResponse>('/api/requests?sort=reward-desc&limit=4', {
    next: { revalidate: 60 },
  });
  const recentPromise = fetchApi<RequestsResponse>('/api/requests?sort=latest&limit=4', {
    next: { revalidate: 60 },
  });

  const [categories, trending, recent] = await Promise.all([
    categoriesPromise,
    trendingPromise,
    recentPromise,
  ]);

  return (
    <div className={styles.root}>
      <HeroSection categories={categories.data} requestsCount={trending.total + recent.total} />
      <FeaturedCategoriesSection categories={categories.data} />
      <RequestsSection
        eyebrow="Trending now"
        title="Travelers are bidding on these rewards"
        copy="Hand-picked high-reward requests from seekers around Mnbarh. Manual sorting keeps recommendations advisory only."
        requests={trending.data}
        emptyMessage="No trending requests yet. Launch a request to start the momentum."
      />
      <RequestsSection
        eyebrow="Freshly added"
        title="Recently posted requests"
        copy="Monitor what&apos;s newly added before travelers claim the routes."
        requests={recent.data}
        emptyMessage="No recent requests at the moment. Check back soon as travelers announce new trips."
      />
      <CalloutSection />
    </div>
  );
}

type HeroProps = {
  categories: Category[];
  requestsCount: number;
};

function HeroSection({ categories, requestsCount }: HeroProps) {
  const heroStats = [
    { label: 'Active requests', value: requestsCount.toString() },
    { label: 'Featured collections', value: categories.length.toString() },
    { label: 'Trusted travelers', value: '2.4K+' },
  ];

  return (
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.heroContent}>
          <span className={styles.heroEyebrow}>Marketplace preview</span>
          <h1 className={styles.heroTitle}>
            Secure rare finds. <br />
            Travelers deliver person-to-person.
          </h1>
          <p className={styles.heroCopy}>
            Mnbarh mirrors the best of eBay-style discovery for the Middle East—transparent rewards, trusted
            couriers, and no auto-matching. You stay in control of every exchange.
          </p>
          <div className={styles.heroActions}>
            <Link href="/browse" className={styles.heroButtonPrimary}>
              Shop live requests
            </Link>
            <Link href="/request" className={styles.heroButtonGhost}>
              Launch a request
            </Link>
          </div>
        </div>
        <div className={styles.heroStats}>
          {heroStats.map((stat) => (
            <div key={stat.label} className={styles.heroStatCard}>
              <span className={styles.heroStatValue}>{stat.value}</span>
              <span className={styles.heroStatLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

type FeaturedProps = {
  categories: Category[];
};

function FeaturedCategoriesSection({ categories }: FeaturedProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionInner}>
        <header className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Featured categories</span>
          <h2 className={styles.sectionTitle}>Curated like an eBay storefront</h2>
          <p className={styles.sectionCopy}>
            Explore Mnbarh capsules curated by category managers. Data is purely advisory—manual navigation keeps
            discovery transparent.
          </p>
        </header>

        {categories.length === 0 ? (
          <div className={styles.emptyStateCard}>
            <p>No categories published yet.</p>
            <p>Once category editors add them, you&apos;ll see highlights right here.</p>
          </div>
        ) : (
          <div className={styles.categoriesGrid}>
            {categories.map((category) => (
              <article key={category.id} className={styles.categoryCard}>
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className={styles.categoryImage}
                  loading="lazy"
                />
                {category.featuredBadge && (
                  <span className={styles.categoryBadge}>{category.featuredBadge}</span>
                )}
                <div className={styles.categoryBody}>
                  <h3 className={styles.categoryTitle}>{category.name}</h3>
                  <p className={styles.categoryDescription}>{category.description}</p>
                  <span className={styles.categoryMeta}>{category.collectionCount} live collections</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

type RequestsSectionProps = {
  eyebrow: string;
  title: string;
  copy: string;
  requests: RequestItem[];
  emptyMessage: string;
};

function RequestsSection({ eyebrow, title, copy, requests, emptyMessage }: RequestsSectionProps) {
  return (
    <section className={`${styles.section} ${styles.requestSection}`}>
      <div className={styles.sectionInner}>
        <header className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>{eyebrow}</span>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.sectionCopy}>{copy}</p>
        </header>

        {requests.length === 0 ? (
          <div className={styles.emptyStateCard}>
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <div className={styles.requestsGrid}>
            {requests.map((request) => (
              <article key={request.id} className={styles.requestCard}>
                <img
                  src={request.imageUrl}
                  alt={request.title}
                  className={styles.requestImage}
                  loading="lazy"
                />
                <div className={styles.requestBody}>
                  <span className={styles.trustBadge}>{request.trustBadge}</span>
                  <h3 className={styles.requestTitle}>{request.title}</h3>
                  <div className={styles.requestMeta}>
                    <span>From {request.originCountry}</span>
                    <span>To {request.destinationCountry}</span>
                  </div>
                  <div className={styles.requestReward}>${request.rewardUSD} reward</div>
                  <div className={styles.requestFooter}>
                    <span>Travel date: {new Date(request.travelDate).toLocaleDateString()}</span>
                    <span>Status: {request.status}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CalloutSection() {
  return (
    <section className={styles.ctaSection}>
      <div className={styles.ctaInner}>
        <h2 className={styles.ctaHeading}>Stay advisory. Stay in control.</h2>
        <p className={styles.ctaCopy}>
          Mnbarh refuses auto-matching or hidden ranking. Every traveler interaction is manual and transparent—just
          like classic marketplace trading.
        </p>
        <Link href="/register" className={styles.ctaButton}>
          Become a traveler
        </Link>
      </div>
    </section>
  );
}

