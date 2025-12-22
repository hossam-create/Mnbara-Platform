import React from 'react';
import styles from './ControlCenter.module.css';
import { KpiCard, Panel, StatusChip } from './ControlWidgets';

const kpis = [
  { icon: '🚀', label: 'Active Missions', value: '142', trend: { value: '+18' } },
  { icon: '🗺️', label: 'Corridors Live', value: '12', trend: { value: 'Steady' } },
  { icon: '⚡', label: 'Throughput', value: '98.4%', trend: { value: '+0.2%' } },
];

const activeMissions = [
  { id: 'MSN-7721', route: 'CAI → RUH', traveler: 'User_441', status: 'In Transit', ETA: '2h' },
  { id: 'MSN-7718', route: 'JED → CAI', traveler: 'User_319', status: 'Pickup', ETA: '15m' },
  { id: 'MSN-7705', route: 'DXB → CAI', traveler: 'User_112', status: 'Customs', ETA: 'Delayed' },
];

const OperationsPage: React.FC = () => {
  return (
    <div className={styles.page}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Fleet Operations</h1>
        <p style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Real-time coordination across active corridors.</p>
      </header>

      <div className={styles.grid}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className={styles.panels}>
        <Panel title="Active Missions" subtitle="Live tracking across all routes">
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Route</th>
                <th>Traveler</th>
                <th>ETA</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeMissions.map((mission) => (
                <tr key={mission.id}>
                  <td>{mission.id}</td>
                  <td>{mission.route}</td>
                  <td>{mission.traveler}</td>
                  <td>{mission.ETA}</td>
                  <td>
                    <StatusChip 
                      label={mission.status} 
                      tone={mission.status === 'Delayed' ? 'critical' : mission.status === 'Pickup' ? 'warning' : 'healthy'} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Route Capacity" subtitle="Utilization & friction indicators">
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
             {/* Mock chart representation */}
             <div style={{ height: '150px', display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                {[60, 80, 45, 90, 70, 55].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, background: 'rgba(0, 163, 255, 0.4)', borderRadius: '4px 4px 0 0' }} />
                ))}
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.7rem', color: '#666' }}>
                <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
             </div>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default OperationsPage;
