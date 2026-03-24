import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  WalletIcon, 
  ArrowsRightLeftIcon,
  QrCodeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

interface CryptoWallet {
  currency: string
  symbol: string
  balance: number
  usdValue: number
  icon: string
}

const CryptoPaymentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'wallet' | 'send' | 'receive'>('wallet')

  const wallets: CryptoWallet[] = [
    { currency: 'Bitcoin', symbol: 'BTC', balance: 0.0234, usdValue: 1050.30, icon: '₿' },
    { currency: 'Ethereum', symbol: 'ETH', balance: 0.5, usdValue: 1150.00, icon: 'Ξ' },
    { currency: 'USDT', symbol: 'USDT', balance: 500, usdValue: 500.00, icon: '₮' },
    { currency: 'BNB', symbol: 'BNB', balance: 2.5, usdValue: 750.00, icon: '◈' },
  ]

  const totalBalance = wallets.reduce((sum, w) => sum + w.usdValue, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">₿ محفظة العملات الرقمية</h1>
          <p className="text-slate-400">ادفع واستلم بالعملات المشفرة بأمان</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 mb-8">
          <p className="text-amber-100 mb-2">إجمالي الرصيد</p>
          <h2 className="text-4xl font-bold">${totalBalance.toLocaleString()}</h2>
        </motion.div>

        <div className="flex gap-2 mb-6">
          {(['wallet', 'send', 'receive'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${activeTab === tab ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              {tab === 'wallet' ? '💰 المحفظة' : tab === 'send' ? '📤 إرسال' : '📥 استلام'}
            </button>
          ))}
        </div>

        {activeTab === 'wallet' && (
          <div className="space-y-4">
            {wallets.map((wallet, i) => (
              <motion.div key={wallet.symbol} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-slate-700/50 rounded-xl p-4 flex items-center justify-between hover:bg-slate-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center text-2xl">{wallet.icon}</div>
                  <div>
                    <h3 className="font-semibold">{wallet.currency}</h3>
                    <p className="text-slate-400 text-sm">{wallet.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{wallet.balance} {wallet.symbol}</p>
                  <p className="text-slate-400 text-sm">${wallet.usdValue.toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'send' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">إرسال عملات</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-2">العملة</label>
                <select className="w-full bg-slate-600 rounded-lg p-3 text-white">
                  {wallets.map(w => <option key={w.symbol} value={w.symbol}>{w.currency}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-2">عنوان المستلم</label>
                <input type="text" placeholder="0x..." className="w-full bg-slate-600 rounded-lg p-3 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-2">المبلغ</label>
                <input type="number" placeholder="0.00" className="w-full bg-slate-600 rounded-lg p-3 text-white" />
              </div>
              <button className="w-full py-3 bg-amber-500 rounded-xl font-semibold hover:bg-amber-600">إرسال</button>
            </div>
          </motion.div>
        )}

        {activeTab === 'receive' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-700/50 rounded-xl p-6 text-center">
            <h3 className="text-xl font-semibold mb-4">استلام عملات</h3>
            <div className="w-48 h-48 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center">
              <QrCodeIcon className="w-32 h-32 text-slate-900" />
            </div>
            <p className="text-slate-400 mb-2">عنوان محفظتك</p>
            <p className="font-mono text-sm bg-slate-600 p-3 rounded-lg break-all">0x1234...5678</p>
          </motion.div>
        )}

        <div className="mt-8 bg-slate-700/30 rounded-xl p-4 flex items-center gap-3">
          <ShieldCheckIcon className="w-8 h-8 text-green-400" />
          <div>
            <p className="font-medium">معاملات آمنة</p>
            <p className="text-slate-400 text-sm">جميع المعاملات مشفرة ومحمية</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CryptoPaymentPage
