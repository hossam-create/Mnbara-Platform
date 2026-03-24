import React, { useEffect, useState } from 'react';
import { HologramPanel } from '../../components/control-center/ui/HologramPanel';
import { HexButton } from '../../components/control-center/ui/HexButton';
import { useControlCenterTheme } from '../../contexts/ControlCenterThemeContext';

const MOCK_ATTACKS = [
  { id: 1, source: { x: 20, y: 30 }, target: { x: 50, y: 50 }, type: 'DDoS', intensity: 'high' },
  { id: 2, source: { x: 80, y: 20 }, target: { x: 50, y: 52 }, type: 'SQLi', intensity: 'low' },
  { id: 3, source: { x: 10, y: 80 }, target: { x: 45, y: 55 }, type: 'BruteForce', intensity: 'medium' },
];

export default function ThreatMap() {
  const { colors } = useControlCenterTheme();
  const [attacks, setAttacks] = useState(MOCK_ATTACKS);

  // Simulate new attacks
  useEffect(() => {
    const interval = setInterval(() => {
      const newAttack = {
        id: Date.now(),
        source: { x: Math.random() * 100, y: Math.random() * 100 },
        target: { x: 45 + Math.random() * 10, y: 45 + Math.random() * 10 },
        type: ['DDoS', 'Malware', 'Phishing', 'Probe'][Math.floor(Math.random() * 4)],
        intensity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high'
      };
      setAttacks(prev => [...prev.slice(-10), newAttack]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="grid grid-cols-12 gap-6 h-full">
        {/* Main Map */}
        <div className="col-span-12 lg:col-span-9 h-[600px] relative">
          <HologramPanel title="Global Threat Vector" className="h-full relative overflow-hidden bg-black/40">
            {/* World Map Placeholder/SVG */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
               <svg viewBox="0 0 1000 500" className="w-full h-full fill-current text-gray-600">
                  {/* Simplified World Map shapes would go here - using text for now */}
                  <text x="500" y="250" fontSize="20" textAnchor="middle">WORLD MAP PROJECTION</text>
                  <circle cx="500" cy="250" r="200" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" />
               </svg>
            </div>

            {/* Attack Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {attacks.map(attack => (
                <g key={attack.id}>
                  <line 
                    x1={`${attack.source.x}%`} 
                    y1={`${attack.source.y}%`} 
                    x2={`${attack.target.x}%`} 
                    y2={`${attack.target.y}%`} 
                    stroke={attack.intensity === 'high' ? colors.danger : colors.accent} 
                    strokeWidth={attack.intensity === 'high' ? 2 : 1}
                    strokeDasharray="5,5"
                    className="animate-pulse"
                  />
                  <circle cx={`${attack.source.x}%`} cy={`${attack.source.y}%`} r="3" fill={colors.danger} className="animate-ping" />
                </g>
              ))}
            </svg>

            {/* Overlay UI */}
            <div className="absolute bottom-4 left-4 p-4 bg-black/60 backdrop-blur rounded border border-white/10">
              <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">Live Statistics</div>
              <div className="flex gap-4">
                <div>
                  <div className="text-2xl font-mono text-red-500">{attacks.length}</div>
                  <div className="text-[10px]">Active Threats</div>
                </div>
                <div>
                  <div className="text-2xl font-mono text-yellow-500">12ms</div>
                  <div className="text-[10px]">Avg Latency</div>
                </div>
              </div>
            </div>
          </HologramPanel>
        </div>

        {/* Side Panel: Feed */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <HologramPanel title="Threat Feed" className="flex-1">
            <div className="space-y-3 font-mono text-xs overflow-y-auto max-h-[500px] scrollbar-hide">
              {attacks.slice().reverse().map(attack => (
                <div key={attack.id} className="flex items-center justify-between p-2 border-b border-white/5">
                  <span className={attack.intensity === 'high' ? 'text-red-500' : 'text-blue-400'}>{attack.type.toUpperCase()}</span>
                  <span className="opacity-50">Origin: {Math.floor(attack.source.x)},{Math.floor(attack.source.y)}</span>
                </div>
              ))}
            </div>
          </HologramPanel>
          
          <HexButton variant="danger" glow className="w-full justify-center">
             LOCKDOWN SECTOR
          </HexButton>
        </div>
      </div>
    </div>
  );
}
