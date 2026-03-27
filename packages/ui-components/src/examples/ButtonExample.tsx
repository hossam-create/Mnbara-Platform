import React from 'react';
import styles from '../Button.module.css';

/**
 * Example component demonstrating CSS Modules usage with Button
 * This shows how to properly import and use CSS module classes
 */
export const ButtonExample: React.FC = () => {
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2>Button Component with CSS Modules</h2>
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button className={`${styles.button} ${styles.primary} ${styles.md}`}>
          Primary Button
        </button>
        
        <button className={`${styles.button} ${styles.secondary} ${styles.md}`}>
          Secondary Button
        </button>
        
        <button className={`${styles.button} ${styles.success} ${styles.md}`}>
          Success Button
        </button>
        
        <button className={`${styles.button} ${styles.danger} ${styles.md}`}>
          Danger Button
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button className={`${styles.button} ${styles.primary} ${styles.sm}`}>
          Small
        </button>
        
        <button className={`${styles.button} ${styles.primary} ${styles.md}`}>
          Medium
        </button>
        
        <button className={`${styles.button} ${styles.primary} ${styles.lg}`}>
          Large
        </button>
      </div>
      
      <div>
        <button 
          className={`${styles.button} ${styles.primary} ${styles.md} ${styles.fullWidth}`}
        >
          Full Width Button
        </button>
      </div>
      
      <div>
        <button 
          className={`${styles.button} ${styles.primary} ${styles.md} ${styles.loading}`}
          disabled
        >
          <span className={styles.spinner}>⟳</span>
          Loading...
        </button>
      </div>
    </div>
  );
};
