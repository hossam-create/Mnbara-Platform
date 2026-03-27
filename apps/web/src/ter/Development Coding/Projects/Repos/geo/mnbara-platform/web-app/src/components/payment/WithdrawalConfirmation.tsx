import React from 'react';
import type { Withdrawal } from '../../types/wallet';
import './WithdrawalConfirmation.css';

interface WithdrawalConfirmationProps {
  withdrawal: Withdrawal;
  onAnotherWithdrawal: () => void;
}

export const WithdrawalConfirmation: React.FC<WithdrawalConfirmationProps> = ({
  withdrawal,
  onAnotherWithdrawal,
}) => {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusMessage = () => {
    switch (withdrawal.status) {
      case 'pending':
        return 'Your withdrawal request has been submitted and is pending approval. You will receive an email once it is processed.';
      case 'approved':
        return 'Your withdrawal has been approved and is being processed.';
      case 'processing':
        return 'Your withdrawal is currently being processed by our team.';
      case 'completed':
        return 'Your withdrawal has been completed and funds have been sent to your bank account.';
      case 'rejected':
        return 'Your withdrawal request was rejected. Please check your email for the reason and try again.';
      case 'failed':
        return 'There was an issue processing your withdrawal. Please contact support.';
      default:
        return 'Your withdrawal status has been updated.';
    }
  };

  return (
    <div className="mnbara-withdrawal-confirmation">
      <div className="mnbara-withdrawal-confirmation__icon">
        {withdrawal.status === 'completed' ? '✓' : 
         withdrawal.status === 'rejected' || withdrawal.status === 'failed' ? '✗' : '⏳'}
      </div>

      <h2 className="mnbara-withdrawal-confirmation__title">
        {withdrawal.status === 'completed' ? 'Withdrawal Successful!' :
         withdrawal.status === 'rejected' || withdrawal.status === 'failed' ? 'Withdrawal Failed' : 'Withdrawal Submitted'}
      </h2>

      <p className="mnbara-withdrawal-confirmation__message">
        {getStatusMessage()}
      </p>

      <div className="mnbara-withdrawal-confirmation__details">
        <div className="mnbara-withdrawal-confirmation__detail-row">
          <span className="mnbara-withdrawal-confirmation__detail-label">Withdrawal ID</span>
          <span className="mnbara-withdrawal-confirmation__detail-value">{withdrawal.id}</span>
        </div>
        <div className="mnbara-withdrawal-confirmation__detail-row">
          <span className="mnbara-withdrawal-confirmation__detail-label">Amount</span>
          <span className="mnbara-withdrawal-confirmation__detail-value">
            {formatCurrency(withdrawal.amount, withdrawal.currency)}
          </span>
        </div>
        <div className="mnbara-withdrawal-confirmation__detail-row">
          <span className="mnbara-withdrawal-confirmation__detail-label">Fee</span>
          <span className="mnbara-withdrawal-confirmation__detail-value">
            -{formatCurrency(withdrawal.fee, withdrawal.currency)}
          </span>
        </div>
        <div className="mnbara-withdrawal-confirmation__detail-row">
          <span className="mnbara-withdrawal-confirmation__detail-label">Net Amount</span>
          <span className="mnbara-withdrawal-confirmation__detail-value net">
            {formatCurrency(withdrawal.netAmount, withdrawal.currency)}
          </span>
        </div>
        <div className="mnbara-withdrawal-confirmation__detail-row">
          <span className="mnbara-withdrawal-confirmation__detail-label">Date</span>
          <span className="mnbara-withdrawal-confirmation__detail-value">
            {formatDate(withdrawal.createdAt)}
          </span>
        </div>
        {withdrawal.rejectionReason && (
          <div className="mnbara-withdrawal-confirmation__reason">
            <span className="mnbara-withdrawal-confirmation__reason-label">Reason:</span>
            <span className="mnbara-withdrawal-confirmation__reason-value">
              {withdrawal.rejectionReason}
            </span>
          </div>
        )}
      </div>

      <div className="mnbara-withdrawal-confirmation__info">
        <span className="mnbara-withdrawal-confirmation__info-icon">ℹ</span>
        <span className="mnbara-withdrawal-confirmation__info-text">
          Bank transfers typically take 1-3 business days to appear in your account.
        </span>
      </div>

      <button
        className="mnbara-withdrawal-confirmation__btn"
        onClick={onAnotherWithdrawal}
      >
        Make Another Withdrawal
      </button>
    </div>
  );
};

export default WithdrawalConfirmation;
