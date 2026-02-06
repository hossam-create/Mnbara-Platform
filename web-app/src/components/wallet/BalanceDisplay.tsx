import React from 'react';
import type { WalletBalance, Currency } from '../../types/wallet';
import './BalanceDisplay.css';

interface BalanceDisplayProps {
  balance: WalletBalance;
  showPending?: boolean;
  compact?: boolean;
}

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  EGP: 'E£',
  AED: 'د.إ',
  SAR: 'ر.س',
};

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  balance,
  showPending = true,
  compact = false,
}) => {
  const formatCurrency = (amount: number, currency: Currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className={`mnbara-balance-display ${compact ? 'compact' : ''}`}>
      <div className="mnbara-balance-display__available">
        <span className="mnbara-balance-display__label">
          Available Balance
        </span>
        <span className="mnbara-balance-display__amount">
          {currencySymbols[balance.currency]}
          {formatCurrency(balance.available, balance.currency)}
        </span>
      </div>

      {showPending && (
        <div className="mnbara-balance-display__pending">
          <span className="mnbara-balance-display__label">
            Pending ({formatCurrency(balance.pending, balance.currency)})
          </span>
        </div>
      )}

      <div className="mnbara-balance-display__currency">
        <span className="mnbara-balance-display__currency-label">Currency:</span>
        <span className="mnbara-balance-display__currency-value">{balance.currency}</span>
      </div>

      {!compact && (
        <div className="mnbara-balance-display__updated">
          Last updated: {new Date(balance.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default BalanceDisplay;
