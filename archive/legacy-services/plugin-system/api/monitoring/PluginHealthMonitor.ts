import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export interface PluginHealthMetrics {
  pluginName: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastHeartbeat: Date;
  errorCount: number;
  warningCount: number;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  hookExecutionCount: number;
  hookSuccessRate: number;
  apiRequestCount: number;
  apiSuccessRate: number;
  version: string;
  uptime: number;
  lastError?: string;
  lastWarning?: string;
}

export interface HealthCheckConfig {
  enabled: boolean;
  heartbeatInterval: number; // milliseconds
  metricsRetention: number; // milliseconds
  alertingThresholds: {
    maxErrorCount: number;
    maxResponseTime: number;
    minSuccessRate: number;
    maxMemoryUsage: number;
    maxCpuUsage: number;
  };
}

const defaultConfig: HealthCheckConfig = {
  enabled: true,
  heartbeatInterval: 30000, // 30 seconds
  metricsRetention: 86400000, // 24 hours
  alertingThresholds: {
    maxErrorCount: 10,
    maxResponseTime: 5000, // 5 seconds
    minSuccessRate: 0.95, // 95%
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    maxCpuUsage: 80, // 80%
  },
};

export class PluginHealthMonitor extends EventEmitter {
  private metrics: Map<string, PluginHealthMetrics> = new Map();
  private metricsHistory: Map<string, PluginHealthMetrics[]> = new Map();
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();
  private config: HealthCheckConfig;
  private monitoringStartTime: Date;

  constructor(config: Partial<HealthCheckConfig> = {}) {
    super();
    this.config = { ...defaultConfig, ...config };
    this.monitoringStartTime = new Date();
    
    if (this.config.enabled) {
      this.startMonitoring();
    }
  }

  private startMonitoring() {
    logger.info('Plugin health monitoring started');
    
    // Clean up old metrics periodically
    setInterval(() => {
      this.cleanupOldMetrics();
    }, this.config.metricsRetention / 2);
  }

  registerPlugin(pluginName: string, version: string) {
    const initialMetrics: PluginHealthMetrics = {
      pluginName,
      status: 'unknown',
      lastHeartbeat: new Date(),
      errorCount: 0,
      warningCount: 0,
      responseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      hookExecutionCount: 0,
      hookSuccessRate: 1,
      apiRequestCount: 0,
      apiSuccessRate: 1,
      version,
      uptime: 0,
    };

    this.metrics.set(pluginName, initialMetrics);
    this.metricsHistory.set(pluginName, [initialMetrics]);

    // Start heartbeat monitoring
    this.startHeartbeatMonitoring(pluginName);

    logger.info(`Plugin registered for health monitoring: ${pluginName}`);
  }

  unregisterPlugin(pluginName: string) {
    this.metrics.delete(pluginName);
    this.metricsHistory.delete(pluginName);
    
    // Clear heartbeat timer
    const timer = this.heartbeatTimers.get(pluginName);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(pluginName);
    }

    logger.info(`Plugin unregistered from health monitoring: ${pluginName}`);
  }

  private startHeartbeatMonitoring(pluginName: string) {
    const timer = setInterval(() => {
      this.checkPluginHealth(pluginName);
    }, this.config.heartbeatInterval);

    this.heartbeatTimers.set(pluginName, timer);
  }

  private checkPluginHealth(pluginName: string) {
    const metrics = this.metrics.get(pluginName);
    if (!metrics) return;

    const now = new Date();
    const timeSinceLastHeartbeat = now.getTime() - metrics.lastHeartbeat.getTime();

    // Update status based on heartbeat
    if (timeSinceLastHeartbeat > this.config.heartbeatInterval * 2) {
      metrics.status = 'unhealthy';
      this.emit('plugin:unhealthy', pluginName, metrics);
      logger.warn(`Plugin ${pluginName} is unhealthy - no heartbeat for ${timeSinceLastHeartbeat}ms`);
    } else if (timeSinceLastHeartbeat > this.config.heartbeatInterval * 1.5) {
      metrics.status = 'degraded';
      this.emit('plugin:degraded', pluginName, metrics);
      logger.warn(`Plugin ${pluginName} is degraded - delayed heartbeat`);
    } else {
      metrics.status = 'healthy';
    }

    // Update uptime
    metrics.uptime = now.getTime() - this.monitoringStartTime.getTime();

    // Store metrics in history
    this.storeMetrics(pluginName, metrics);
  }

  recordHeartbeat(pluginName: string) {
    const metrics = this.metrics.get(pluginName);
    if (!metrics) {
      logger.warn(`Heartbeat received for unregistered plugin: ${pluginName}`);
      return;
    }

    metrics.lastHeartbeat = new Date();
    
    // Update status if it was unknown
    if (metrics.status === 'unknown') {
      metrics.status = 'healthy';
    }

    logger.debug(`Heartbeat recorded for plugin: ${pluginName}`);
  }

  recordHookExecution(pluginName: string, hookName: string, success: boolean, executionTime: number) {
    const metrics = this.metrics.get(pluginName);
    if (!metrics) return;

    metrics.hookExecutionCount++;
    
    if (success) {
      // Update success rate
      const totalExecutions = metrics.hookExecutionCount;
      const successfulExecutions = Math.floor(metrics.hookSuccessRate * (totalExecutions - 1)) + 1;
      metrics.hookSuccessRate = successfulExecutions / totalExecutions;
    } else {
      metrics.errorCount++;
      this.checkErrorThreshold(pluginName);
    }

    // Update response time
    metrics.responseTime = executionTime;

    logger.debug(`Hook execution recorded for plugin ${pluginName}: ${hookName} (${success ? 'success' : 'failure'})`);
  }

  recordApiRequest(pluginName: string, success: boolean, responseTime: number) {
    const metrics = this.metrics.get(pluginName);
    if (!metrics) return;

    metrics.apiRequestCount++;
    
    if (success) {
      // Update success rate
      const totalRequests = metrics.apiRequestCount;
      const successfulRequests = Math.floor(metrics.apiSuccessRate * (totalRequests - 1)) + 1;
      metrics.apiSuccessRate = successfulRequests / totalRequests;
    } else {
      metrics.errorCount++;
      this.checkErrorThreshold(pluginName);
    }

    // Update response time
    metrics.responseTime = Math.max(metrics.responseTime, responseTime);

    logger.debug(`API request recorded for plugin ${pluginName}: ${success ? 'success' : 'failure'}`);
  }

  recordError(pluginName: string, error: string, severity: 'error' | 'warning' = 'error') {
    const metrics = this.metrics.get(pluginName);
    if (!metrics) return;

    if (severity === 'error') {
      metrics.errorCount++;
      metrics.lastError = error;
      this.checkErrorThreshold(pluginName);
    } else {
      metrics.warningCount++;
      metrics.lastWarning = error;
    }

    logger.error(`Plugin ${pluginName} recorded ${severity}: ${error}`);
  }

  recordResourceUsage(pluginName: string, memoryUsage: number, cpuUsage: number) {
    const metrics = this.metrics.get(pluginName);
    if (!metrics) return;

    metrics.memoryUsage = memoryUsage;
    metrics.cpuUsage = cpuUsage;

    // Check resource thresholds
    this.checkResourceThresholds(pluginName);

    logger.debug(`Resource usage recorded for plugin ${pluginName}: Memory: ${memoryUsage} bytes, CPU: ${cpuUsage}%`);
  }

  private checkErrorThreshold(pluginName: string) {
    const metrics = this.metrics.get(pluginName);
    if (!metrics) return;

    if (metrics.errorCount > this.config.alertingThresholds.maxErrorCount) {
      this.emit('plugin:error-threshold-exceeded', pluginName, metrics);
      logger.warn(`Plugin ${pluginName} exceeded error threshold: ${metrics.errorCount} errors`);
    }
  }

  private checkResourceThresholds(pluginName: string) {
    const metrics = this.metrics.get(pluginName);
    if (!metrics) return;

    if (metrics.memoryUsage > this.config.alertingThresholds.maxMemoryUsage) {
      this.emit('plugin:memory-threshold-exceeded', pluginName, metrics);
      logger.warn(`Plugin ${pluginName} exceeded memory threshold: ${metrics.memoryUsage} bytes`);
    }

    if (metrics.cpuUsage > this.config.alertingThresholds.maxCpuUsage) {
      this.emit('plugin:cpu-threshold-exceeded', pluginName, metrics);
      logger.warn(`Plugin ${pluginName} exceeded CPU threshold: ${metrics.cpuUsage}%`);
    }

    if (metrics.responseTime > this.config.alertingThresholds.maxResponseTime) {
      this.emit('plugin:response-time-threshold-exceeded', pluginName, metrics);
      logger.warn(`Plugin ${pluginName} exceeded response time threshold: ${metrics.responseTime}ms`);
    }

    if (metrics.hookSuccessRate < this.config.alertingThresholds.minSuccessRate) {
      this.emit('plugin:success-rate-threshold-exceeded', pluginName, metrics);
      logger.warn(`Plugin ${pluginName} below success rate threshold: ${(metrics.hookSuccessRate * 100).toFixed(2)}%`);
    }
  }

  private storeMetrics(pluginName: string, metrics: PluginHealthMetrics) {
    const history = this.metricsHistory.get(pluginName) || [];
    history.push({ ...metrics });

    // Keep only recent metrics
    const cutoffTime = new Date().getTime() - this.config.metricsRetention;
    const filteredHistory = history.filter(m => m.lastHeartbeat.getTime() > cutoffTime);

    this.metricsHistory.set(pluginName, filteredHistory);
  }

  private cleanupOldMetrics() {
    const cutoffTime = new Date().getTime() - this.config.metricsRetention;

    for (const [pluginName, history] of this.metricsHistory) {
      const filteredHistory = history.filter(m => m.lastHeartbeat.getTime() > cutoffTime);
      
      if (filteredHistory.length === 0) {
        this.metricsHistory.delete(pluginName);
      } else {
        this.metricsHistory.set(pluginName, filteredHistory);
      }
    }

    logger.debug('Cleaned up old metrics');
  }

  getPluginHealth(pluginName: string): PluginHealthMetrics | null {
    return this.metrics.get(pluginName) || null;
  }

  getAllPluginsHealth(): PluginHealthMetrics[] {
    return Array.from(this.metrics.values());
  }

  getPluginHealthHistory(pluginName: string, timeRange?: number): PluginHealthMetrics[] {
    const history = this.metricsHistory.get(pluginName) || [];
    
    if (!timeRange) {
      return history;
    }

    const cutoffTime = new Date().getTime() - timeRange;
    return history.filter(m => m.lastHeartbeat.getTime() > cutoffTime);
  }

  getSystemHealth() {
    const allMetrics = this.getAllPluginsHealth();
    const totalPlugins = allMetrics.length;
    const healthyPlugins = allMetrics.filter(m => m.status === 'healthy').length;
    const degradedPlugins = allMetrics.filter(m => m.status === 'degraded').length;
    const unhealthyPlugins = allMetrics.filter(m => m.status === 'unhealthy').length;

    const totalErrors = allMetrics.reduce((sum, m) => sum + m.errorCount, 0);
    const totalWarnings = allMetrics.reduce((sum, m) => sum + m.warningCount, 0);
    const avgResponseTime = allMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalPlugins || 0;
    const avgMemoryUsage = allMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / totalPlugins || 0;
    const avgCpuUsage = allMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / totalPlugins || 0;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyPlugins > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedPlugins > 0 || totalErrors > 0) {
      overallStatus = 'degraded';
    }

    return {
      overallStatus,
      totalPlugins,
      healthyPlugins,
      degradedPlugins,
      unhealthyPlugins,
      totalErrors,
      totalWarnings,
      avgResponseTime,
      avgMemoryUsage,
      avgCpuUsage,
      monitoringStartTime: this.monitoringStartTime,
    };
  }

  resetPluginHealth(pluginName: string) {
    const metrics = this.metrics.get(pluginName);
    if (!metrics) return;

    metrics.errorCount = 0;
    metrics.warningCount = 0;
    metrics.responseTime = 0;
    metrics.memoryUsage = 0;
    metrics.cpuUsage = 0;
    metrics.hookSuccessRate = 1;
    metrics.apiSuccessRate = 1;
    metrics.lastError = undefined;
    metrics.lastWarning = undefined;

    logger.info(`Plugin health reset for: ${pluginName}`);
  }

  generateHealthReport(): string {
    const systemHealth = this.getSystemHealth();
    const allMetrics = this.getAllPluginsHealth();

    let report = `# Plugin Health Report\n\n`;
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Monitoring Start: ${systemHealth.monitoringStartTime.toISOString()}\n\n`;

    report += `## System Overview\n`;
    report += `- Overall Status: ${systemHealth.overallStatus}\n`;
    report += `- Total Plugins: ${systemHealth.totalPlugins}\n`;
    report += `- Healthy Plugins: ${systemHealth.healthyPlugins}\n`;
    report += `- Degraded Plugins: ${systemHealth.degradedPlugins}\n`;
    report += `- Unhealthy Plugins: ${systemHealth.unhealthyPlugins}\n`;
    report += `- Total Errors: ${systemHealth.totalErrors}\n`;
    report += `- Total Warnings: ${systemHealth.totalWarnings}\n`;
    report += `- Average Response Time: ${systemHealth.avgResponseTime.toFixed(2)}ms\n`;
    report += `- Average Memory Usage: ${(systemHealth.avgMemoryUsage / 1024 / 1024).toFixed(2)}MB\n`;
    report += `- Average CPU Usage: ${systemHealth.avgCpuUsage.toFixed(2)}%\n\n`;

    report += `## Plugin Details\n`;
    for (const metrics of allMetrics) {
      report += `### ${metrics.pluginName} (${metrics.version})\n`;
      report += `- Status: ${metrics.status}\n`;
      report += `- Last Heartbeat: ${metrics.lastHeartbeat.toISOString()}\n`;
      report += `- Error Count: ${metrics.errorCount}\n`;
      report += `- Warning Count: ${metrics.warningCount}\n`;
      report += `- Hook Success Rate: ${(metrics.hookSuccessRate * 100).toFixed(2)}%\n`;
      report += `- API Success Rate: ${(metrics.apiSuccessRate * 100).toFixed(2)}%\n`;
      report += `- Response Time: ${metrics.responseTime.toFixed(2)}ms\n`;
      report += `- Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB\n`;
      report += `- CPU Usage: ${metrics.cpuUsage.toFixed(2)}%\n`;
      if (metrics.lastError) {
        report += `- Last Error: ${metrics.lastError}\n`;
      }
      if (metrics.lastWarning) {
        report += `- Last Warning: ${metrics.lastWarning}\n`;
      }
      report += `\n`;
    }

    return report;
  }

  destroy() {
    // Clear all timers
    for (const timer of this.heartbeatTimers.values()) {
      clearInterval(timer);
    }
    this.heartbeatTimers.clear();

    // Clear all data
    this.metrics.clear();
    this.metricsHistory.clear();

    logger.info('Plugin health monitoring destroyed');
  }
}