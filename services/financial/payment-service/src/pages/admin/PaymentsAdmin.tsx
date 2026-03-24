/**
 * Payments Admin Dashboard
 * Business-level payment configuration (NOT system controls)
 * Admin can configure providers, fees, limits - NO money movement
 */

import React, { useState, useEffect } from 'react';
import styles from './PaymentsAdmin.module.css';

interface PaymentProvider {
  id: string;
  name: string;
  enabled: boolean;
  supportedCurrencies: string[];
  fees: {
    percentage: number;
    fixed: number;
  };
  limits: {
    min: number;
    max: number;
  };
}

interface PaymentConfig {
  providers: PaymentProvider[];
  globalSettings: {
    defaultCurrency: string;
    autoRefundEnabled: boolean;
    disputeTimeoutHours: number;
  };
}

export default function PaymentsAdmin() {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'providers' | 'settings' | 'fees'>('providers');

  useEffect(() => {
    loadPaymentConfig();
  }, []);

  const loadPaymentConfig = async () => {
    try {
      setLoading(true);
      // Mock data - in real implementation, this would call admin API
      const mockConfig: PaymentConfig = {
        providers: [
          {
            id: 'stripe',
            name: 'Stripe',
            enabled: true,
            supportedCurrencies: ['USD', 'EUR', 'GBP'],
            fees: { percentage: 2.9, fixed: 0.30 },
            limits: { min: 1, max: 10000 }
          },
          {
            id: 'paypal',
            name: 'PayPal',
            enabled: true,
            supportedCurrencies: ['USD', 'EUR', 'GBP'],
            fees: { percentage: 3.4, fixed: 0.30 },
            limits: { min: 1, max: 10000 }
          },
          {
            id: 'paymob',
            name: 'Paymob',
            enabled: false,
            supportedCurrencies: ['EGP', 'SAR', 'AED'],
            fees: { percentage: 2.5, fixed: 2.0 },
            limits: { min: 10, max: 50000 }
          }
        ],
        globalSettings: {
          defaultCurrency: 'USD',
          autoRefundEnabled: true,
          disputeTimeoutHours: 72
        }
      };
      
      setConfig(mockConfig);
    } catch (err) {
      setError('Failed to load payment configuration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleProvider = async (providerId: string) => {
    if (!config) return;

    try {
      const updatedProviders = config.providers.map(provider =>
        provider.id === providerId 
          ? { ...provider, enabled: !provider.enabled }
          : provider
      );

      setConfig({ ...config, providers: updatedProviders });
      
      // In real implementation, this would call admin API
      console.log(`Provider ${providerId} toggled`);
    } catch (err) {
      setError('Failed to update provider');
      console.error(err);
    }
  };

  const updateProviderFees = async (providerId: string, fees: { percentage: number; fixed: number }) => {
    if (!config) return;

    try {
      const updatedProviders = config.providers.map(provider =>
        provider.id === providerId 
          ? { ...provider, fees }
          : provider
      );

      setConfig({ ...config, providers: updatedProviders });
      
      // In real implementation, this would call admin API
      console.log(`Provider ${providerId} fees updated`, fees);
    } catch (err) {
      setError('Failed to update provider fees');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading payment configuration...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={loadPaymentConfig}>Retry</button>
      </div>
    );
  }

  if (!config) {
    return <div className={styles.noData}>No payment configuration available</div>;
  }

  return (
    <div className={styles.paymentsAdmin}>
      <div className={styles.header}>
        <h1>Payments Configuration</h1>
        <p>Configure payment providers, fees, and limits</p>
        <div className={styles.warning}>
          ⚠️ Business configuration only. No money movement or escrow controls here.
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'providers' ? styles.active : ''}`}
          onClick={() => setActiveTab('providers')}
        >
          Payment Providers
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Global Settings
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'fees' ? styles.active : ''}`}
          onClick={() => setActiveTab('fees')}
        >
          Fee Structure
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'providers' && (
          <div className={styles.providersSection}>
            <h2>Payment Providers</h2>
            <div className={styles.providerList}>
              {config.providers.map(provider => (
                <div key={provider.id} className={styles.providerCard}>
                  <div className={styles.providerHeader}>
                    <h3>{provider.name}</h3>
                    <button
                      className={`${styles.toggle} ${provider.enabled ? styles.enabled : styles.disabled}`}
                      onClick={() => toggleProvider(provider.id)}
                    >
                      {provider.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  
                  <div className={styles.providerDetails}>
                    <div className={styles.currencies}>
                      <strong>Currencies:</strong> {provider.supportedCurrencies.join(', ')}
                    </div>
                    
                    <div className={styles.fees}>
                      <strong>Fees:</strong> {provider.fees.percentage}% + ${provider.fees.fixed}
                    </div>
                    
                    <div className={styles.limits}>
                      <strong>Limits:</strong> ${provider.limits.min} - ${provider.limits.max}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={styles.settingsSection}>
            <h2>Global Payment Settings</h2>
            <div className={styles.settingsGrid}>
              <div className={styles.setting}>
                <label>Default Currency</label>
                <select value={config.globalSettings.defaultCurrency}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="EGP">EGP</option>
                </select>
              </div>
              
              <div className={styles.setting}>
                <label>
                  <input
                    type="checkbox"
                    checked={config.globalSettings.autoRefundEnabled}
                    onChange={(e) => {
                      setConfig({
                        ...config,
                        globalSettings: {
                          ...config.globalSettings,
                          autoRefundEnabled: e.target.checked
                        }
                      });
                    }}
                  />
                  Auto-refund on cancellation
                </label>
              </div>
              
              <div className={styles.setting}>
                <label>Dispute Timeout (hours)</label>
                <input
                  type="number"
                  value={config.globalSettings.disputeTimeoutHours}
                  onChange={(e) => {
                    setConfig({
                      ...config,
                      globalSettings: {
                        ...config.globalSettings,
                        disputeTimeoutHours: parseInt(e.target.value) || 72
                      }
                    });
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fees' && (
          <div className={styles.feesSection}>
            <h2>Fee Structure</h2>
            <div className={styles.feesTable}>
              <table>
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Percentage</th>
                    <th>Fixed Fee</th>
                    <th>Effective Rate</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {config.providers.map(provider => (
                    <tr key={provider.id}>
                      <td>{provider.name}</td>
                      <td>
                        <input
                          type="number"
                          step="0.1"
                          value={provider.fees.percentage}
                          onChange={(e) => {
                            updateProviderFees(provider.id, {
                              ...provider.fees,
                              percentage: parseFloat(e.target.value) || 0
                            });
                          }}
                          className={styles.feeInput}
                        />
                        %
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={provider.fees.fixed}
                          onChange={(e) => {
                            updateProviderFees(provider.id, {
                              ...provider.fees,
                              fixed: parseFloat(e.target.value) || 0
                            });
                          }}
                          className={styles.feeInput}
                        />
                      </td>
                      <td>
                        {provider.fees.percentage}% + ${provider.fees.fixed}
                      </td>
                      <td>
                        <button className={styles.saveButton}>Save</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <button className={styles.saveAllButton}>Save All Changes</button>
        <button className={styles.resetButton}>Reset to Defaults</button>
      </div>
    </div>
  );
}
