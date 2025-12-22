import Link from 'next/link';
import { ReactNode } from 'react';
import { controlNavSections } from './navConfig';
import styles from './ControlShell.module.css';

type Props = {
  children: ReactNode;
};

export function ControlShell({ children }: Props) {
  return (
    <div className={styles.shell}>
      <aside className={styles.nav}>
        <div className={styles.brand}>
          <span className={styles.badge}>Ship Control</span>
          <p>Bridge Console</p>
          <small>Zero-trust oversight</small>
        </div>
        <nav>
          {controlNavSections.map((section) => (
            <div key={section.title} className={styles.section}>
              <p className={styles.sectionTitle}>{section.title}</p>
              <ul>
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={styles.link}>
                      <span className={styles.icon}>{item.icon}</span>
                      <div>
                        <span className={styles.linkName}>{item.name}</span>
                        <small>{item.description}</small>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <section className={styles.main}>
        <div className={styles.content}>{children}</div>
      </section>
    </div>
  );
}
