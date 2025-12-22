import React from 'react';
import styles from './ControlCenter.module.css';

interface KpiCardProps {
  icon: string;
  label: string;
  value: string;
  trend?: { value: string; direction?: 'up' | 'down' };
}

export const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, trend }) => (
  <div className={styles.kpiCard}>
    <div className={styles.kpiAccent}>{icon}</div>
    <div>
      <p className={styles.kpiLabel}>{label}</p>
      <p className={styles.kpiValue}>{value}</p>
      {trend && (
        <small style={{ color: trend.direction === 'down' ? '#f87171' : '#4ade80', fontSize: '0.7rem' }}>
          {trend.direction === 'down' ? '▼' : '▲'} {trend.value}
        </small>
      )}
    </div>
  </div>
);

interface PanelProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({ title, subtitle, children }) => (
  <div className={styles.panel}>
    <div className={styles.panelHeader}>
      <div>
        <h2>{title}</h2>
        {subtitle && <span>{subtitle}</span>}
      </div>
    </div>
    {children}
  </div>
);

interface StatusChipProps {
  label: string;
  tone?: 'healthy' | 'warning' | 'critical';
}

export const StatusChip: React.FC<StatusChipProps> = ({ label, tone = 'healthy' }) => {
  const toneClass = tone === 'warning' ? styles.statusWarning : tone === 'critical' ? styles.statusCritical : styles.statusHealthy;
  return <span className={`${styles.chip} ${toneClass}`}>{label}</span>;
};
