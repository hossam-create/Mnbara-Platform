/**
 * Payment Provider Selector Component
 * UI placeholder for payment provider selection (Stripe/Paymob)
 */

import React, { useState, useEffect } from 'react';
import { PaymentProvider, PaymentProviderConfig, PaymentMethod } from '../../types/payment.types';
import paymentService from '../../services/paymentService';
import PaymentStatusBadge from './PaymentStatusBadge';
import styles from './PaymentProviderSelector.module.css';

interface PaymentProviderSelectorProps {
  selectedProvider?: PaymentProvider;
  selectedMethod?: PaymentMethod;
  amount: number;
  currency: string;
  onProviderChange?: (provider: PaymentProvider) => void;
  onMethodChange?: (method: PaymentMethod) => void;
  disabled?: boolean;
  showTestMode?: boolean;
}

export default function PaymentProviderSelector({
  selectedProvider,
  selectedMethod,
  amount,
  currency,
  onProviderChange,
  onMethodChange,
  disabled = false,
  showTestMode = true
}: PaymentProviderSelectorProps) {
  const [providers, setProviders] = useState<PaymentProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const providerConfigs = await paymentService.getPaymentProviders();
      setProviders(providerConfigs.filter(p => p.enabled));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment providers');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSelect = (provider: PaymentProvider) => {
    if (disabled) return;
    onProviderChange?.(provider);
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    if (disabled) return;
    onMethodChange?.(method);
  };

  const getSelectedProviderConfig = () => {
    return providers.find(p => p.provider === selectedProvider);
  };

  const getAvailableMethods = () => {
    const config = getSelectedProviderConfig();
    return config?.supportedMethods || [];
  };

  const isMethodAvailable = (method: PaymentMethod) => {
    const config = getSelectedProviderConfig();
    if (!config) return false;
    return config.supportedMethods.includes(method);
  };

  if (loading) {
    return (
      <div className={styles.providerSelector}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading payment options...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.providerSelector}>
        <div className={styles.error}>
          <p>Payment providers temporarily unavailable</p>
          <button onClick={loadProviders} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.providerSelector}>
      <div className={styles.header}>
        <h3>Payment Method</h3>
        <p className={styles.subtitle}>
          Select your preferred payment provider and method
        </p>
      </div>

      {/* Provider Selection */}
      <div className={styles.section}>
        <h4>Payment Provider</h4>
        <div className={styles.providers}>
          {providers.map(provider => (
            <button
              key={provider.provider}
              onClick={() => handleProviderSelect(provider.provider)}
              disabled={disabled}
              className={`${styles.providerCard} ${
                selectedProvider === provider.provider ? styles.selected : ''
              } ${disabled ? styles.disabled : ''}`}
            >
              <div className={styles.providerInfo}>
                <div className={styles.providerName}>
                  {provider.displayName}
                </div>
                {showTestMode && provider.isTestMode && (
                  <span className={styles.testModeBadge}>Test Mode</span>
                )}
              </div>
              <div className={styles.providerMethods}>
                {provider.supportedMethods.slice(0, 3).map(method => (
                  <span key={method} className={styles.methodTag}>
                    {paymentService.getMethodDisplayName(method)}
                  </span>
                ))}
                {provider.supportedMethods.length > 3 && (
                  <span className={styles.methodTag}>
                    +{provider.supportedMethods.length - 3} more
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Method Selection */}
      {selectedProvider && (
        <div className={styles.section}>
          <h4>Payment Method</h4>
          <div className={styles.methods}>
            {getAvailableMethods().map(method => (
              <button
                key={method}
                onClick={() => handleMethodSelect(method)}
                disabled={disabled || !isMethodAvailable(method)}
                className={`${styles.methodCard} ${
                  selectedMethod === method ? styles.selected : ''
                } ${disabled || !isMethodAvailable(method) ? styles.disabled : ''}`}
              >
                <div className={styles.methodInfo}>
                  <div className={styles.methodName}>
                    {paymentService.getMethodDisplayName(method)}
                  </div>
                  <div className={styles.methodDetails}>
                    <span className={styles.currency}>
                      {currency}
                    </span>
                    {getSelectedProviderConfig()?.config && (
                      <span className={styles.feeInfo}>
                        Fees may apply
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Provider Info */}
      {selectedProvider && getSelectedProviderConfig() && (
        <div className={styles.selectedInfo}>
          <h4>Payment Details</h4>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Provider:</span>
              <span className={styles.infoValue}>
                {getSelectedProviderConfig()?.displayName}
              </span>
            </div>
            {selectedMethod && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Method:</span>
                <span className={styles.infoValue}>
                  {paymentService.getMethodDisplayName(selectedMethod)}
                </span>
              </div>
            )}
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Amount:</span>
              <span className={styles.infoValue}>
                {paymentService.formatCurrency(amount, currency)}
              </span>
            </div>
            {showTestMode && getSelectedProviderConfig()?.isTestMode && (
              <div className={styles.testModeNotice}>
                <span className={styles.warningIcon}>⚠️</span>
                <span>
                  This is a test transaction. No actual money will be processed.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className={styles.securityNotice}>
        <div className={styles.securityIcon}>🔒</div>
        <div className={styles.securityText}>
          <strong>Secure Payment Processing</strong>
          <p>
            Your payment information is encrypted and processed securely. 
            All transactions are protected by escrow and buyer guarantee.
          </p>
        </div>
      </div>
    </div>
  );
}
