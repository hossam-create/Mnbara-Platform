import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { LegalSlug } from '@/data/legalPages';
import { legalPages, legalPageSlugs } from '@/data/legalPages';
import styles from './page.module.css';

export function generateStaticParams() {
  return legalPageSlugs.map((slug) => ({ slug }));
}

type LegalPageProps = {
  params: { slug: LegalSlug };
};

export default function LegalPage({ params }: LegalPageProps) {
  const legal = legalPages[params.slug];

  if (!legal) {
    notFound();
  }

  return (
    <div className={styles.root}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>Mnbarh legal</p>
          <h1 className={styles.title}>{legal.titleEn}</h1>
          <p className={styles.summary}>{legal.summaryEn}</p>
          <div className={styles.metaRow}>
            <span>Updated {legal.updated}</span>
            <a href="#arabic-content" className={styles.tocLink}>
              العربية ↓
            </a>
          </div>
        </div>
      </header>

      <section className={styles.bodySection}>
        <div className={styles.bodyInner}>
          <article className={styles.toc}>
            <p className={styles.tocTitle}>Contents</p>
            <ul className={styles.tocList}>
              {legal.sections.map((section) => (
                <li key={section.id}>
                  <a className={styles.tocLink} href={`#${section.id}`}>
                    {section.headingEn}
                  </a>
                </li>
              ))}
            </ul>
          </article>

          <div className={styles.sectionGrid}>
            {legal.sections.map((section) => (
              <article key={section.id} id={section.id} className={styles.sectionCard}>
                <div>
                  <h2 className={styles.sectionHeading}>{section.headingEn}</h2>
                  <p className={styles.sectionBody}>{section.bodyEn}</p>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.sectionGrid} id="arabic-content" dir="rtl" lang="ar">
            {legal.sections.map((section) => (
              <article key={`ar-${section.id}`} className={styles.sectionCard}>
                <h2 className={styles.sectionHeading}>{section.headingAr}</h2>
                <p className={styles.arabicBody}>{section.bodyAr}</p>
              </article>
            ))}
          </div>

          <div className={styles.actionsRow}>
            <Link href="/register" className={styles.primaryLink}>
              Create account
            </Link>
            <Link href="/support" className={styles.secondaryLink}>
              Contact legal support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
