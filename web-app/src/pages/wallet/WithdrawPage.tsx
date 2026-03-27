import React, { useState } from 'react';
import { BankAccountSelector } from '../../components/payment/BankAccountSelector';
import { WithdrawalForm } from '../../components/payment/WithdrawalForm';
import { WithdrawalConfirmation } from '../../components/payment/WithdrawalConfirmation';
import type { BankAccount, Withdrawal, WithdrawalLimit, Currency } from '../../types/wallet';
import './WithdrawPage.css';

const mockBankAccounts: BankAccount[] = [
  {
    id: 'bank-1',
    userId: 'user-1',
    bankName: 'Chase Bank',
    accountName: 'John Doe',
    accountNumber: '****4567',
    country: 'USA',
    isDefault: true,
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const mockLimits: WithdrawalLimit = {
  daily: 10000,
  weekly: 50000,
  monthly: 200000,
  remaining: { daily: 8500, weekly: 42000, monthly: 185000 },
};

type WithdrawStep = 'account' | 'form' | 'confirmation';

export const WithdrawPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<WithdrawStep>('account');
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [withdrawal, setWithdrawal] = useState<Withdrawal | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccountSelect = (account: BankAccount) => {
    setSelectedAccount(account);
    setCurrentStep('form');
  };

  const handleAmountSubmit = async (submittedAmount: number) => {
    setAmount(submittedAmount);
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newWithdrawal: Withdrawal = {
      id: `wd-${Date.now()}`,
      walletId: 'wallet-1',
      bankAccountId: selectedAccount!.id,
      amount: submittedAmount,
      currency,
      fee: 25,
      netAmount: submittedAmount - 25,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setWithdrawal(newWithdrawal);
    setIsProcessing(false);
    setCurrentStep('confirmation');
  };

  const handleBack = () => {
    if (currentStep === 'form') {
      setCurrentStep('account');
      setSelectedAccount(null);
    } else if (currentStep === 'confirmation') {
      setCurrentStep('form');
      setWithdrawal(null);
    }
  };

  const handleAnotherWithdrawal = () => {
    setCurrentStep('account');
    setSelectedAccount(null);
    setAmount(0);
    setWithdrawal(null);
  };

  return (
    <div className="mnbara-withdraw-page">
      <div className="mnbara-withdraw-page__container">
        <header className="mnbara-withdraw-page__header">
          <button className="mnbara-withdraw-page__back-btn" onClick={handleBack}>
            ← Back
          </button>
          <h1 className="mnbara-withdraw-page__title">Withdraw Funds</h1>
        </header>

        <div className="mnbara-withdraw-page__limits">
          <h3 className="mnbara-withdraw-page__limits-title">Withdrawal Limits</h3>
          <div className="mnbara-withdraw-page__limits-grid">
            <div className="mnbara-withdraw-page__limit-item">
              <span className="mnbara-withdraw-page__limit-label">Daily</span>
              <span className="mnbara-withdraw-page__limit-value">
                ${mockLimits.remaining.daily.toLocaleString()} / ${mockLimits.daily.toLocaleString()}
              </span>
            </div>
            <div className="mnbara-withdraw-page__limit-item">
              <span className="mnbara-withdraw-page__limit-label">Weekly</span>
              <span className="mnbara-withdraw-page__limit-value">
                ${mockLimits.remaining.weekly.toLocaleString()} / ${mockLimits.weekly.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <main className="mnbara-withdraw-page__content">
          {currentStep === 'account' && (
            <BankAccountSelector
              accounts={mockBankAccounts}
              onSelect={handleAccountSelect}
              onAddNew={() => console.log('Add new bank account')}
            />
          )}

          {currentStep === 'form' && selectedAccount && (
            <WithdrawalForm
              bankAccount={selectedAccount}
              currency={currency}
              limits={mockLimits}
              onCurrencyChange={setCurrency}
              onSubmit={handleAmountSubmit}
              isProcessing={isProcessing}
            />
          )}

          {currentStep === 'confirmation' && withdrawal && (
            <WithdrawalConfirmation
              withdrawal={withdrawal}
              onAnotherWithdrawal={handleAnotherWithdrawal}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default WithdrawPage;
