import React, { useState } from 'react';
import { HologramPanel } from '../../components/control-center/ui/HologramPanel';
import { HexButton } from '../../components/control-center/ui/HexButton';

export default function Apocalypse() {
  const [armed, setArmed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleArm = () => {
    setArmed(!armed);
    setCountdown(null);
  };

  const handleActivate = () => {
    if (!armed) return;
    setCountdown(10);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(interval);
          // Trigger nuke (mock)
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <HologramPanel title="PROTOCOL: DEAD MAN SWITCH" className="border-red-600 bg-red-900/10" flicker={armed}>
          <div className="text-center space-y-8 py-12">
            <div className="flex justify-center">
              <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center text-4xl duration-500 ${
                  armed ? 'border-red-500 animate-pulse text-red-500 shadow-[0_0_50px_red]' : 'border-gray-700 text-gray-700'
                }`}>
                {countdown !== null ? countdown : '☢'}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold uppercase tracking-widest text-red-500">
                {countdown === 0 ? 'PROTOCOL EXECUTED' : armed ? 'SYSTEM ARMED - AWAITING CONFIRMATION' : 'SYSTEM SECURED'}
              </h2>
              <p className="text-sm opacity-60 max-w-md mx-auto">
                Activation of this protocol will initiate a complete system scrub. All localized data will be purged. 
                Network connections will be severed instantly. This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-4 justify-center pt-8">
              <HexButton 
                variant="ghost" 
                onClick={handleArm}
                className="hover:border-red-500 hover:text-red-500"
              >
                {armed ? 'DISARM SYSTEM' : 'ARM SYSTEM'}
              </HexButton>
              
              <HexButton 
                variant="danger" 
                glow={armed}
                disabled={!armed || countdown !== null}
                onClick={handleActivate}
                className={`transition-all ${armed ? 'opacity-100 scale-110' : 'opacity-50 cursor-not-allowed'}`}
              >
                EXECUTE PURGE
              </HexButton>
            </div>
          </div>
        </HologramPanel>
      </div>
    </div>
  );
}
