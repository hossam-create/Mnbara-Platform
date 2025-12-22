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

type BrowsePageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

const SORT_OPTIONS = [
  { value: 'latest', label: 'Newest first' },
  { value: 'reward-desc', label: 'Reward: High to low' },
  { value: 'reward-asc', label: 'Reward: Low to high' },
  { value: 'travel-date', label: 'Travel date' },
];

const isValidSort = (value: string): value is RequestsResponse['data'][number]['status'] => {
  return ['latest', 'reward-desc', 'reward-asc', 'travel-date'].includes(value);
};

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const getParam = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value || '';
  };

  const categoryId = getParam('categoryId');
  const destinationCountry = getParam('destinationCountry');
  const minReward = getParam('minReward');
  const maxReward = getParam('maxReward');
  const travelDate = getParam('travelDate');
  const sortParam = getParam('sort');
  const sort = isValidSort(sortParam) ? sortParam : 'latest';

  const query = new URLSearchParams({ sort, limit: '24' });
  if (categoryId) query.set('categoryId', categoryId);
  if (destinationCountry) query.set('destinationCountry', destinationCountry);
  if (minReward) query.set('minReward', minReward);
  if (maxReward) query.set('maxReward', maxReward);
  if (travelDate) query.set('travelDate', travelDate);

  const [categories, requests] = await Promise.all([
    fetchApi<CategoriesResponse>('/api/categories', { next: { revalidate: 300 } }),
    fetchApi<RequestsResponse>(`/api/requests?${query.toString()}`, { next: { revalidate: 60 } }),
  ]);

  const appliedFilters: { label: string; value: string }[] = [];
  if (categoryId) {
    const category = categories.data.find((cat) => cat.id === categoryId);
    appliedFilters.push({ label: 'Category', value: category?.name ?? categoryId });
  }
  if (destinationCountry) appliedFilters.push({ label: 'Destination', value: destinationCountry });
  if (minReward) appliedFilters.push({ label: 'Min reward', value: `$${minReward}` });
  if (maxReward) appliedFilters.push({ label: 'Max reward', value: `$${maxReward}` });
  if (travelDate) appliedFilters.push({ label: 'Travel date', value: travelDate });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
      value,
    );

  const totalLabel =
    requests.total === 1 ? '1 request matches your filters.' : `${requests.total} requests match your filters.`;

  return (
    <div className={styles.root}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>Mnbarh marketplace</p>
          <h1 className={styles.title}>Browse advisory-only requests</h1>
          <p className={styles.subtitle}>
            Sticky filters emulate the eBay browse experience—manual, transparent, and free from auto-matching. Every
            search parameter is optional, so you stay fully in control.
          </p>
        </div>
      </header>

      <section className={styles.layout}>
        <div className={styles.layoutInner}>
          <form className={styles.filtersPanel} method="get">
            <h2 className={styles.filterTitle}>Narrow your results</h2>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} htmlFor="destinationCountry">
                Destination country
              </label>
              <input
                id="destinationCountry"
                name="destinationCountry"
                className={styles.filterInput}
                placeholder="e.g. UAE"
                defaultValue={destinationCountry}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} htmlFor="categoryId">
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={categoryId}
                className={styles.filterSelect}
              >
                <option value="">All categories</option>
                {categories.data.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Reward range (USD)</label>
              <div className={styles.rewardInputs}>
                <input
                  type="number"
                  name="minReward"
                  min="0"
                  placeholder="Min"
                  className={styles.filterInput}
                  defaultValue={minReward}
                />
                <input
                  type="number"
                  name="maxReward"
                  min="0"
                  placeholder="Max"
                  className={styles.filterInput}
                  defaultValue={maxReward}
                />
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} htmlFor="travelDate">
                Travel date
              </label>
              <input
                id="travelDate"
                name="travelDate"
                type="date"
                className={styles.filterInput}
                defaultValue={travelDate}
              />
            </div>

            <input type="hidden" name="sort" value={sort} />

            <div className={styles.filterActions}>
              <button type="submit" className={styles.applyButton}>
                Apply filters
              </button>
              <Link href="/browse" className={styles.resetLink}>
                Reset
              </Link>
            </div>
          </form>

          <section className={styles.resultsSection}>
            <div className={styles.resultsHeader}>
              <div>
                <h2 className={styles.resultsTitle}>Marketplace results</h2>
                <p className={styles.resultsSummary}>{totalLabel}</p>
              </div>

              <form className={styles.sortForm} method="get">
                <input type="hidden" name="categoryId" value={categoryId} />
                <input type="hidden" name="destinationCountry" value={destinationCountry} />
                <input type="hidden" name="minReward" value={minReward} />
                <input type="hidden" name="maxReward" value={maxReward} />
                <input type="hidden" name="travelDate" value={travelDate} />
                <label className={styles.sortLabel} htmlFor="sort">
                  Sort
                </label>
                <select id="sort" name="sort" defaultValue={sort} className={styles.sortSelect}>
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button type="submit" className={styles.applyButton}>
                  Update sort
                </button>
              </form>
            </div>

            {appliedFilters.length > 0 && (
              <div className={styles.appliedFilters}>
                {appliedFilters.map((filter) => (
                  <span key={filter.label} className={styles.filterChip}>
                    {filter.label}: {filter.value}
                  </span>
                ))}
              </div>
            )}

            {requests.data.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No requests match your current filters.</p>
                <p>Try widening the reward range or clearing the travel date.</p>
              </div>
            ) : (
              <div className={styles.cardsGrid}>
                {requests.data.map((request) => (
                  <article key={request.id} className={styles.card}>
                    <img
                      src={request.imageUrl}
                      alt={request.title}
                      className={styles.cardImage}
                      loading="lazy"
                    />
                    <div className={styles.cardBody}>
                      <span className={styles.cardTrust}>{request.trustBadge}</span>
                      <h3 className={styles.cardTitle}>{request.title}</h3>
                      <div className={styles.cardMeta}>
                        <span>From {request.originCountry}</span>
                        <span>To {request.destinationCountry}</span>
                      </div>
                      <div className={styles.cardReward}>{formatCurrency(request.rewardUSD)}</div>
                      <div className={styles.cardFooter}>
                        <span>Travel date: {new Date(request.travelDate).toLocaleDateString()}</span>
                        <span>Status: {request.status}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className={styles.ctaPanel}>
              <h3 className={styles.panelHeading}>Not seeing your desired item?</h3>
              <p className={styles.panelCopy}>
                Mnbarh broadcasts new requests to verified travelers within minutes—no ranking manipulation, just
                advisory notifications.
              </p>
              <Link href="/request" className={styles.panelButton}>
                Launch a custom request
              </Link>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
