import React from 'react';
import styles from './ControlCenter.module.css';
import { KpiCard, Panel } from './ControlWidgets';

const kpis = [
  { icon: '📈', label: 'Daily GMV', value: 'EGP 842K', trend: { value: '+12%' } },
  { icon: '👥', label: 'Active Users', value: '14.2K', trend: { value: '+4.5%' } },
  { icon: '🛒', label: 'Conversion', value: '3.8%', trend: { value: '-0.1%', direction: 'down' as const } },
];

const PerformanceAnalytics: React.FC = () => {
  return (
    <div className={styles.page}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Market Intelligence</h1>
        <p style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Business performance and growth telemetry.</p>
      </header>

      <div className={styles.grid}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className={styles.panels}>
        <Panel title="Revenue Forecast" subtitle="Projected vs actual growth">
           <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                 {Array.from({ length: 30 }).map((_, i) => {
                    const h = Math.random() * 80 + 20;
                    return (
                       <div key={i} style={{ flex: 1, height: `${h}%`, background: i > 20 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(59, 130, 246, 0.5)', borderRadius: '2px' }} />
                    );
                 })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.6rem', color: '#666' }}>
                 <span>DEC 01</span><span>DEC 15</span><span>DEC 30</span>
              </div>
           </div>
        </Panel>

        <Panel title="User Segments" subtitle="Distribution by role and trust-level">
           <div style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#a0a0a0' }}>
                       <span>Buyers</span><span>62%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginTop: '4px' }}>
                       <div style={{ width: '62%', height: '100%', background: '#3b82f6', borderRadius: '3px' }} />
                    </div>
                 </div>
                 <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#a0a0a0' }}>
                       <span>Travelers</span><span>28%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginTop: '4px' }}>
                       <div style={{ width: '28%', height: '100%', background: '#a855f7', borderRadius: '3px' }} />
                    </div>
                 </div>
                 <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#a0a0a0' }}>
                       <span>Sellers</span><span>10%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginTop: '4px' }}>
                       <div style={{ width: '10%', height: '100%', background: '#facc15', borderRadius: '3px' }} />
                    </div>
                 </div>
              </div>
           </div>
        </Panel>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
