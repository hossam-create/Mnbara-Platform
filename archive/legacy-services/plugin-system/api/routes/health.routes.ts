import { Router, Request, Response } from 'express';
import { PluginHealthMonitor } from '../monitoring/PluginHealthMonitor';
import { authenticateToken, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Health monitoring instance (will be injected)
let healthMonitor: PluginHealthMonitor;

export const setHealthMonitor = (monitor: PluginHealthMonitor) => {
  healthMonitor = monitor;
};

// Middleware to check if health monitor is available
const requireHealthMonitor = (req: Request, res: Response, next: any) => {
  if (!healthMonitor) {
    return res.status(503).json({
      success: false,
      error: 'Health monitoring not available',
    });
  }
  next();
};

// Get system health overview
router.get('/health', authenticateToken, requireHealthMonitor, (req: Request, res: Response) => {
  try {
    const systemHealth = healthMonitor.getSystemHealth();
    const allPluginsHealth = healthMonitor.getAllPluginsHealth();

    res.json({
      success: true,
      data: {
        systemHealth,
        plugins: allPluginsHealth,
      },
    });
  } catch (error) {
    logger.error('Error getting system health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system health',
    });
  }
});

// Get specific plugin health
router.get('/health/:pluginName', authenticateToken, requireHealthMonitor, (req: Request, res: Response) => {
  try {
    const { pluginName } = req.params;
    const pluginHealth = healthMonitor.getPluginHealth(pluginName);

    if (!pluginHealth) {
      return res.status(404).json({
        success: false,
        error: 'Plugin health data not found',
      });
    }

    res.json({
      success: true,
      data: pluginHealth,
    });
  } catch (error) {
    logger.error('Error getting plugin health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get plugin health',
    });
  }
});

// Get plugin health history
router.get('/health/:pluginName/history', authenticateToken, requireHealthMonitor, (req: Request, res: Response) => {
  try {
    const { pluginName } = req.params;
    const { timeRange } = req.query; // in milliseconds

    const timeRangeMs = timeRange ? parseInt(timeRange as string) : undefined;
    const history = healthMonitor.getPluginHealthHistory(pluginName, timeRangeMs);

    if (!history || history.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Plugin health history not found',
      });
    }

    res.json({
      success: true,
      data: {
        pluginName,
        history,
        timeRange: timeRangeMs,
      },
    });
  } catch (error) {
    logger.error('Error getting plugin health history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get plugin health history',
    });
  }
});

// Reset plugin health
router.post('/health/:pluginName/reset', authenticateToken, requireRole(['admin']), requireHealthMonitor, (req: Request, res: Response) => {
  try {
    const { pluginName } = req.params;
    
    healthMonitor.resetPluginHealth(pluginName);

    logger.info(`Plugin health reset by admin: ${pluginName}`, { userId: (req as any).user?.id });

    res.json({
      success: true,
      message: 'Plugin health reset successfully',
    });
  } catch (error) {
    logger.error('Error resetting plugin health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset plugin health',
    });
  }
});

// Generate health report
router.get('/health-report', authenticateToken, requireRole(['admin']), requireHealthMonitor, (req: Request, res: Response) => {
  try {
    const report = healthMonitor.generateHealthReport();

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', 'attachment; filename="plugin-health-report.md"');
    res.send(report);
  } catch (error) {
    logger.error('Error generating health report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate health report',
    });
  }
});

// Get health alerts
router.get('/health-alerts', authenticateToken, requireRole(['admin']), requireHealthMonitor, (req: Request, res: Response) => {
  try {
    const allPluginsHealth = healthMonitor.getAllPluginsHealth();
    const alerts = [];

    for (const pluginHealth of allPluginsHealth) {
      if (pluginHealth.status !== 'healthy') {
        alerts.push({
          pluginName: pluginHealth.pluginName,
          status: pluginHealth.status,
          errorCount: pluginHealth.errorCount,
          lastError: pluginHealth.lastError,
          lastHeartbeat: pluginHealth.lastHeartbeat,
        });
      }
    }

    res.json({
      success: true,
      data: {
        alerts,
        totalAlerts: alerts.length,
      },
    });
  } catch (error) {
    logger.error('Error getting health alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get health alerts',
    });
  }
});

// WebSocket endpoint for real-time health updates (simplified for now)
// router.ws('/health-stream', authenticateToken, requireHealthMonitor, (ws, req) => {
//   logger.info('WebSocket health stream connected');
//   // WebSocket implementation will be added later
// });

// Dashboard endpoints

// Get system metrics for dashboard
router.get('/dashboard/metrics', authenticateToken, requireRole(['admin']), requireHealthMonitor, (req: Request, res: Response) => {
  try {
    const systemHealth = healthMonitor.getSystemHealth();
    const allPluginsHealth = healthMonitor.getAllPluginsHealth();

    // Calculate metrics
    const totalPlugins = allPluginsHealth.length;
    const healthyPlugins = allPluginsHealth.filter(p => p.status === 'healthy').length;
    const degradedPlugins = allPluginsHealth.filter(p => p.status === 'degraded').length;
    const unhealthyPlugins = allPluginsHealth.filter(p => p.status === 'unhealthy').length;
    const unknownPlugins = allPluginsHealth.filter(p => p.status === 'unknown').length;

    const totalErrors = allPluginsHealth.reduce((sum, p) => sum + p.errorCount, 0);
    const averageResponseTime = systemHealth.avgResponseTime;
    const uptimePercentage = systemHealth.overallStatus === 'healthy' ? 99.9 : 
                             systemHealth.overallStatus === 'degraded' ? 95.0 : 90.0;
    const memoryUsage = process.memoryUsage();

    res.json({
      success: true,
      data: {
        system: {
          uptimePercentage,
          totalErrors,
          averageResponseTime,
          memoryUsage,
        },
        plugins: {
          total: totalPlugins,
          healthy: healthyPlugins,
          degraded: degradedPlugins,
          unhealthy: unhealthyPlugins,
          unknown: unknownPlugins,
          healthPercentage: totalPlugins > 0 ? (healthyPlugins / totalPlugins) * 100 : 0,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error getting dashboard metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard metrics',
    });
  }
});

// Get performance trends over time
router.get('/dashboard/trends', authenticateToken, requireRole(['admin']), requireHealthMonitor, (req: Request, res: Response) => {
  try {
    const { pluginName, hours = 24 } = req.query;
    const history = healthMonitor.getPluginHealthHistory(pluginName as string, Number(hours));

    if (!history || history.length === 0) {
      return res.json({
        success: true,
        data: {
          errorTrend: [],
          responseTimeTrend: [],
          healthScoreTrend: [],
          timestamp: new Date().toISOString(),
        },
      });
    }

    const trends = {
      errorTrend: history.map(h => ({ timestamp: new Date().toISOString(), errors: h.errorCount })),
      responseTimeTrend: history.map(h => ({ timestamp: new Date().toISOString(), responseTime: 100 })),
      healthScoreTrend: history.map(h => ({ timestamp: new Date().toISOString(), healthScore: h.status === 'healthy' ? 95 : h.status === 'degraded' ? 75 : 50 })),
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    logger.error('Error getting performance trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance trends',
    });
  }
});

// Get top issues and recommendations
router.get('/dashboard/issues', authenticateToken, requireRole(['admin']), requireHealthMonitor, (req: Request, res: Response) => {
  try {
    const allPluginsHealth = healthMonitor.getAllPluginsHealth();
    const issues = [];
    const recommendations = [];

    for (const pluginHealth of allPluginsHealth) {
      // Check for issues
      if (pluginHealth.status === 'unhealthy') {
        issues.push({
          type: 'unhealthy',
          pluginName: pluginHealth.pluginName,
          description: 'Plugin is in unhealthy state',
          severity: 'high',
          timestamp: pluginHealth.lastError || new Date().toISOString(),
        });
      }

      if (pluginHealth.status === 'unknown') {
        issues.push({
          type: 'unknown',
          pluginName: pluginHealth.pluginName,
          description: 'Plugin status is unknown or not responding',
          severity: 'high',
          timestamp: pluginHealth.lastHeartbeat || new Date().toISOString(),
        });
      }

      if (pluginHealth.errorCount > 10) {
        issues.push({
          type: 'high_error_rate',
          pluginName: pluginHealth.pluginName,
          description: `High error rate: ${pluginHealth.errorCount} errors`,
          severity: 'medium',
          timestamp: pluginHealth.lastError || new Date().toISOString(),
        });
      }

      if (pluginHealth.status === 'degraded') {
        issues.push({
          type: 'degraded',
          pluginName: pluginHealth.pluginName,
          description: 'Plugin performance is degraded',
          severity: 'medium',
          timestamp: new Date().toISOString(),
        });
      }

      // Generate recommendations
      if (pluginHealth.status === 'degraded') {
        recommendations.push({
          pluginName: pluginHealth.pluginName,
          recommendation: 'Monitor plugin closely and check logs for issues',
          priority: 'medium',
        });
      }

      if (pluginHealth.errorCount > 5) {
        recommendations.push({
          pluginName: pluginHealth.pluginName,
          recommendation: 'Review plugin configuration and dependencies',
          priority: 'medium',
        });
      }
    }

    res.json({
      success: true,
      data: {
        issues: issues.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        recommendations: recommendations.sort((a, b) => a.priority.localeCompare(b.priority)),
        totalIssues: issues.length,
        totalRecommendations: recommendations.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error getting issues and recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get issues and recommendations',
    });
  }
});

// Export router and health monitor setter
export default router;