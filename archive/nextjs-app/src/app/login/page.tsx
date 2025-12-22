import Link from 'next/link';
import styles from './page.module.css';

export default function LoginPage() {
  return (
    <div className={styles.root}>
      <div className={styles.panel}>
        <h1 className={styles.heading}>Sign in to Mnbarh</h1>
        <p className={styles.copy}>
          Secure access for seekers and travelers. Authentication wiring arrives soon — for now, this is a
          styled placeholder.
        </p>
        <div className={styles.formSkeleton}>
          <div className={styles.inputStub} />
          <div className={styles.inputStub} />
          <div className={styles.buttonStub} />
        </div>
        <p className={styles.meta}>
          New to Mnbarh?{' '}
          <Link href="/register" className={styles.metaLink}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
