import { useState, useEffect } from 'react';

interface HealthResponse {
  status: string;
  service: string;
}

export default function RuntimeCheckPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:4000/health');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Connection failed');
        setHealth(null);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>
        🔧 Runtime Check
      </h1>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Backend Health Check</h2>
        <p style={{ color: '#666' }}>Calling: http://localhost:4000/health</p>
        
        {loading && (
          <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
            ⏳ Loading...
          </div>
        )}
        
        {error && (
          <div style={{ padding: '20px', background: '#ffe0e0', borderRadius: '8px', color: '#c00' }}>
            ❌ Error: {error}
          </div>
        )}
        
        {health && (
          <div style={{ padding: '20px', background: '#e0ffe0', borderRadius: '8px' }}>
            <p>✅ Connection successful!</p>
            <pre style={{ background: '#fff', padding: '15px', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(health, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '30px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <strong>Status:</strong>{' '}
        {health ? (
          <span style={{ color: 'green' }}>END-TO-END WORKING ✅</span>
        ) : error ? (
          <span style={{ color: 'red' }}>BROKEN ❌</span>
        ) : (
          <span>Checking...</span>
        )}
      </div>
    </div>
  );
}
