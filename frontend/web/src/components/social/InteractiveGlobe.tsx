import { useState, useEffect, useMemo } from 'react';

export function InteractiveGlobe() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
        setRotation(r => r + 0.5);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const stars = useMemo(() => [...Array(20)].map((_, i) => ({
    id: i,
    width: Math.random() * 3 + 'px',
    height: Math.random() * 3 + 'px',
    top: Math.random() * 100 + '%',
    left: Math.random() * 100 + '%',
    animationDelay: Math.random() * 2 + 's'
  })), []);

  return (
    <div className="w-full h-[400px] flex items-center justify-center relative overflow-hidden bg-[#0a0a2a] rounded-3xl border border-gray-800">
        {/* Stars Background */}
        <div className="absolute inset-0 opacity-50">
            {stars.map((star) => (
                <div key={star.id} className="absolute bg-white rounded-full animate-pulse" 
                     style={{
                         width: star.width,
                         height: star.height,
                         top: star.top,
                         left: star.left,
                         animationDelay: star.animationDelay
                     }}
                ></div>
            ))}
        </div>

        {/* The Globe */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full bg-blue-600 shadow-[inset_-20px_-20px_50px_rgba(0,0,0,0.5),0_0_50px_rgba(59,130,246,0.5)] overflow-hidden cursor-move transition-transform hover:scale-105 duration-700"
             style={{ background: 'radial-gradient(circle at 30% 30%, #3b82f6, #1d4ed8, #1e3a8a)' }}>
            
            {/* Continents (Simplified Shapes) moving for rotation effect */}
            <div className="absolute inset-0 opacity-80" style={{ transform: `translateX(-${rotation % 100}%)` }}>
                {/* Mock Continents Pattern - Repeated for infinite scroll illusion */}
                <div className="absolute top-[20%] left-[20%] text-green-500/80 text-9xl font-black select-none pointer-events-none blur-[2px]">🌎</div>
                <div className="absolute top-[50%] left-[60%] text-green-600/80 text-8xl font-black select-none pointer-events-none blur-[2px]">🌍</div>
                <div className="absolute top-[30%] left-[120%] text-green-500/80 text-9xl font-black select-none pointer-events-none blur-[2px]">🌎</div>
                <div className="absolute top-[10%] left-[180%] text-green-600/80 text-8xl font-black select-none pointer-events-none blur-[2px]">🌍</div>
            </div>

            {/* Flight Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <linearGradient id="flightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                </defs>
                {/* Arcs */}
                <path d="M 50 150 Q 150 50 250 150" fill="none" stroke="url(#flightGradient)" strokeWidth="2" className="opacity-60" strokeDasharray="5,5">
                    <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" repeatCount="indefinite" />
                </path>
                <path d="M 80 200 Q 160 100 240 180" fill="none" stroke="url(#flightGradient)" strokeWidth="1.5" className="opacity-40" strokeDasharray="5,5">
                    <animate attributeName="stroke-dashoffset" from="100" to="0" dur="3s" repeatCount="indefinite" />
                </path>
            </svg>

            {/* Traveler Markers */}
            <div className="absolute top-[40%] left-[30%] w-3 h-3 bg-pink-500 rounded-full shadow-[0_0_10px_#ec4899] animate-ping"></div>
            <div className="absolute top-[25%] left-[70%] w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_#facc15] animate-bounce"></div>
        </div>

        {/* Overlay Info */}
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
            <div className="bg-black/50 backdrop-blur rounded-xl p-3 border border-white/10">
                <div className="text-xs text-gray-400">Live Traffic</div>
                <div className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    1,245 Active Trips
                </div>
            </div>
            <div className="bg-black/50 backdrop-blur rounded-xl p-3 border border-white/10 hidden md:block">
                 <div className="text-xs text-gray-400">Global Coverage</div>
                 <div className="text-white font-bold">120 Countries</div>
            </div>
        </div>
    </div>
  );
}

export default InteractiveGlobe;
