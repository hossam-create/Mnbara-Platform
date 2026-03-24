import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface MpesaPaymentFormProps {
  amount: number;
  currency: string;
  transactionId: string;
  onPaymentComplete: (result: any) => void;
  onPaymentError: (error: string) => void;
}

const MpesaPaymentForm: React.FC<MpesaPaymentFormProps> = ({
  amount,
  currency,
  transactionId,
  onPaymentComplete,
  onPaymentError,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validatePhoneNumber = (phone: string): boolean => {
    // Kenyan phone number validation (starts with 2547 and has 9 more digits)
    const kenyanPhoneRegex = /^2547\d{8}$/;
    return kenyanPhoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhoneNumber(phoneNumber)) {
      setErrorMessage('Please enter a valid Kenyan phone number (2547XXXXXXXX)');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      // Initiate M-Pesa payment
      const response = await fetch('/api/escrow-kenya/transactions/fund-mpesa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          phoneNumber,
          amount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentStatus('success');
        onPaymentComplete(data);
      } else {
        throw new Error(data.error || 'Payment failed');
      }
    } catch (error) {
      setPaymentStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed');
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // If starts with 0, replace with 254
    if (digits.startsWith('0')) {
      return '254' + digits.slice(1);
    }
    
    // If starts with 7 and has 9 digits, add 254
    if (digits.startsWith('7') && digits.length === 9) {
      return '254' + digits;
    }
    
    // If starts with 254, return as is
    if (digits.startsWith('254')) {
      return digits;
    }
    
    return digits;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setErrorMessage('');
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'processing':
        return <Clock className="w-8 h-8 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-600" />;
      default:
        return <Smartphone className="w-8 h-8 text-gray-600" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'processing':
        return 'Processing your M-Pesa payment...';
      case 'success':
        return 'Payment completed successfully!';
      case 'error':
        return 'Payment failed. Please try again.';
      default:
        return 'Enter your M-Pesa phone number to continue';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Smartphone className="w-5 h-5" />
          M-Pesa Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Display */}
        <div className="flex flex-col items-center space-y-2">
          {getStatusIcon()}
          <p className="text-sm text-gray-600 text-center">
            {getStatusMessage()}
          </p>
        </div>

        {/* Payment Amount */}
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600">Amount to Pay</p>
          <p className="text-2xl font-bold text-gray-900">
            {currency} {amount.toLocaleString()}
          </p>
        </div>

        {/* Payment Form */}
        {paymentStatus === 'idle' || paymentStatus === 'error' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">M-Pesa Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="2547XXXXXXXX"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className="text-center text-lg"
                maxLength={12}
                disabled={isProcessing}
              />
              <p className="text-xs text-gray-500">
                Enter your M-Pesa registered phone number
              </p>
            </div>

            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isProcessing || !phoneNumber || !validatePhoneNumber(phoneNumber)}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                `Pay ${currency} ${amount.toLocaleString()}`
              )}
            </Button>
          </form>
        ) : null}

        {/* Success State */}
        {paymentStatus === 'success' && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your M-Pesa payment has been initiated. You will receive a prompt on your phone to enter your M-Pesa PIN.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => onPaymentComplete({ status: 'completed' })}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">How to Pay:</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Enter your M-Pesa phone number above</li>
            <li>Click "Pay" to initiate the payment</li>
            <li>Check your phone for M-Pesa prompt</li>
            <li>Enter your M-Pesa PIN to complete payment</li>
            <li>Wait for payment confirmation</li>
          </ol>
        </div>

        {/* Support */}
        <div className="text-center text-xs text-gray-500">
          <p>Need help? Contact support at support@mnbarh.com</p>
          <p>Or call: +254 700 123 456</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MpesaPaymentForm;
