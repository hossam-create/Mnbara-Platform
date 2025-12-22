import { useSecurity } from '../../../context/SecurityContext';

export default function FinanceTower() {
  const { clearance, accessVault } = useSecurity();

  const handleReleaseFunds = () => {
      // The High Security Check
      if (accessVault(4, 'Releasing Payment Payout #9921')) {
          alert('💸 FUNDS RELEASED: $450.00 to Traveler #882');
      } else {
          alert('⛔ ACCESS DENIED: INSUFFICIENT CLEARANCE. THIS INCIDENT HAS BEEN LOGGED.');
      }
  };

  if (clearance < 4) {
      return (
          <div className="h-96 flex flex-col items-center justify-center text-center space-y-4">
              <div className="text-6xl">🔒</div>
              <h1 className="text-2xl font-black text-red-500">RESTRICTED AREA</h1>
              <p className="text-slate-500 max-w-md">You do not have the required FINANCIAL SECURITY CLEARANCE (Level 4) to view this vault.</p>
          </div>
      );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-black text-white">FINANCIAL TOWER</h1>
                <p className="text-sm text-green-500 font-mono">ESCROW VAULT & LIQUIDITY CONTROL</p>
            </div>
            <div className="px-4 py-2 bg-green-900/20 border border-green-500/30 rounded text-green-400 font-mono font-bold text-sm">
                VAULT BALANCE: $8,240,192.00
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pending Payouts */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <span>💸</span> PENDING RELEASE
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded border border-slate-800">
                        <div>
                            <div className="text-white font-bold">Traveler: Mike Ross</div>
                            <div className="text-xs text-slate-500">Order #ORD-2291 • Delivered 2h ago</div>
                        </div>
                        <div className="text-right">
                            <div className="text-green-400 font-mono font-bold text-lg">$450.00</div>
                            <button 
                                onClick={handleReleaseFunds}
                                className="mt-1 px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold rounded uppercase tracking-wider"
                            >
                                Release Funds
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 opacity-50">
                <h3 className="text-white font-bold mb-4">AUDIT LOG</h3>
                <div className="space-y-2">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="text-xs font-mono text-slate-500 border-l-2 border-slate-700 pl-2">
                            [14:2{i}] Payout #88{i} released by ADMIN_FINANCE_1
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}
