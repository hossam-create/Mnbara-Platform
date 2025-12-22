import React from 'react';
import styles from './ControlCenter.module.css';
import { Panel, StatusChip } from './ControlWidgets';

const flags = [
  { name: 'FF_AI_INTENT_CLASSIFICATION', status: true, description: 'AI-driven intent scoring for new listings' },
  { name: 'FF_TRUST_GATING', status: true, description: 'Mandatory trust-score check for high-value orders' },
  { name: 'FF_MARKET_EXPANSION_APAC', status: false, description: 'Regional corridor activation for APAC' },
  { name: 'FF_REWARDS_BOOST', status: false, description: '2x multiplier for verified travelers' },
];

const FeatureFlagsPage: React.FC = () => {
  return (
    <div className={styles.page}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Feature Configuration</h1>
        <p style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Enable/Disable platform features across environments.</p>
      </header>

      <div className={styles.panels}>
        <Panel title="Active Switches" subtitle="Global feature state">
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Feature Flag</th>
                <th>Description</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((flag) => (
                <tr key={flag.name}>
                  <td><code>{flag.name}</code></td>
                  <td>{flag.description}</td>
                  <td>
                    <StatusChip 
                      label={flag.status ? 'ENABLED' : 'DISABLED'} 
                      tone={flag.status ? 'healthy' : 'critical'} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </tbody>
        </Panel>

        <Panel title="Guardrail Status" subtitle="Kill-switch & emergency overrides">
           <div style={{ padding: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <strong style={{ color: '#f87171' }}>GLOBAL KILL SWITCH</strong>
                 <StatusChip label="INACTIVE" tone="healthy" />
              </div>
              <p style={{ fontSize: '0.8rem', color: '#a0a0a0', marginTop: '0.5rem' }}>
                 Triggering this will immediately suspend all matching and payment activities.
              </p>
           </div>
        </Panel>
      </div>
    </div>
  );
};

export default FeatureFlagsPage;
