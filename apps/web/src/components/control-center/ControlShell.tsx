import { Link } from 'react-router-dom';
import { ReactNode } from 'react';
import { controlNavSections } from './navConfig';
import styles from './ControlShell.module.css';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

type Props = {
  children: ReactNode;
};

import { useTranslation } from 'react-i18next'; // Add import

// ...

export function ControlShell({ children }: Props) {
  const { t } = useTranslation();

  return (
    <div className={styles.shell}>
      <aside className={styles.nav}>
        <div className={styles.brand}>
          <div className="flex justify-between items-start">
            <div>
              <span className={styles.badge}>{t('header.shipControl')}</span>
              <p>{t('header.bridgeConsole')}</p>
            </div>
            <LanguageSwitcher />
          </div>
          <small>{t('header.zeroTrust')}</small>
        </div>
        <nav>
          {controlNavSections.map((section) => (
            <div key={section.title} className={styles.section}>
              <p className={styles.sectionTitle}>{t(section.title)}</p>
              <ul>
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link to={item.href} className={styles.link}>
                      <span className={styles.icon}>{item.icon}</span>
                      <div>
                        <span className={styles.linkName}>{t(item.name)}</span>
                        {item.description && <small>{t(item.description)}</small>}
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

export default ControlShell;
