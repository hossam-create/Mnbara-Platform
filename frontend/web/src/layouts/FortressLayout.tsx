import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import ArachnidAI from '../components/admin/ArachnidAI';
import Intercom from '../components/admin/Intercom';
import { useSecurity } from '../context/SecurityContext';
import { CommsProvider } from '../context/CommsContext';

export default function FortressLayout() {
  const { role, isAuthenticated, login, logout, threatLevel } = useSecurity();
  const location = useLocation();

  if (!isAuthenticated) {
      return (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center font-mono">
              <div className="max-w-md w-full p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-600"></div>
                  <h1 className="text-3xl text-white font-black mb-2 tracking-tighter">MNBARA <span className="text-cyan-500">FORTRESS</span></h1>
                  <p className="text-slate-500 mb-8 text-sm">RESTRICTED ACCESS. AUTHORIZED PERSONNEL ONLY.</p>
                  
                  <div className="space-y-3">
                      <button onClick={() => login('SUPER_ADMIN')} className="w-full py-3 bg-cyan-900/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all rounded font-bold text-sm">
                          LOGIN AS SUPER ADMIN (Bio-Auth)
                      </button>
                      <button onClick={() => login('CS_AGENT')} className="w-full py-3 bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 transition-all rounded font-bold text-sm">
                          LOGIN AS SUPPORT
                      </button>
                  </div>
                  <div className="mt-8 text-center text-[10px] text-slate-600">
                      SECURED BY IRON VAULT PROTOCOL v2.4
                  </div>
              </div>
          </div>
      );
  }

  return (
    <CommsProvider>
      <div className={`min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 ${threatLevel === 'CRITICAL' ? 'grayscale contrast-125' : ''}`}>
          
          {/* The Arachnid (Always Watching) */}
          <ArachnidAI />
          
          {/* The Intercom (Neural Network) */}
          <Intercom />

          <div className="flex h-screen overflow-hidden">
              {/* Sidebar */}
              <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
                  <div className="p-6">
                      <h2 className="text-xl font-black text-white tracking-tight">FORTRESS</h2>
                      <p className="text-xs text-cyan-500 font-mono mt-1">{role} // LEVEL 5</p>
                  </div>
                  
                  <nav className="flex-1 px-4 space-y-1">
                      {[
                          { name: 'Command Center', path: '/fortress', icon: '🏰' },
                          { name: 'Trust & Safety', path: '/fortress/cs', icon: '👮' },
                          { name: 'Finance Tower', path: '/fortress/finance', icon: '🏦' },
                          { name: 'Logistics Ops', path: '/fortress/ops', icon: '✈️' },
                          { name: 'Tech Division', path: '/fortress/dev', icon: '💻' },
                      ].map((item) => (
                          <Link 
                              key={item.path} 
                              to={item.path}
                              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.path ? 'bg-cyan-950 text-cyan-400 border border-cyan-900' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                          >
                              <span>{item.icon}</span>
                              {item.name}
                          </Link>
                      ))}
                  </nav>

                  <div className="p-4 border-t border-slate-800">
                      <button onClick={logout} className="w-full py-2 bg-red-900/20 text-red-500 border border-red-900/30 rounded text-xs font-bold hover:bg-red-900/40">
                          TERMINATE SESSION
                      </button>
                  </div>
              </aside>

              {/* Main Content */}
              <main className="flex-1 overflow-y-auto relative">
                  {/* Header */}
                  <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur">
                      <div className="flex items-center gap-4">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                          <span className="text-xs font-mono text-green-500">SYSTEM OPTIMAL</span>
                      </div>
                      <div className="flex items-center gap-4">
                          <div className="text-right">
                              <div className="text-xs font-bold text-white">Administrator</div>
                              <div className="text-[10px] text-slate-500">IP: 10.0.4.12 [SECURE]</div>
                          </div>
                          <div className="w-8 h-8 bg-slate-800 rounded border border-slate-700"></div>
                      </div>
                  </header>

                  <div className="p-8">
                      <Outlet />
                  </div>
              </main>
          </div>
      </div>
    </CommsProvider>
  );
}
