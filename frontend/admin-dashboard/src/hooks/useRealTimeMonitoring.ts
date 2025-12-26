import { useState, useEffect, useCallback } from 'react';

interface MonitoringData {
  performance: Array<{
    time: string;
    value: number;
    category: string;
  }>;
  traffic: Array<{
    time: string;
    requests: number;
    errors: number;
  }>;
  resources: Array<{
    time: string;
    cpu: number;
    memory: number;
    disk: number;
  }>;
  alerts: Array<{
    id: string;
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: string;
    service: string;
  }>;
}

interface UseRealTimeMonitoringReturn {
  monitoringData: MonitoringData | null;
  alerts: any[];
  addAlert: (alert: any) => void;
  clearAlerts: () => void;
  isConnected: boolean;
}

export const useRealTimeMonitoring = (): UseRealTimeMonitoringReturn => {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Generate mock monitoring data
  const generateMockData = useCallback(() => {
    const now = new Date();
    const performanceData = [];
    const trafficData = [];
    const resourcesData = [];

    // Generate last 60 data points (1 minute interval)
    for (let i = 59; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000);
      const timeStr = time.toLocaleTimeString();

      performanceData.push({
        time: timeStr,
        value: Math.random() * 100 + 50,
        category: 'response_time'
      });

      trafficData.push({
        time: timeStr,
        requests: Math.floor(Math.random() * 2000 + 1000),
        errors: Math.floor(Math.random() * 50)
      });

      resourcesData.push({
        time: timeStr,
        cpu: Math.random() * 80 + 10,
        memory: Math.random() * 70 + 20,
        disk: Math.random() * 60 + 30
      });
    }

    const mockAlerts = [
      {
        id: '1',
        type: 'performance',
        message: 'High latency detected in payment service',
        severity: 'medium',
        timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
        service: 'payment-service'
      },
      {
        id: '2',
        type: 'error',
        message: 'Database connection pool exhausted',
        severity: 'high',
        timestamp: new Date(now.getTime() - 15 * 60000).toISOString(),
        service: 'auth-service'
      },
      {
        id: '3',
        type: 'resource',
        message: 'Memory usage above 80%',
        severity: 'medium',
        timestamp: new Date(now.getTime() - 25 * 60000).toISOString(),
        service: 'auction-service'
      }
    ];

    return {
      performance: performanceData,
      traffic: trafficData,
      resources: resourcesData,
      alerts: mockAlerts
    };
  }, []);

  // Initialize data
  useEffect(() => {
    const data = generateMockData();
    setMonitoringData(data);
    setAlerts(data.alerts);
    setIsConnected(true);
  }, [generateMockData]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMonitoringData(prev => {
        if (!prev) return null;

        const now = new Date();
        const timeStr = now.toLocaleTimeString();

        return {
          performance: [
            ...prev.performance.slice(1),
            {
              time: timeStr,
              value: Math.random() * 100 + 50,
              category: 'response_time'
            }
          ],
          traffic: [
            ...prev.traffic.slice(1),
            {
              time: timeStr,
              requests: Math.floor(Math.random() * 2000 + 1000),
              errors: Math.floor(Math.random() * 50)
            }
          ],
          resources: [
            ...prev.resources.slice(1),
            {
              time: timeStr,
              cpu: Math.random() * 80 + 10,
              memory: Math.random() * 70 + 20,
              disk: Math.random() * 60 + 30
            }
          ],
          alerts: prev.alerts
        };
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const addAlert = useCallback((alert: any) => {
    setAlerts(prev => [alert, ...prev.slice(0, 99)]); // Keep only last 100 alerts
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    monitoringData,
    alerts,
    addAlert,
    clearAlerts,
    isConnected
  };
};
