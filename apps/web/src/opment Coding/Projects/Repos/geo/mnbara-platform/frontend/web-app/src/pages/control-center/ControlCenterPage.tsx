import React from 'react';
import { useControlCenterTheme } from '../../contexts/ControlCenterThemeContext';
import { HologramPanel } from '../../components/control-center/ui/HologramPanel';
import { HexButton } from '../../components/control-center/ui/HexButton';
import { CommandTerminal } from '../../components/control-center/ui/CommandTerminal';

const KPIS = [
  { label: 'Network Integrity', value: '98.2%', status: 'nominal' },
  { label: 'Active Corridors', value: '14', status: 'nominal' },
  { label: 'Threat Level', value: 'ELEVATED', status: 'warning' },
  { label: 'Encrypted Packets', value: '4.2TB', status: 'nominal' },
];

const DISPUTES = [
  { id: 'DSP-341', agent: 'Agent K', target: 'TRV-442', type: 'Fraud Check', time: '3m ago' },
  { id: 'DSP-332', agent: 'Agent R', target: 'TRV-319', type: 'Verification', time: '12m ago' },
  { id: 'DSP-327', agent: 'System', target: 'TRV-112', type: 'Auto-Flag', time: '1h ago' },
];

export default function ControlCenterPage() {
  const { colors } = useControlCenterTheme();

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map(kpi => (
          <HologramPanel key={kpi.label} className={kpi.status === 'warning' ? 'border-yellow-500' : ''}>
            <div className="text-xs uppercase opacity-60 mb-1">{kpi.label}</div>
            <div className="text-2xl font-bold font-mono tracking-wider" style={{ color: kpi.status === 'warning' ? colors.secondary : colors.primary }}>
              {kpi.value}
            </div>
            <div className="flex items-center gap-1 mt-2 text-[10px]">
              <div className={`w-1.5 h-1.5 rounded-full ${kpi.status === 'nominal' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span className="opacity-50">{kpi.status.toUpperCase()}</span>
            </div>
          </HologramPanel>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Main Feed / Map Placeholder */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <HologramPanel title="Global Operations Radar" className="flex-1 min-h-[400px]">
             {/* Mock Radar UI */}
             <div className="h-full flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 border-4 border-current opacity-10 rounded-full scale-150 animate-[spin_10s_linear_infinite]" />
                <div className="absolute inset-0 border-2 border-dashed border-current opacity-20 rounded-full scale-75 animate-[spin_15s_linear_infinite_reverse]" />
                
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-green-500 rounded-full" />
                
                <div className="text-center z-10 p-4 bg-black/50 backdrop-blur rounded">
                   <div className="text-2xl font-bold">SYSTEM ACTIVE</div>
                   <div className="text-xs opacity-70">Scanning Sector 7G...</div>
                </div>
             </div>
          </HologramPanel>

          <div className="grid grid-cols-2 gap-4">
            <HologramPanel title="Quick Actions">
              <div className="grid grid-cols-2 gap-2">
                 <HexButton variant="secondary" className="text-xs">
                    Clean Cache
                 </HexButton>
                 <HexButton variant="secondary" className="text-xs">
                    Reset Nodes
                 </HexButton>
              </div>
            </HologramPanel>
            <HologramPanel title="Resource Usage">
               <div className="space-y-2">
                  <div className="flex justify-between text-xs"><span>RAM</span><span>64%</span></div>
                  <div className="h-1 bg-gray-700 rounded-full"><div className="w-[64%] h-full bg-blue-500 rounded-full" /></div>
                  <div className="flex justify-between text-xs"><span>CPU</span><span>32%</span></div>
                  <div className="h-1 bg-gray-700 rounded-full"><div className="w-[32%] h-full bg-green-500 rounded-full" /></div>
               </div>
            </HologramPanel>
          </div>
        </div>

        {/* Side Panel: Terminal & Disputes */}
        <div className="flex flex-col gap-6">
           <HologramPanel title="Active Cases" className="flex-1">
             <div className="space-y-2">
               {DISPUTES.map(d => (
                 <div key={d.id} className="p-2 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                   <div className="flex justify-between items-center mb-1">
                     <span className="font-mono text-xs text-blue-400 group-hover:text-blue-300">{d.id}</span>
                     <span className="text-[10px] opacity-40">{d.time}</span>
                   </div>
                   <div className="text-sm">{d.type}</div>
                   <div className="text-xs opacity-50 mt-1">Target: {d.target}</div>
                 </div>
               ))}
             </div>
           </HologramPanel>

           <div className="h-64">
              <CommandTerminal initialLines={['System booted...', 'Connected to main frame.']} minimized={false} />
           </div>
        </div>
      </div>
    </div>
  );
}
