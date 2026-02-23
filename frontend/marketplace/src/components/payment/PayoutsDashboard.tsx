import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BankIcon,
  Download,
  Plus
} from 'lucide-react';

interface Payout {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  processedAt?: string;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountType: string;
  };
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
  status: 'pending' | 'verified' | 'failed';
  isDefault: boolean;
}

const PayoutsDashboard: React.FC = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddBankAccount, setShowAddBankAccount] = useState(false);

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const fetchPayoutData = async () => {
    try {
      const [payoutsRes, balanceRes, accountsRes] = await Promise.all([
        fetch('/api/payouts/history'),
        fetch('/api/payouts/balance'),
        fetch('/api/payouts/bank-accounts')
      ]);

      const payoutsData = await payoutsRes.json();
      const balanceData = await balanceRes.json();
      const accountsData = await accountsRes.json();

      setPayouts(payoutsData);
      setAvailableBalance(balanceData.available);
      setPendingBalance(balanceData.pending);
      setBankAccounts(accountsData);
    } catch (error) {
      console.error('Failed to fetch payout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPayout = async (amount: number, bankAccountId: string) => {
    try {
      const response = await fetch('/api/payouts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, bankAccountId })
      });

      if (response.ok) {
        fetchPayoutData();
        setShowAddBankAccount(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create payout');
      }
    } catch (error) {
      console.error('Create payout error:', error);
      alert('Failed to create payout');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payouts</h1>
          <p className="text-gray-600 mt-1">Manage your earnings and bank accounts</p>
        </div>
        <Button onClick={() => setShowAddBankAccount(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Bank Account
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(availableBalance / 100).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Ready for payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Balance</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ${(pendingBalance / 100).toFixed(2)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Clearing in 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${((availableBalance + pendingBalance) / 100).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">All time earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Bank Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BankIcon className="w-5 h-5" />
            Bank Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <div className="text-center py-8">
              <BankIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No bank accounts added</p>
              <Button onClick={() => setShowAddBankAccount(true)}>
                Add Bank Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {bankAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <BankIcon className="w-8 h-8 text-gray-600" />
                    <div>
                      <p className="font-medium">{account.bankName}</p>
                      <p className="text-sm text-gray-600">
                        {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} •••• {account.accountNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(account.status)}>
                      {account.status}
                    </Badge>
                    {account.isDefault && (
                      <Badge className="bg-blue-100 text-blue-800">Default</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Payout */}
      {availableBalance >= 1000 && bankAccounts.some(acc => acc.status === 'verified') && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Request payout of available balance</p>
                <p className="text-lg font-semibold">
                  ${(availableBalance / 100).toFixed(2)} available
                </p>
              </div>
              <Button 
                onClick={() => {
                  const defaultAccount = bankAccounts.find(acc => acc.isDefault && acc.status === 'verified');
                  if (defaultAccount) {
                    createPayout(availableBalance, defaultAccount.id);
                  }
                }}
              >
                Request Payout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Payout History
            </span>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payouts yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(payout.status)}
                    <div>
                      <p className="font-medium">${(payout.netAmount / 100).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">
                        {payout.bankAccount.bankName} •••• {payout.bankAccount.accountNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(payout.status)}>
                      {payout.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {payout.processedAt 
                        ? new Date(payout.processedAt).toLocaleDateString()
                        : new Date(payout.createdAt).toLocaleDateString()
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Bank Account Modal */}
      {showAddBankAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Bank Account</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Add a bank account to receive payouts. Funds are typically available within 3 business days.
              </p>
              <div className="space-y-4">
                <Button 
                  className="w-full" 
                  onClick={() => {
                    // Redirect to Stripe Connect onboarding
                    window.location.href = '/api/payouts/onboarding';
                  }}
                >
                  Continue to Stripe
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowAddBankAccount(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PayoutsDashboard;
