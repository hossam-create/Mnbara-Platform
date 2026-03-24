import React, { useState } from 'react';
import { HologramPanel } from '../../components/control-center/ui/HologramPanel';
import { CommandTerminal } from '../../components/control-center/ui/CommandTerminal';
import { useControlCenterTheme } from '../../contexts/ControlCenterThemeContext';

export default function Studio() {
  const { colors } = useControlCenterTheme();
  const [activeTab, setActiveTab] = useState<'hex' | 'debug'>('hex');

  // Mock Hex Data
  const hexData = Array.from({ length: 16 * 20 }).map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase());

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Editor Area */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <HologramPanel className="flex-1 flex flex-col font-mono text-xs">
          <div className="flex border-b border-white/10 mb-2">
            <button 
              className={`px-4 py-2 ${activeTab === 'hex' ? 'bg-white/10 text-white' : 'opacity-50 hover:opacity-100'}`}
              onClick={() => setActiveTab('hex')}
            >
              HEX EDITOR
            </button>
            <button 
              className={`px-4 py-2 ${activeTab === 'debug' ? 'bg-white/10 text-white' : 'opacity-50 hover:opacity-100'}`}
              onClick={() => setActiveTab('debug')}
            >
              DEBUGGER
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4 bg-black/20 rounded">
            {activeTab === 'hex' ? (
              <div className="grid grid-cols-[auto_1fr] gap-4">
                <div className="text-gray-500 text-right select-none">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i}>{(i * 16).toString(16).padStart(8, '0').toUpperCase()}</div>
                  ))}
                </div>
                <div className="grid grid-cols-16 gap-x-2 gap-y-1">
                  {hexData.map((byte, i) => (
                    <span 
                      key={i} 
                      className={`hover:bg-white/20 cursor-pointer ${Math.random() > 0.9 ? 'text-' + colors.accent : ''}`}
                      style={{ color: Math.random() > 0.95 ? colors.primary : colors.text }}
                    >
                      {byte}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-green-400">
                <div>[DEBUG] Initializing core modules... OK</div>
                <div>[DEBUG] Loading payload configuration...</div>
                <div className="pl-4 text-gray-400">
                   0x0045AF: MOV EAX, [EBP+8]<br/>
                   0x0045B2: ADD EAX, 5<br/>
                   0x0045B5: PUSH EAX
                </div>
                <div>[DEBUG] Waiting for process attachment...</div>
              </div>
            )}
          </div>
        </HologramPanel>
        
        <HologramPanel title="Payload Builder" className="h-48">
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs uppercase opacity-70 block mb-1">Target Architecture</label>
               <select className="w-full bg-black/30 border border-white/20 rounded p-2 text-sm outline-none focus:border-current" style={{ borderColor: colors.primary }}>
                 <option>x64 (Windows)</option>
                 <option>x86 (Windows)</option>
                 <option>ARM64 (Android)</option>
               </select>
             </div>
             <div>
               <label className="text-xs uppercase opacity-70 block mb-1">Injection Method</label>
               <select className="w-full bg-black/30 border border-white/20 rounded p-2 text-sm outline-none focus:border-current" style={{ borderColor: colors.primary }}>
                 <option>Process Hollowing</option>
                 <option>DLL Injection</option>
                 <option>Reflective Loading</option>
               </select>
             </div>
          </div>
        </HologramPanel>
      </div>

      {/* Side Tools */}
      <div className="flex flex-col gap-4">
        <HologramPanel title="Stack View" className="h-64 overflow-auto font-mono text-xs">
           {[...Array(10)].map((_, i) => (
             <div key={i} className="flex justify-between border-b border-white/5 py-1">
               <span className="opacity-50">0x{Math.floor(Math.random()*100000).toString(16)}</span>
               <span style={{ color: colors.accent }}>0x00000000</span>
             </div>
           ))}
        </HologramPanel>
        
        <CommandTerminal className="flex-1" minimized={false} />
      </div>
    </div>
  );
}
