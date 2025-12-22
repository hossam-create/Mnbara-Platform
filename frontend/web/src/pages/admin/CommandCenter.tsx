import { useNavigate } from 'react-router-dom';
import { useSecurity } from '../../context/SecurityContext';
import { useEffect, useState } from 'react';
import { opsService, type OpsMetrics } from '../../services/ops.service';

export default function CommandCenter() {
  const { role, threatLevel: contextThreatLevel } = useSecurity();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<OpsMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await opsService.getMetrics();
      setMetrics(data);
    } catch (e) {
      console.error('Failed to load OPS data');
    } finally {
      setLoading(false);
    }
  };

  const dashboardMetrics = metrics ? [
    { label: 'Active Travelers', value: metrics.activeTravelers.toLocaleString(), change: `+${metrics.activeTravelersChange}%`, color: 'text-cyan-400' },
    { label: 'Pending Shipments', value: metrics.pendingShipments.toLocaleString(), change: `+${metrics.pendingShipmentsChange}%`, color: 'text-blue-400' },
    { label: 'Escrow Holdings', value: `$${(metrics.escrowTotal / 1000000).toFixed(1)}M`, change: `+${metrics.escrowChange}%`, color: 'text-green-400' },
    { label: 'Security Threats', value: metrics.securityThreats, change: metrics.threatLevel, color: metrics.securityThreats > 0 ? 'text-red-500' : 'text-emerald-500' },
  ] : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Protocol Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading ? (
           // Skeletons
           [1,2,3,4].map(i => (
             <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl h-32 animate-pulse"></div>
           ))
        ) : (
          dashboardMetrics.map((m, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl backdrop-blur-sm hover:border-slate-700 transition-all cursor-crosshair group">
              <h3 className="text-slate-500 text-xs uppercase tracking-widest font-mono mb-2">{m.label}</h3>
              <div className={`text-3xl font-black ${m.color} tracking-tighter group-hover:scale-105 transition-transform origin-left`}>
                {m.value}
              </div>
              <div className="text-[10px] text-slate-600 font-mono mt-2 flex items-center gap-2">
                <span className="bg-white/5 px-1 rounded">{m.change}</span>
                <span>SINCE 0600 HOURS</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* The Map (Holographic Placeholder) */}
      <div className="h-96 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] opacity-10 bg-cover bg-center grayscale invert"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
        
        <div className="absolute bottom-8 left-8">
            <h2 className="text-2xl font-black text-white mb-1">GLOBAL OPERATIONS MAP</h2>
            <p className="text-xs text-cyan-500 font-mono">LIVE TRACKING: 142 FLIGHTS AIRBORNE</p>
        </div>

        {/* Mock Blips - These could also be dynamic later */}
        <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-cyan-500 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-purple-500 rounded-full animate-ping delay-700"></div>
        <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-green-500 rounded-full animate-ping delay-300"></div>
      </div>

      {/* Department Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Front Office */}
        <div onClick={() => navigate('/fortress/cs')} className="p-6 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all cursor-pointer group hover:border-cyan-500/30">
            <div className="flex items-center justify-between mb-4">
                <span className="text-2xl group-hover:scale-110 transition-transform">🎧</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-950 px-2 py-1 rounded">LEVEL 2 ACCESS</span>
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-1">Front Office (CS)</h3>
            <p className="text-xs text-slate-500">Customer tickets, disputes, and live retention.</p>
        </div>

        {/* Back Office (Finance) */}
        <div onClick={() => navigate('/fortress/finance')} className={`p-6 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all cursor-pointer group hover:border-green-500/30 ${(role === 'CS_AGENT') ? 'opacity-50 grayscale cursor-not-allowed pointer-events-none' : ''}`}>
             <div className="flex items-center justify-between mb-4">
                <span className="text-2xl group-hover:scale-110 transition-transform">🏦</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-950 px-2 py-1 rounded">LEVEL 4 ACCESS</span>
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-1">Financial Tower</h3>
            <p className="text-xs text-slate-500">Escrow vault, payout release, and audit logs.</p>
            {role === 'CS_AGENT' && <div className="mt-2 text-[10px] text-red-500 font-bold border border-red-900/50 bg-red-900/10 p-1 text-center rounded">ACCESS DENIED</div>}
        </div>

        {/* Logistics */}
        <div onClick={() => navigate('/fortress/ops')} className="p-6 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all cursor-pointer group hover:border-purple-500/30">
             <div className="flex items-center justify-between mb-4">
                <span className="text-2xl group-hover:scale-110 transition-transform">✈️</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-950 px-2 py-1 rounded">LEVEL 3 ACCESS</span>
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-1">Logistics Ops</h3>
            <p className="text-xs text-slate-500">Shipment control, traveler tracking, and customs.</p>
        </div>

      </div>
    </div>
  );
}
