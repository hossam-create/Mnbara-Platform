import Link from 'next/link';
import styles from './Footer.module.css';

const footerSections = [
  {
    title: 'Explore',
    links: [
      { href: '/browse?collection=spotlight', label: 'Spotlight collections' },
      { href: '/browse?collection=limited', label: 'Limited runs' },
      { href: '/browse?collection=city-gems', label: 'City guides' },
      { href: '/browse?collection=designers', label: 'Designer drops' },
    ],
  },
  {
    title: 'Partner',
    links: [
      { href: '/request', label: 'Create a request' },
      { href: '/register', label: 'Become a traveler' },
      { href: '/support', label: 'Partner playbook' },
    ],
  },
  {
    title: 'Tools',
    links: [
      { href: '/dashboard', label: 'Mnbarh dashboard' },
      { href: '/support/security', label: 'Traveler security' },
      { href: '/apps', label: 'Mobile apps' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'Our story' },
      { href: '/about/team', label: 'Team' },
      { href: '/press', label: 'Press room' },
    ],
  },
  {
    title: 'About Mnbarh',
    links: [
      { href: '/about', label: 'Company info' },
      { href: '/about', label: 'News' },
      { href: '/about', label: 'Investors' },
      { href: '/about', label: 'Careers' },
    ],
  },
  {
    title: 'Care',
    links: [
      { href: '/support', label: 'Support center' },
      { href: '/support/contact', label: 'Contact us' },
      { href: '/support/policies', label: 'Policies' },
    ],
  },
  {
    title: 'Community',
    links: [
      { href: '/community', label: 'Announcements' },
      { href: '/community/forum', label: 'Forum' },
      { href: '/community/stories', label: 'Stories' },
    ],
  },
  {
    title: 'Destinations',
    links: [
      { href: '/destinations/dubai', label: 'Dubai' },
      { href: '/destinations/paris', label: 'Paris' },
      { href: '/destinations/tokyo', label: 'Tokyo' },
      { href: '/destinations', label: 'All destinations' },
    ],
  },
];

const legalLinks = [
  { href: '/legal/user-agreement', label: 'User agreement' },
  { href: '/legal/privacy', label: 'Privacy' },
  { href: '/legal/cookies', label: 'Cookies' },
  { href: '/legal/trust-and-guarantee', label: 'Trust & guarantee' },
  { href: '/legal/dispute-policy', label: 'Dispute policy' },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          {footerSections.map((section) => (
            <div key={section.title}>
              <p className={styles.sectionTitle}>{section.title}</p>
              <ul className={styles.links}>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={styles.link}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.bottomBar}>
          <select className={styles.languageSelect} aria-label="Select site language">
            <option>English (US)</option>
            <option>English (UK)</option>
            <option>Deutsch</option>
            <option>Français</option>
          </select>
          <span>© {new Date().getFullYear()} Mnbarh. Crafted for global seekers.</span>
          <div className={styles.legalLinks}>
            {legalLinks.map((link) => (
              <Link key={link.label} href={link.href} className={styles.legalLink}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
