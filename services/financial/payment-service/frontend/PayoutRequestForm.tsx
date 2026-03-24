import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Banknote, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface PayoutRequestFormProps {
  sellerId: string;
  userId: string;
  availableBalance: number;
  onRequestSubmitted: (request: any) => void;
  onError: (error: string) => void;
}

const PayoutRequestForm: React.FC<PayoutRequestFormProps> = ({
  sellerId,
  userId,
  availableBalance,
  onRequestSubmitted,
  onError,
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    payoutMethod: 'bank_transfer',
    bankAccountName: '',
    bankAccountNumber: '',
    bankName: '',
    bankRoutingNumber: '',
    bankSwiftCode: '',
    bankAddress: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateFee = (amount: number): number => {
    // 2.5% + $0.50 fixed fee
    return (amount * 0.025) + 0.50;
  };

  const calculateNetAmount = (): number => {
    const amount = parseFloat(formData.amount) || 0;
    const fee = calculateFee(amount);
    return amount - fee;
  };

  const validateForm = (): string | null => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      return 'Please enter a valid amount';
    }

    if (parseFloat(formData.amount) > availableBalance) {
      return 'Amount exceeds available balance';
    }

    if (parseFloat(formData.amount) < 10) {
      return 'Minimum payout amount is $10.00';
    }

    if (!formData.bankAccountName || !formData.bankAccountNumber || !formData.bankName) {
      return 'Please fill in all required bank account fields';
    }

    if (formData.payoutMethod === 'bank_transfer' && !formData.bankRoutingNumber) {
      return 'Routing number is required for bank transfers';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      onError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/manual-payouts/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerId,
          userId,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          payoutMethod: formData.payoutMethod,
          bankAccountName: formData.bankAccountName,
          bankAccountNumber: formData.bankAccountNumber,
          bankName: formData.bankName,
          bankRoutingNumber: formData.bankRoutingNumber,
          bankSwiftCode: formData.bankSwiftCode,
          bankAddress: formData.bankAddress,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        onRequestSubmitted(data.data);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
          setFormData({
            amount: '',
            currency: 'USD',
            payoutMethod: 'bank_transfer',
            bankAccountName: '',
            bankAccountNumber: '',
            bankName: '',
            bankRoutingNumber: '',
            bankSwiftCode: '',
            bankAddress: '',
            notes: '',
          });
        }, 3000);
      } else {
        throw new Error(data.error || 'Failed to submit payout request');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const amount = parseFloat(formData.amount) || 0;
  const fee = calculateFee(amount);
  const netAmount = calculateNetAmount();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="w-5 h-5" />
          Request Payout
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Success Message */}
        {showSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Payout request submitted successfully! Your request is now under review.
            </AlertDescription>
          </Alert>
        )}

        {/* Available Balance */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">Available Balance</span>
            <span className="text-lg font-bold text-blue-900">
              ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Payout Amount</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="10"
                  max={availableBalance}
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fee Calculation */}
            {amount > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Requested Amount:</span>
                  <span className="font-medium">${amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Processing Fee (2.5% + $0.50):</span>
                  <span className="font-medium">${fee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>You'll Receive:</span>
                  <span>${netAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Payout Method */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Payout Method</h3>
            
            <div className="space-y-2">
              <Label htmlFor="payoutMethod">Method *</Label>
              <Select value={formData.payoutMethod} onValueChange={(value) => handleInputChange('payoutMethod', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bank Account Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Bank Account Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankAccountName">Account Holder Name *</Label>
                <Input
                  id="bankAccountName"
                  placeholder="John Doe"
                  value={formData.bankAccountName}
                  onChange={(e) => handleInputChange('bankAccountName', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccountNumber">Account Number *</Label>
                <Input
                  id="bankAccountNumber"
                  placeholder="123456789"
                  value={formData.bankAccountNumber}
                  onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  placeholder="First National Bank"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankRoutingNumber">
                  Routing Number {formData.payoutMethod === 'bank_transfer' ? '*' : ''}
                </Label>
                <Input
                  id="bankRoutingNumber"
                  placeholder="021000021"
                  value={formData.bankRoutingNumber}
                  onChange={(e) => handleInputChange('bankRoutingNumber', e.target.value)}
                  disabled={isSubmitting}
                  required={formData.payoutMethod === 'bank_transfer'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankSwiftCode">SWIFT Code (International)</Label>
                <Input
                  id="bankSwiftCode"
                  placeholder="BOFAUS3N"
                  value={formData.bankSwiftCode}
                  onChange={(e) => handleInputChange('bankSwiftCode', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bankAddress">Bank Address (International)</Label>
                <Textarea
                  id="bankAddress"
                  placeholder="123 Main St, New York, NY 10001, USA"
                  value={formData.bankAddress}
                  onChange={(e) => handleInputChange('bankAddress', e.target.value)}
                  disabled={isSubmitting}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !formData.amount || parseFloat(formData.amount) <= 0}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </div>
            ) : (
              `Request Payout - $${netAmount.toFixed(2)}`
            )}
          </Button>
        </form>

        {/* Important Information */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Important Information:</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Payouts are processed weekly (every Friday)</li>
                <li>Processing takes 3-5 business days after approval</li>
                <li>Minimum payout amount is $10.00</li>
                <li>Processing fee is 2.5% + $0.50 per payout</li>
                <li>All requests are subject to manual review</li>
                <li>International transfers may require additional documentation</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default PayoutRequestForm;
