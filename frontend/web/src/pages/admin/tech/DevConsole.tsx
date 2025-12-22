export default function DevConsole() {
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-black text-white">TECH DIVISION</h1>
            <p className="text-sm text-cyan-500 font-mono">SYSTEM INTERNALS & DEBUGGING</p>
        </div>

        <div className="bg-black border border-slate-800 rounded-xl p-4 font-mono text-xs h-96 overflow-y-auto">
            <div className="text-green-500 mb-2">root@mnbara-fortress:~$ tail -f /var/log/syslog</div>
            <div className="space-y-1 text-slate-500">
                <p>[2025-10-12 14:00:01] <span className="text-cyan-500">INFO</span> Service 'PaymentGateway' heartbeat received. Latency: 4ms.</p>
                <p>[2025-10-12 14:00:02] <span className="text-cyan-500">INFO</span> New User Registration (ID: 9912).</p>
                <p>[2025-10-12 14:00:05] <span className="text-yellow-500">WARN</span> Image optimization took 400ms (Threshold: 200ms).</p>
                <p>[2025-10-12 14:00:12] <span className="text-cyan-500">INFO</span> WebSocket connection established for user 8821.</p>
                <p>[2025-10-12 14:00:15] <span className="text-green-500">SUCCESS</span> Deployment v2.4.1 verified on Cluster A.</p>
            </div>
        </div>
    </div>
  );
}
