import { useState, useEffect } from 'react';
import { useSecurity } from '../../context/SecurityContext';

export default function ArachnidAI() {
  const { threatLevel, reportThreat, lockdownMode } = useSecurity();
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'ANALYZING' | 'HEALING'>('IDLE');
  const [anomaly, setAnomaly] = useState<string | null>(null);

  // The "Spider" Logic 🕷️
  useEffect(() => {
    const spiderCycle = setInterval(() => {
       // 1. Scan
       setStatus('SCANNING');
       
       // Mock Probability of Anomaly
       if (Math.random() > 0.95 && !anomaly && !lockdownMode) {
           detectAnomaly();
       } else {
           setTimeout(() => setStatus('IDLE'), 1000);
       }
    }, 8000);

    return () => clearInterval(spiderCycle);
  }, [anomaly, lockdownMode]);

  const detectAnomaly = () => {
      setStatus('ANALYZING');
      const anomalies = [
          'Unauthorized Access Attempt (IP: 192.168.1.X)',
          'Payment Gateway Latency Spike (2000ms)',
          'Database Connection Pool Exhaustion',
          'Suspicious Bulk Data Export'
      ];
      const detected = anomalies[Math.floor(Math.random() * anomalies.length)];
      setAnomaly(detected);
      addLog(`⚠️ ANOMALY DETECTED: ${detected}`);
      
      // Auto Request Fix
      setTimeout(() => {
          if (detected.includes('Unauthorized') || detected.includes('Export')) {
              reportThreat('HIGH');
              addLog('🛡️ ACTION: Firewall Rules Updated. IP Blocked.');
          } else {
              addLog('🔧 ACTION: Auto-Scaling Initiated. Healing...');
          }
          setStatus('HEALING');
      }, 2000);
  };

  const resolveAnomaly = () => {
      setAnomaly(null);
      setStatus('IDLE');
      addLog('✅ SYSTEM NORMALIZED. Resume Patrol.');
  };

  const addLog = (msg: string) => {
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));
  };

  return (
    <div className={`fixed bottom-4 right-4 z-[100] transition-all duration-500 ${anomaly ? 'w-96' : 'w-16 hover:w-96'} h-auto bg-black/90 backdrop-blur-md border ${threatLevel === 'LOW' ? 'border-cyan-500/30' : 'border-red-500'} rounded-2xl overflow-hidden shadow-2xl`}>
        
        {/* Header / Minimized State */}
        <div className="p-4 flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
                <div className={`relative w-8 h-8 flex items-center justify-center rounded-full ${anomaly ? 'bg-red-500 animate-pulse' : 'bg-cyan-900'}`}>
                    <span className="text-xl">🕷️</span>
                    {status === 'SCANNING' && <div className="absolute inset-0 border-2 border-cyan-400 rounded-full animate-ping opacity-20"></div>}
                </div>
                <div className={`${anomaly ? 'block' : 'hidden group-hover:block'} transition-all`}>
                    <h3 className="text-white font-bold font-mono text-sm tracking-widest">ARACHNID v1.0</h3>
                    <p className={`text-xs ${threatLevel === 'CRITICAL' ? 'text-red-500 font-bold' : 'text-cyan-400'}`}>
                        STATUS: {status}
                    </p>
                </div>
            </div>
        </div>

        {/* Expanded Content (Details) */}
        <div className={`${anomaly ? 'block' : 'hidden group-hover:block'} px-4 pb-4 border-t border-white/10`}>
            {anomaly && (
                <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg my-3">
                    <p className="text-red-200 text-xs font-mono">{anomaly}</p>
                    <button 
                        onClick={resolveAnomaly}
                        className="mt-2 w-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-1 rounded"
                    >
                        {status === 'HEALING' ? 'CONFIRM FIX' : 'INITIATE COUNTERMEASURE'}
                    </button>
                </div>
            )}

            <div className="space-y-1">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Live Neural Logs</p>
                {logs.map((log, i) => (
                    <div key={i} className="text-[10px] font-mono text-cyan-200/70 truncate border-l-2 border-cyan-500/20 pl-2">
                        {log}
                    </div>
                ))}
            </div>
            
            <div className="mt-3 pt-2 border-t border-white/5 flex justify-between text-[10px] text-gray-500">
                <span>RAM: 32%</span>
                <span>CPU: 12%</span>
                <span>NET: SECURE</span>
            </div>
        </div>
    </div>
  );
}
