import React, { useState } from 'react';
import type { PaymentMethod, Currency } from '../../types/wallet';
import './DepositForm.css';

interface DepositFormProps {
  method: PaymentMethod;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  onSubmit: (amount: number) => void;
  isProcessing: boolean;
}

export const DepositForm: React.FC<DepositFormProps> = ({
  method,
  currency,
  onCurrencyChange,
  onSubmit,
  isProcessing,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    setAmount(numericValue);
    setError(null);
  };

  const calculateFee = (): { percentage: number; fixed: number; total: number } => {
    const numAmount = parseFloat(amount) || 0;
    const percentageFee = (numAmount * method.fees.percentage) / 100;
    const totalFee = percentageFee + method.fees.fixed;
    return {
      percentage: percentageFee,
      fixed: method.fees.fixed,
      total: totalFee,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (numAmount < method.minAmount) {
      setError(`Minimum deposit amount is $${method.minAmount}`);
      return;
    }

    if (numAmount > method.maxAmount) {
      setError(`Maximum deposit amount is $${method.maxAmount.toLocaleString()}`);
      return;
    }

    onSubmit(numAmount);
  };

  const suggestedAmounts = [100, 250, 500, 1000, 2500, 5000];

  return (
    <div className="mnbara-deposit-form">
      <h2 className="mnbara-deposit-form__title">Enter Deposit Amount</h2>
      <p className="mnbara-deposit-form__subtitle">
        Using {method.name} ({method.processingTime} processing)
      </p>

      <form onSubmit={handleSubmit} className="mnbara-deposit-form__form">
        <div className="mnbara-deposit-form__currency">
          <label className="mnbara-deposit-form__label">Currency</label>
          <select
            className="mnbara-deposit-form__currency-select"
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value as Currency)}
          >
            {method.currencies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="mnbara-deposit-form__amount">
          <label className="mnbara-deposit-form__label">Amount</label>
          <div className="mnbara-deposit-form__input-wrapper">
            <span className="mnbara-deposit-form__currency-symbol">
              {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency}
            </span>
            <input
              type="text"
              className="mnbara-deposit-form__input"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              disabled={isProcessing}
            />
          </div>
          {error && <span className="mnbara-deposit-form__error">{error}</span>}
        </div>

        <div className="mnbara-deposit-form__suggestions">
          {suggestedAmounts.map((suggested) => (
            <button
              key={suggested}
              type="button"
              className={`mnbara-deposit-form__suggestion ${parseFloat(amount) === suggested ? 'active' : ''}`}
              onClick={() => setAmount(suggested.toString())}
              disabled={isProcessing}
            >
              ${suggested}
            </button>
          ))}
        </div>

        {amount && parseFloat(amount) > 0 && (
          <div className="mnbara-deposit-form__summary">
            <div className="mnbara-deposit-form__summary-row">
              <span>Deposit Amount</span>
              <span>${parseFloat(amount).toFixed(2)}</span>
            </div>
            <div className="mnbara-deposit-form__summary-row">
              <span>Processing Fee</span>
              <span>${calculateFee().total.toFixed(2)}</span>
            </div>
            <div className="mnbara-deposit-form__summary-row mnbara-deposit-form__summary-row--total">
              <span>Total</span>
              <span>${(parseFloat(amount) + calculateFee().total).toFixed(2)}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="mnbara-deposit-form__submit"
          disabled={isProcessing || !amount}
        >
          {isProcessing ? 'Processing...' : `Continue with ${method.name}`}
        </button>
      </form>
    </div>
  );
};

export default DepositForm;
