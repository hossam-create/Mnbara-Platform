import { useState } from 'react';

export default function CustomerServiceTower() {
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'DISPUTES' | 'LIVE_CHAT'>('TICKETS');

  const tickets = [
    { id: 'TKT-9921', user: 'Ahmed Ali', issue: 'Payment Failed', priority: 'HIGH', status: 'OPEN' },
    { id: 'TKT-9922', user: 'Sarah Smith', issue: 'Where is my order?', priority: 'LOW', status: 'PENDING' },
    { id: 'TKT-9923', user: 'John Doe', issue: 'Traveler did not respond', priority: 'CRITICAL', status: 'OPEN' },
  ];

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-black text-white">FRONT OFFICE</h1>
                <p className="text-sm text-cyan-500 font-mono">CUSTOMER HAPPINESS & RETENTION DIVISION</p>
            </div>
            <div className="flex gap-2">
                {['TICKETS', 'DISPUTES', 'LIVE_CHAT'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 rounded text-xs font-bold transition-all ${activeTab === tab ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        {tab.replace('_', ' ')}
                    </button>
                ))}
            </div>
        </div>

        {/* Content Area */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950 text-slate-500 font-mono uppercase text-xs">
                    <tr>
                        <th className="p-4">ID</th>
                        <th className="p-4">User</th>
                        <th className="p-4">Issue</th>
                        <th className="p-4">Priority</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {tickets.map(t => (
                        <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                            <td className="p-4 font-mono text-cyan-400">{t.id}</td>
                            <td className="p-4 text-white font-bold">{t.user}</td>
                            <td className="p-4">{t.issue}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                    t.priority === 'CRITICAL' ? 'bg-red-900/50 text-red-500 border border-red-900' :
                                    t.priority === 'HIGH' ? 'bg-orange-900/50 text-orange-500' :
                                    'bg-green-900/50 text-green-500'
                                }`}>
                                    {t.priority}
                                </span>
                            </td>
                            <td className="p-4">{t.status}</td>
                            <td className="p-4">
                                <button className="text-cyan-500 hover:text-white underline decoration-cyan-500/30">View</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}
