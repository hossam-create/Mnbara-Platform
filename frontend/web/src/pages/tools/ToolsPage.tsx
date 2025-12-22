// ============================================
// 🧮 Shipping & Pricing Tools
// ============================================

import ShippingCalculator from '../../components/calculator/ShippingCalculator';

export function ToolsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <header className="bg-white border-b py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900">🛠️ Merchant Tools</h1>
          <p className="text-gray-500 mt-2">Essential utilities for buyers, sellers, and travelers.</p>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2">
             <ShippingCalculator />
           </div>
           
           <div className="space-y-6">
             <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-6 text-white">
               <h3 className="text-xl font-bold mb-2">Need Professional Help?</h3>
               <p className="text-indigo-200 mb-4">Our FBM (Fulfillment by Mnbara) team can handle everything for you.</p>
               <button className="w-full bg-white text-indigo-900 py-2 rounded-lg font-bold">
                 Contact FBM Support
               </button>
             </div>
             
             <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
               <h3 className="font-bold mb-4">Currency Converter</h3>
               <div className="space-y-4">
                 <div className="flex gap-2">
                   <input type="number" className="w-full p-2 border rounded-lg" placeholder="100" />
                   <select className="p-2 border rounded-lg bg-gray-50">
                     <option>USD</option>
                     <option>EUR</option>
                   </select>
                 </div>
                 <div className="text-center text-gray-400">⬇️</div>
                 <div className="flex gap-2">
                   <input type="number" className="w-full p-2 border rounded-lg" placeholder="375" disabled />
                   <select className="p-2 border rounded-lg bg-gray-50">
                     <option>SAR</option>
                     <option>AED</option>
                   </select>
                 </div>
               </div>
             </div>
           </div>
        </div>
      </main>
    </div>
  );
}

export default ToolsPage;
