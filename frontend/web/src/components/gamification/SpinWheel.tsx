// ============================================
// 🎰 Spin Wheel Component
// ============================================

import { useState, useRef } from 'react';
import type { SpinWheelPrize } from '../../types/advanced-features';

interface SpinWheelProps {
  prizes: SpinWheelPrize[];
  onSpin: () => Promise<{ prizeIndex: number; code?: string }>;
  spinsRemaining: number;
}

export function SpinWheel({ prizes, onSpin, spinsRemaining }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ prize: SpinWheelPrize; code?: string } | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpin = async () => {
    if (isSpinning || spinsRemaining <= 0) return;

    setIsSpinning(true);
    setResult(null);

    try {
      const { prizeIndex, code } = await onSpin();
      
      // Calculate rotation
      const sliceAngle = 360 / prizes.length;
      const targetAngle = prizeIndex * sliceAngle;
      const spins = 5; // Number of full rotations
      const newRotation = rotation + (360 * spins) + (360 - targetAngle - sliceAngle / 2);
      
      setRotation(newRotation);
      
      // Wait for animation
      setTimeout(() => {
        setIsSpinning(false);
        setResult({ prize: prizes[prizeIndex], code });
      }, 4000);
    } catch (error) {
      setIsSpinning(false);
    }
  };

  const sliceAngle = 360 / prizes.length;

  return (
    <div className="flex flex-col items-center">
      {/* Wheel Container */}
      <div className="relative w-80 h-80 mb-8">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
          <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-pink-500 drop-shadow-lg" />
        </div>

        {/* Wheel */}
        <div
          ref={wheelRef}
          className="w-full h-full rounded-full shadow-2xl transition-transform duration-[4000ms] ease-out"
          style={{
            transform: `rotate(${rotation}deg)`,
            background: `conic-gradient(${prizes
              .map((prize, i) => `${prize.color} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`)
              .join(', ')})`,
          }}
        >
          {prizes.map((prize, i) => {
            const angle = i * sliceAngle + sliceAngle / 2;
            const radians = (angle - 90) * (Math.PI / 180);
            const x = 50 + 35 * Math.cos(radians);
            const y = 50 + 35 * Math.sin(radians);
            
            return (
              <div
                key={prize.id}
                className="absolute text-center pointer-events-none"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                }}
              >
                <span className="text-2xl">{prize.icon}</span>
                <span className="block text-xs font-bold text-white drop-shadow mt-1">
                  {prize.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Center Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning || spinsRemaining <= 0}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-indigo-500 text-white font-bold shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all z-10"
        >
          {isSpinning ? '🎲' : 'SPIN'}
        </button>
      </div>

      {/* Spins Remaining */}
      <div className="text-center mb-4">
        <span className="text-gray-600">Spins remaining: </span>
        <span className="font-bold text-pink-500">{spinsRemaining}</span>
      </div>

      {/* Result Modal */}
      {result && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-sm mx-4 text-center transform animate-bounceIn">
            <div className="text-6xl mb-4">{result.prize.icon}</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {result.prize.type === 'nothing' ? 'Better luck next time!' : 'Congratulations! 🎉'}
            </h3>
            <p className="text-lg text-gray-600 mb-4">
              {result.prize.type === 'discount' && `You won ${result.prize.value}% OFF!`}
              {result.prize.type === 'points' && `You won ${result.prize.value} Points!`}
              {result.prize.type === 'cashback' && `You won $${result.prize.value} Cashback!`}
              {result.prize.type === 'free_shipping' && 'You won FREE Shipping!'}
              {result.prize.type === 'nothing' && 'Spin again tomorrow!'}
            </p>
            {result.code && (
              <div className="bg-gray-100 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-500 mb-1">Your code:</p>
                <p className="text-xl font-mono font-bold text-pink-500">{result.code}</p>
              </div>
            )}
            <button
              onClick={() => setResult(null)}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpinWheel;
