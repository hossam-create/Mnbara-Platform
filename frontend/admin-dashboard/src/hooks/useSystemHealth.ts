import { useState, useEffect, useCallback } from 'react';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  threshold: number;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  overallHealth: number;
  lastCheck: string;
  services: {
    [key: string]: {
      status: 'healthy' | 'warning' | 'critical';
      responseTime: number;
      uptime: number;
      errorRate: number;
    };
  };
}

interface UseSystemHealthReturn {
  systemMetrics: SystemMetric[];
  systemHealth: SystemHealth | null;
  refreshHealth: () => Promise<void>;
  isRefreshing: boolean;
  error: string | null;
}

export const useSystemHealth = (): UseSystemHealthReturn => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock system metrics data
  useEffect(() => {
    const mockMetrics: SystemMetric[] = [
      {
        id: 'cpu',
        name: 'CPU Usage',
        value: 45,
        unit: '%',
        status: 'healthy',
        trend: 'stable',
        threshold: 80
      },
      {
        id: 'memory',
        name: 'Memory Usage',
        value: 68,
        unit: '%',
        status: 'healthy',
        trend: 'up',
        threshold: 85
      },
      {
        id: 'disk',
        name: 'Disk Usage',
        value: 72,
        unit: '%',
        status: 'warning',
        trend: 'up',
        threshold: 90
      },
      {
        id: 'network',
        name: 'Network I/O',
        value: 125,
        unit: 'Mbps',
        status: 'healthy',
        trend: 'stable',
        threshold: 1000
      },
      {
        id: 'response_time',
        name: 'Avg Response Time',
        value: 145,
        unit: 'ms',
        status: 'healthy',
        trend: 'down',
        threshold: 500
      },
      {
        id: 'error_rate',
        name: 'Error Rate',
        value: 0.8,
        unit: '%',
        status: 'healthy',
        trend: 'down',
        threshold: 5
      },
      {
        id: 'throughput',
        name: 'Request Throughput',
        value: 1250,
        unit: 'req/s',
        status: 'healthy',
        trend: 'up',
        threshold: 5000
      },
      {
        id: 'database',
        name: 'Database Connections',
        value: 45,
        unit: 'connections',
        status: 'healthy',
        trend: 'stable',
        threshold: 100
      },
      {
        id: 'cache_hit_rate',
        name: 'Cache Hit Rate',
        value: 94,
        unit: '%',
        status: 'healthy',
        trend: 'stable',
        threshold: 80
      },
      {
        id: 'queue_depth',
        name: 'Message Queue Depth',
        value: 12,
        unit: 'messages',
        status: 'healthy',
        trend: 'down',
        threshold: 100
      }
    ];

    const mockHealth: SystemHealth = {
      status: 'healthy',
      overallHealth: 95,
      lastCheck: new Date().toISOString(),
      services: {
        'auth-service': {
          status: 'healthy',
          responseTime: 120,
          uptime: 99.9,
          errorRate: 0.2
        },
        'payment-service': {
          status: 'warning',
          responseTime: 280,
          uptime: 99.5,
          errorRate: 1.2
        },
        'auction-service': {
          status: 'healthy',
          responseTime: 95,
          uptime: 99.8,
          errorRate: 0.3
        },
        'listing-service': {
          status: 'critical',
          responseTime: 850,
          uptime: 95.2,
          errorRate: 8.5
        },
        'notification-service': {
          status: 'healthy',
          responseTime: 110,
          uptime: 99.7,
          errorRate: 0.5
        },
        'ai-core': {
          status: 'healthy',
          responseTime: 200,
          uptime: 99.9,
          errorRate: 0.1
        }
      }
    };

    setSystemMetrics(mockMetrics);
    setSystemHealth(mockHealth);
  }, []);

  const refreshHealth = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      // Simulate API call to refresh system health
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update metrics with slight variations to simulate real-time changes
      setSystemMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + (Math.random() - 0.5) * 10, // Random variation
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
        status: metric.value > metric.threshold * 0.9 ? 'critical' : 
                metric.value > metric.threshold * 0.7 ? 'warning' : 'healthy'
      })));

      // Update system health
      setSystemHealth(prev => prev ? {
        ...prev,
        overallHealth: Math.max(0, Math.min(100, prev.overallHealth + (Math.random() - 0.5) * 5)),
        lastCheck: new Date().toISOString(),
        services: Object.entries(prev.services).reduce((acc, [key, service]) => ({
          ...acc,
          [key]: {
            ...service,
            responseTime: Math.max(50, service.responseTime + (Math.random() - 0.5) * 50),
            errorRate: Math.max(0, service.errorRate + (Math.random() - 0.5) * 0.5),
            status: service.errorRate > 5 ? 'critical' : 
                    service.errorRate > 2 ? 'warning' : 'healthy'
          }
        }), {})
      } : null);

    } catch (err) {
      setError('Failed to refresh system health');
      console.error('System health refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshHealth]);

  return {
    systemMetrics,
    systemHealth,
    refreshHealth,
    isRefreshing,
    error
  };
};
