import React from 'react';
import styles from './ControlCenter.module.css';
import { KpiCard, Panel, StatusChip } from './ControlWidgets';

const kpis = [
  { icon: '📡', label: 'API Latency', value: '42ms', trend: { value: '-4ms' } },
  { icon: '💽', label: 'DB Connections', value: '1,240', trend: { value: '+12' } },
  { icon: '🔥', label: 'Error Rate', value: '0.02%', trend: { value: '0.00%', direction: 'down' as const } },
];

const services = [
  { name: 'Auth Service', status: 'Healthy', version: 'v2.4.1', uptime: '99.99%' },
  { name: 'Listing Service', status: 'Healthy', version: 'v2.3.0', uptime: '99.95%' },
  { name: 'Payment Service', status: 'Warning', version: 'v2.1.2', uptime: '99.80%' },
  { name: 'Auction Service', status: 'Healthy', version: 'v2.4.5', uptime: '100.00%' },
];

const EngineeringPage: React.FC = () => {
  return (
    <div className={styles.page}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Engineering Oversight</h1>
        <p style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Infrastructure health and service mesh vitals.</p>
      </header>

      <div className={styles.grid}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className={styles.panels}>
        <Panel title="Service Registry" subtitle="Status of microservices cluster">
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Service</th>
                <th>Version</th>
                <th>Uptime</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => (
                <tr key={svc.name}>
                  <td>{svc.name}</td>
                  <td><code>{svc.version}</code></td>
                  <td>{svc.uptime}</td>
                  <td>
                    <StatusChip 
                      label={svc.status} 
                      tone={svc.status === 'Warning' ? 'warning' : 'healthy'} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Resource Consumption" subtitle="Real-time cluster load">
           <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 200, color: 'rgba(255,255,255,0.1)' }}>
                 CPU: 42% | RAM: 68%
              </div>
              <div style={{ marginTop: '1rem', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                 <div style={{ width: '42%', height: '100%', background: '#4ade80', borderRadius: '2px' }} />
              </div>
           </div>
        </Panel>
      </div>
    </div>
  );
};

export default EngineeringPage;
