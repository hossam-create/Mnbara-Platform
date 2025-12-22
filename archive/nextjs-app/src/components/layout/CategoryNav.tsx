"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './CategoryNav.module.css';

type CategoryLink = {
  href: string;
  label: string;
  activePath?: string;
};

const categoryLinks: CategoryLink[] = [
  { href: '/', label: 'Home' },
  { href: '/browse?collection=spotlight', label: 'Spotlight finds', activePath: '/browse' },
  { href: '/browse?collection=city-gems', label: 'City gems', activePath: '/browse' },
  { href: '/browse?collection=designers', label: 'Designer drops', activePath: '/browse' },
  { href: '/browse?collection=tech', label: 'Tech in transit', activePath: '/browse' },
  { href: '/browse?collection=home-luxe', label: 'Luxe for home', activePath: '/browse' },
  { href: '/browse?collection=wellness', label: 'Wellness edit', activePath: '/browse' },
  { href: '/browse?collection=seasonal', label: 'Seasonal picks', activePath: '/browse' },
  { href: '/browse?collection=local', label: 'Local favourites', activePath: '/browse' },
  { href: '/browse?collection=limited', label: 'Limited runs', activePath: '/browse' },
];

const secondaryLinks = [
  { href: '/request', label: 'Request item' },
  { href: '/register', label: 'Become a traveler' },
  { href: '/login', label: 'Sign in' },
];

export function CategoryNav() {
  const pathname = usePathname();
  const currentPath = pathname.split('?')[0];

  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <Link href="/browse" className={styles.shopButton}>
          <span className={styles.shopIcon}>☰</span>
          Shop by category
        </Link>

        <div className={styles.categoryScroller}>
          {categoryLinks.map((link) => {
            const basePath = link.activePath ?? link.href.split('?')[0];
            const isActive = currentPath === basePath;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className={styles.secondaryGroup}>
          {secondaryLinks.map((link) => (
            <Link key={link.label} href={link.href} className={styles.secondaryLink}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
