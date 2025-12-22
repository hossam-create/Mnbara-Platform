export default function OpsTower() {
  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-black text-white">LOGISTICS OPS</h1>
                <p className="text-sm text-purple-500 font-mono">GLOBAL SHIPMENT TRACKING & INTERCEPT</p>
            </div>
        </div>

        {/* The Live Map */}
        <div className="h-[500px] bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] opacity-30 bg-cover bg-center grayscale invert"></div>
             
             {/* Overlay UI */}
             <div className="absolute top-4 left-4 bg-black/80 backdrop-blur border border-purple-500/30 p-4 rounded-lg">
                 <h3 className="text-purple-400 text-xs font-bold uppercase mb-2">Active Regions</h3>
                 <ul className="space-y-1 text-[10px] font-mono text-slate-400">
                     <li className="flex justify-between w-32"><span>🇺🇸 USA</span> <span className="text-white">412</span></li>
                     <li className="flex justify-between w-32"><span>🇦🇪 UAE</span> <span className="text-white">289</span></li>
                     <li className="flex justify-between w-32"><span>🇬🇧 UK</span> <span className="text-white">154</span></li>
                     <li className="flex justify-between w-32"><span>🇸🇦 KSA</span> <span className="text-white">98</span></li>
                 </ul>
             </div>

             {/* Mock Flights */}
             <div className="absolute top-[40%] left-[20%] w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7] animate-pulse"></div>
             <div className="absolute top-[45%] left-[23%] text-[9px] text-purple-300 font-mono">FL-992</div>

             <div className="absolute top-[35%] right-[30%] w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7] animate-pulse"></div>
        </div>
    </div>
  );
}
