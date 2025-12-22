import React from 'react';
import styles from './ControlCenter.module.css';
import { KpiCard, Panel, StatusChip } from './ControlWidgets';

const kpis = [
  { icon: '📦', label: 'In-Transit Items', value: '458', trend: { value: '+24' } },
  { icon: '🛂', label: 'Customs Clearances', value: '18', trend: { value: '98% Success' } },
  { icon: '🚚', label: 'Pickup Capacity', value: '82%', trend: { value: '-2%', direction: 'down' as const } },
];

const shipments = [
  { id: 'SHP-1209', item: 'Apple Watch Ultra 2', route: 'DXB → CAI', priority: 'High', status: 'In Customs' },
  { id: 'SHP-1215', item: 'Sony PS5 Pro', route: 'RUH → CAI', priority: 'Normal', status: 'Awaiting Pickup' },
  { id: 'SHP-1222', item: 'Dyson Airwrap', route: 'JED → CAI', priority: 'High', status: 'Delivered' },
];

const LogisticsPage: React.FC = () => {
  return (
    <div className={styles.page}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Logistics & Supply Chain</h1>
        <p style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Tracking item consolidation and traveler movements.</p>
      </header>

      <div className={styles.grid}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className={styles.panels}>
        <Panel title="Shipping Pipeline" subtitle="End-to-end fulfillment tracking">
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Item</th>
                <th>Route</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((shp) => (
                <tr key={shp.id}>
                  <td>{shp.id}</td>
                  <td>{shp.item}</td>
                  <td>{shp.route}</td>
                  <td>{shp.priority}</td>
                  <td>
                    <StatusChip 
                      label={shp.status} 
                      tone={shp.status === 'In Customs' ? 'warning' : shp.status === 'Delivered' ? 'healthy' : 'warning'} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Consolidation Points" subtitle="Warehouse & hub utilization">
           <div style={{ padding: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                    <span>Cairo Hub (Main)</span>
                    <span>88%</span>
                 </div>
                 <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                    <div style={{ width: '88%', height: '100%', background: '#f87171', borderRadius: '2px' }} />
                 </div>
              </div>
              <div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                    <span>Riyadh Satellite</span>
                    <span>42%</span>
                 </div>
                 <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                    <div style={{ width: '42%', height: '100%', background: '#4ade80', borderRadius: '2px' }} />
                 </div>
              </div>
           </div>
        </Panel>
      </div>
    </div>
  );
};

export default LogisticsPage;
