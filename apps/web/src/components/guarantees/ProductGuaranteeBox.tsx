import React from 'react';
import styles from './ProductGuaranteeBox.module.css';

interface ProductGuaranteeBoxProps {
  variant?: 'product' | 'checkout';
  className?: string;
}

export default function ProductGuaranteeBox({ 
  variant = 'product', 
  className = '' 
}: ProductGuaranteeBoxProps) {
  return (
    <div className={`${styles.guaranteeBox} ${styles[variant]} ${className}`}>
      <div className={styles.icon}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 8l3-3V5l-9 4z" />
          <path d="M12 1l9 4v6c0 5.55-3.84 10.74-9 8l-3-3V5l9 4z" />
          <path d="M12 1v6l9 4" />
        </svg>
      </div>
      
      <div className={styles.content}>
        <h3 className={styles.title}>
          Protected by MNbarh Buyer Guarantee
        </h3>
        
        <p className={styles.description}>
          {variant === 'product' 
            ? "Funds held securely until order completion"
            : "Your payment is secured under MNbarh Financial Guarantee."
          }
        </p>
        
        <div className={styles.tooltip}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0 2h-2v2h2v-2z"/>
          </svg>
          <span className={styles.tooltipText}>
            Your payment is released only after successful delivery or dispute resolution.
          </span>
        </div>
      </div>
      
      {variant === 'product' && (
        <div className={styles.shield}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 8l3-3V5l-9 4z" />
            <path d="M12 1l9 4v6c0 5.55-3.84 10.74-9 8l-3-3V5l9 4z" />
          </svg>
        </div>
      )}
    </div>
  );
}
