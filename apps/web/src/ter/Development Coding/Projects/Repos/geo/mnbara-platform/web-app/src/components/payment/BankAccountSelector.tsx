import React from 'react';
import type { BankAccount } from '../../types/wallet';
import './BankAccountSelector.css';

interface BankAccountSelectorProps {
  accounts: BankAccount[];
  onSelect: (account: BankAccount) => void;
  onAddNew: () => void;
}

export const BankAccountSelector: React.FC<BankAccountSelectorProps> = ({
  accounts,
  onSelect,
  onAddNew,
}) => {
  return (
    <div className="mnbara-bank-account-selector">
      <div className="mnbara-bank-account-selector__header">
        <h2 className="mnbara-bank-account-selector__title">Select Bank Account</h2>
        <button className="mnbara-bank-account-selector__add-btn" onClick={onAddNew}>
          + Add New Account
        </button>
      </div>

      <p className="mnbara-bank-account-selector__subtitle">
        Choose which bank account you'd like to withdraw to
      </p>

      <div className="mnbara-bank-account-selector__list">
        {accounts.map((account) => (
          <button
            key={account.id}
            className={`mnbara-bank-account-selector__option ${account.isDefault ? 'default' : ''}`}
            onClick={() => onSelect(account)}
          >
            <div className="mnbara-bank-account-selector__icon">
              🏦
            </div>
            <div className="mnbara-bank-account-selector__info">
              <div className="mnbara-bank-account-selector__name">
                {account.bankName}
                {account.isDefault && (
                  <span className="mnbara-bank-account-selector__default-badge">Default</span>
                )}
              </div>
              <div className="mnbara-bank-account-selector__account">
                {account.accountName} - {account.accountNumber}
              </div>
              <div className="mnbara-bank-account-selector__country">
                {account.country}
              </div>
            </div>
            {account.verified ? (
              <span className="mnbara-bank-account-selector__verified">✓</span>
            ) : (
              <span className="mnbara-bank-account-selector__unverified">Pending</span>
            )}
          </button>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="mnbara-bank-account-selector__empty">
          <p>You don't have any bank accounts linked yet.</p>
          <button className="mnbara-bank-account-selector__empty-btn" onClick={onAddNew}>
            Add Your First Bank Account
          </button>
        </div>
      )}
    </div>
  );
};

export default BankAccountSelector;
