import styles from './ControlWidgets.module.css';

type TrendProps = {
  value: string;
  direction?: 'up' | 'down';
};

export function Trend({ value, direction = 'up' }: TrendProps) {
  return (
    <span className={`${styles.trend} ${direction === 'down' ? styles.trendDown : ''}`}>
      {direction === 'down' ? '▼' : '▲'} {value}
    </span>
  );
}

type KpiCardProps = {
  icon: string;
  label: string;
  value: string;
  trend?: TrendProps;
};

export function KpiCard({ icon, label, value, trend }: KpiCardProps) {
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiAccent}>{icon}</div>
      <div>
        <p className={styles.kpiLabel}>{label}</p>
        <p className={styles.kpiValue}>{value}</p>
      </div>
      {trend && <Trend {...trend} />}
    </div>
  );
}

type PanelProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function Panel({ title, subtitle, children, actions }: PanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h2>{title}</h2>
          {subtitle && <span>{subtitle}</span>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

type ChipProps = {
  label: string;
  tone?: 'healthy' | 'warning' | 'critical';
};

export function StatusChip({ label, tone = 'healthy' }: ChipProps) {
  const toneClass =
    tone === 'warning'
      ? styles.statusWarning
      : tone === 'critical'
        ? styles.statusCritical
        : styles.statusHealthy;
  return <span className={`${styles.chip} ${toneClass}`}>{label}</span>;
}

export type TimelineItem = {
  title: string;
  detail: string;
  timestamp: string;
};

export function Timeline({ items }: { items: ReadonlyArray<TimelineItem> }) {
  return (
    <div className={styles.timeline}>
      {items.map((item) => (
        <div key={item.title + item.timestamp} className={styles.timelineItem}>
          <div className={styles.timelineMarker} />
          <div className={styles.timelineContent}>
            <h4>{item.title}</h4>
            <p>{item.detail}</p>
            <small>{item.timestamp}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
