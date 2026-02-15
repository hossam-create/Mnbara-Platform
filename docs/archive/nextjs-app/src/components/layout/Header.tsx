import Link from 'next/link';
import styles from './Header.module.css';

const utilityLinks = [
  { href: '/about', label: 'About Mnbarh' },
  { href: '/support', label: 'Support' },
  { href: '/request', label: 'Create a Request' },
];

const accountLinks = [
  { href: '/register', label: 'Join Mnbarh' },
  { href: '/browse', label: 'Track Requests' },
  { href: '/login', label: 'Sign in', bold: true },
];

const categories = [
  'All categories',
  'Lifestyle & Fashion',
  'Tech & Gadgets',
  'Beauty & Wellness',
  'Home & Living',
  'Premium Finds',
  'Local Favorites',
];

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.utilityBar}>
        <div className={styles.utilityContent}>
          <div className={styles.utilityLinks}>
            {utilityLinks.map((link) => (
              <Link key={link.href} href={link.href} className={styles.utilityLink}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className={styles.utilityActions}>
            {accountLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={styles.utilityLink}
                style={link.bold ? { fontWeight: 700, color: '#111820' } : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.mainHeader}>
        <div className={styles.mainContent}>
          <Link href="/" className={styles.logo} aria-label="Mnbarh home">
            <span className={styles.logoWordmark}>MNBARH</span>
            <span className={styles.logoBadge}>Premier travel sourcing</span>
          </Link>

          <form className={styles.searchForm}>
            <select className={styles.categorySelect} aria-label="Select category">
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Find products or destination city"
              aria-label="Search global requests"
            />
            <button type="submit" className={styles.searchButton}>
              Discover
            </button>
          </form>

          <div className={styles.headerActions}>
            <Link href="/browse" className={styles.actionButton}>
              <span className={styles.iconWrapper}>✈️</span>
              Traveler hub
            </Link>
            <Link href="/request" className={styles.actionButton}>
              <span className={styles.iconWrapper}>🛍️</span>
              New request
            </Link>
            <Link href="/login" className={styles.actionButton}>
              <span className={styles.iconWrapper}>👤</span>
              Account
            </Link>
          </div>

          <button type="button" className={styles.menuToggle} aria-label="Open menu">
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}
