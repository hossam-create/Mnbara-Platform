import React from 'react';
import styles from './ControlCenter.module.css';
import { KpiCard, Panel, StatusChip } from './ControlWidgets';

const kpis = [
  { icon: '⚖️', label: 'Open Disputes', value: '36', trend: { value: '+2 today' } },
  { icon: '🕙', label: 'Avg Resolution', value: '18h', trend: { value: '-2h' } },
  { icon: '🛑', label: 'Escalated', value: '5', trend: { value: 'High Priority', direction: 'up' as const } },
];

const disputeDeck = [
  { id: 'DSP-341', buyer: 'Nada K.', traveler: 'TRV-442', age: '3h', status: 'Awaiting Evidence' },
  { id: 'DSP-332', buyer: 'Omar R.', traveler: 'TRV-319', age: '8h', status: 'Panel Voting' },
  { id: 'DSP-327', buyer: 'Sarah W.', traveler: 'TRV-112', age: '22h', status: 'Escalated' },
];

const DisputesPage: React.FC = () => {
  return (
    <div className={styles.page}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Dispute Resolution Deck</h1>
        <p style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Arbitration and evidence management for corridor friction.</p>
      </header>

      <div className={styles.grid}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className={styles.panels}>
        <Panel title="Escalation Queue" subtitle="High-priority arbitration cases">
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Buyer</th>
                <th>Traveler</th>
                <th>Age</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {disputeDeck.map((dsp) => (
                <tr key={dsp.id}>
                  <td>{dsp.id}</td>
                  <td>{dsp.buyer}</td>
                  <td>{dsp.traveler}</td>
                  <td>{dsp.age}</td>
                  <td>
                    <StatusChip 
                      label={dsp.status} 
                      tone={dsp.status === 'Escalated' ? 'critical' : dsp.status === 'Panel Voting' ? 'warning' : 'healthy'} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Resolution Posture" subtitle="Outcome distribution (Last 30d)">
           <div style={{ padding: '1rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '8px solid rgba(74, 222, 128, 0.5)', display: 'flex', alignItems: 'center', justifyItems: 'center', textAlign: 'center', fontSize: '0.8rem' }}>
                 <div style={{ width: '100%' }}>82%<br/>Success</div>
              </div>
              <div style={{ flex: 1, fontSize: '0.8rem', color: '#a0a0a0' }}>
                 <div style={{ marginBottom: '0.5rem' }}>• 64% Refunded to Buyer</div>
                 <div style={{ marginBottom: '0.5rem' }}>• 18% Released to Seller</div>
                 <div style={{ marginBottom: '0.5rem' }}>• 12% Partial Refund</div>
                 <div>• 6% Under Review</div>
              </div>
           </div>
        </Panel>
      </div>
    </div>
  );
};

export default DisputesPage;
