import React, { useState } from 'react';
import { ArrowUp, ArrowDown, CreditCard, Wallet, AlertCircle } from 'lucide-react';

const WithdrawDepositPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');

  const handleDeposit = () => {
    console.log('Deposit:', { amount, method });
  };

  const handleWithdraw = () => {
    console.log('Withdraw:', { amount, method });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wallet Management</h1>
          <p className="mt-2 text-gray-600">Deposit funds or withdraw your balance</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('deposit')}
                className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'deposit'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <ArrowDown className="w-4 h-4" />
                  Deposit
                </div>
              </button>
              <button
                onClick={() => setActiveTab('withdraw')}
                className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'withdraw'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <ArrowUp className="w-4 h-4" />
                  Withdraw
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'deposit' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setMethod('card')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        method === 'card'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CreditCard className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <div className="text-sm font-medium">Credit Card</div>
                    </button>
                    <button
                      onClick={() => setMethod('wallet')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        method === 'wallet'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Wallet className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <div className="text-sm font-medium">Digital Wallet</div>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={!amount || !method}
                  className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
                >
                  Deposit Funds
                </button>

                <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Deposit Information</p>
                    <p>Deposits are processed instantly. Minimum deposit: $10. Maximum deposit: $10,000 per transaction.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withdrawal Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withdrawal Method
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setMethod('bank')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        method === 'bank'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Wallet className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <div className="text-sm font-medium">Bank Transfer</div>
                    </button>
                    <button
                      onClick={() => setMethod('card')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        method === 'card'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CreditCard className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <div className="text-sm font-medium">Credit Card</div>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={!amount || !method}
                  className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
                >
                  Withdraw Funds
                </button>

                <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Withdrawal Information</p>
                    <p>Withdrawals are processed within 1-3 business days. Minimum withdrawal: $20. Processing fee: $2.50 per withdrawal.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawDepositPage;
