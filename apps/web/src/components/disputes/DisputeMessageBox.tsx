import React from 'react';
import styles from './DisputeMessageBox.module.css';

interface DisputeMessageBoxProps {
  title: string;
  message: string;
  icon?: string;
  variant?: 'info' | 'warning' | 'success';
  className?: string;
}

export default function DisputeMessageBox({ 
  title, 
  message, 
  icon = 'ℹ️',
  variant = 'info',
  className = '' 
}: DisputeMessageBoxProps) {
  return (
    <div className={`${styles.messageBox} ${styles[variant]} ${className}`}>
      <div className={styles.header}>
        <div className={styles.icon}>{icon}</div>
        <h3 className={styles.title}>{title}</h3>
      </div>
      <p className={styles.message}>{message}</p>
    </div>
  );
}
