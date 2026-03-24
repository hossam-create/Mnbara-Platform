import React from 'react';
import { HologramPanel } from '../../components/control-center/ui/HologramPanel';
import { useControlCenterTheme } from '../../contexts/ControlCenterThemeContext';

const SERVERS = [
  { id: 'SRV-ALPHA', region: 'US-EAST', load: 85, temp: 42, status: 'warning' },
  { id: 'SRV-BETA', region: 'EU-WEST', load: 32, temp: 38, status: 'nominal' },
  { id: 'SRV-GAMMA', region: 'ASIA-PAC', load: 12, temp: 35, status: 'nominal' },
  { id: 'SRV-DELTA', region: 'SA-EAST', load: 92, temp: 80, status: 'critical' },
  { id: 'SRV-OMEGA', region: 'AFRICA-N', load: 45, temp: 40, status: 'nominal' },
];

export default function ServerMonitor() {
  const { colors } = useControlCenterTheme();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {SERVERS.map(server => (
        <HologramPanel 
          key={server.id} 
          title={server.id} 
          flicker={server.status === 'critical'}
          className={server.status === 'critical' ? 'border-red-500' : ''}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="opacity-60">Region</span>
              <span className="font-mono">{server.region}</span>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs uppercase opacity-70">
                <span>CPU Load</span>
                <span>{server.load}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    server.load > 90 ? 'bg-red-500 animate-pulse' : 
                    server.load > 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${server.load}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs uppercase opacity-70">
                <span>Temp</span>
                <span>{server.temp}°C</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(server.temp / 100) * 100}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  server.status === 'nominal' ? 'bg-green-500' :
                  server.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-xs uppercase">{server.status}</span>
              </div>
              <button className="text-xs hover:text-white transition-colors" style={{ color: colors.accent }}>
                DIAGNOSE &rarr;
              </button>
            </div>
          </div>
        </HologramPanel>
      ))}

      {/* bandwidth graph placeholder */}
      <HologramPanel title="Global Bandwidth" className="col-span-1 md:col-span-2 xl:col-span-3 h-64">
        <div className="h-full flex items-end gap-1 px-4 pb-4">
           {Array.from({ length: 50 }).map((_, i) => (
             <div 
               key={i} 
               className="flex-1 bg-gradient-to-t from-transparent to-current opacity-50 hover:opacity-100 transition-all"
               style={{ 
                 height: `${20 + Math.random() * 60}%`,
                 color: colors.primary
               }} 
             />
           ))}
        </div>
      </HologramPanel>
    </div>
  );
}
