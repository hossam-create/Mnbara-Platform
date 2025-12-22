// ============================================
// 🧮 Shipping Calculator Component
// ============================================

import { useState, useMemo } from 'react';

type ShippingMethod = 'traveler' | 'fbm_standard' | 'fbm_express' | 'fbm_anonymous';

interface CalculatorResult {
  method: ShippingMethod;
  name: string;
  basePrice: number;
  volumetricWeight: number;
  chargeableWeight: number;
  fees: {
    handling: number;
    insurance: number;
    platform: number;
  };
  total: number;
  days: string;
  features: string[];
}

export function ShippingCalculator() {
  const [dimensions, setDimensions] = useState({ length: 20, width: 20, height: 10 }); // cm
  const [weight, setWeight] = useState(1); // kg
  const [value, setValue] = useState(100); // USD
  const [origin, setOrigin] = useState('EG');
  const [destination, setDestination] = useState('AE');
  const results = useMemo(() => {
    // Volumetric Weight (cm) / 5000
    const volWeight = (dimensions.length * dimensions.width * dimensions.height) / 5000;
    const chargeableWeight = Math.max(weight, volWeight);
    
    // 1. Traveler Shipping (Cheapest, P2P)
    // Base: $10 + $8/kg
    const travelerPrice = 10 + (chargeableWeight * 8);
    const travelerResult: CalculatorResult = {
      method: 'traveler',
      name: 'Mnbara Traveler',
      basePrice: travelerPrice,
      volumetricWeight: volWeight,
      chargeableWeight,
      fees: {
        handling: 2, // Platform fee
        insurance: value * 0.01, // 1% insurance
        platform: 3,
      },
      total: travelerPrice + 5 + (value * 0.01),
      days: '3-7 days',
      features: ['Peer-to-Peer', 'Flexible timing', 'Direct communication'],
    };

    // 2. FBM Standard (Fulfillment by Mnbara)
    // Base: $15 + $12/kg (Warehousing + Handling)
    const fbmStandardPrice = 15 + (chargeableWeight * 12);
    const fbmStandard: CalculatorResult = {
      method: 'fbm_standard',
      name: 'FBM Standard',
      basePrice: fbmStandardPrice,
      volumetricWeight: volWeight,
      chargeableWeight,
      fees: {
        handling: 5, // Pick & Pack
        insurance: value * 0.02, // 2% insurance
        platform: 5,
      },
      total: fbmStandardPrice + 10 + (value * 0.02),
      days: '5-10 days',
      features: ['Warehousing', 'Professional Packing', 'Consolidation'],
    };

    // 3. FBM Express
    const fbmExpressPrice = 25 + (chargeableWeight * 18);
    const fbmExpress: CalculatorResult = {
      method: 'fbm_express',
      name: 'FBM Express',
      basePrice: fbmExpressPrice,
      volumetricWeight: volWeight,
      chargeableWeight,
      fees: {
        handling: 8,
        insurance: value * 0.02,
        platform: 5,
      },
      total: fbmExpressPrice + 13 + (value * 0.02),
      days: '2-4 days',
      features: ['Priority Handling', 'Air Freight', 'Fastest'],
    };

    // 4. FBM Anonymous (Privacy Focused)
    const fbmAnonPrice = 30 + (chargeableWeight * 20);
    const fbmAnon: CalculatorResult = {
      method: 'fbm_anonymous',
      name: 'FBM Anonymous',
      basePrice: fbmAnonPrice,
      volumetricWeight: volWeight,
      chargeableWeight,
      fees: {
        handling: 10,
        insurance: value * 0.03,
        platform: 10, // Privacy fee
      },
      total: fbmAnonPrice + 20 + (value * 0.03),
      days: '3-5 days',
      features: ['Hidden Identity', 'Mnbara Relay', 'Max Privacy'],
    };

    return [travelerResult, fbmStandard, fbmExpress, fbmAnon];
  }, [dimensions, weight, value]);



  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🧮 Shipping Calculator</h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-pink-500"
              >
                <option value="EG">Egypt</option>
                <option value="AE">UAE</option>
                <option value="SA">Saudi Arabia</option>
                <option value="US">USA</option>
                <option value="UK">UK</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-pink-500"
              >
                <option value="AE">UAE</option>
                <option value="EG">Egypt</option>
                <option value="SA">Saudi Arabia</option>
                <option value="US">USA</option>
                <option value="UK">UK</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Package Dimensions (cm)</label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={dimensions.length}
                onChange={(e) => setDimensions({ ...dimensions, length: Number(e.target.value) })}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-pink-500"
                placeholder="L"
              />
              <input
                type="number"
                value={dimensions.width}
                onChange={(e) => setDimensions({ ...dimensions, width: Number(e.target.value) })}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-pink-500"
                placeholder="W"
              />
              <input
                type="number"
                value={dimensions.height}
                onChange={(e) => setDimensions({ ...dimensions, height: Number(e.target.value) })}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-pink-500"
                placeholder="H"
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Volumetric Weight: {((dimensions.length * dimensions.width * dimensions.height) / 5000).toFixed(2)} kg
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actual Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Value ($)</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Estimated Shipping Costs</h3>
          {results.map((result) => (
            <div
              key={result.method}
              className={`p-4 rounded-xl border-2 transition-all ${
                result.method === 'traveler' ? 'border-pink-500 bg-pink-50' : 'border-gray-100 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-gray-900">{result.name}</div>
                <div className="text-xl font-bold font-mono">${result.total.toFixed(2)}</div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <span>⏱️ {result.days}</span>
                <span>⚖️ Chargeable: {result.chargeableWeight.toFixed(1)} kg</span>
              </div>

              <div className="text-xs text-gray-500 grid grid-cols-2 gap-x-4 gap-y-1 bg-white/50 p-2 rounded-lg">
                <div className="flex justify-between">
                  <span>Base Rate:</span>
                  <span>${result.basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Handling:</span>
                  <span>${result.fees.handling.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Insurance:</span>
                  <span>${result.fees.insurance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee:</span>
                  <span>${result.fees.platform.toFixed(2)}</span>
                </div>
              </div>

              {result.method === 'traveler' && (
                <div className="mt-2 text-xs font-bold text-pink-600 flex items-center gap-1">
                  <span>⭐ Best Value</span>
                  <span>• Supports Travelers</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ShippingCalculator;
