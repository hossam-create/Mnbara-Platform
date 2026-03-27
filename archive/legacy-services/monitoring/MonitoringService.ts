import { Logger } from '@mnbara/shared-utils';
import { EventBus } from '@mnbara/event-bus';

/**
 * Monitoring and Alerting Service - Comprehensive system monitoring
 */
export class MonitoringService {
  private logger: Logger;
  private eventBus: EventBus;
  private metrics: Map<string, MetricData>;
  private alerts: Map<string, AlertRule>;
  private dashboards: Map<string, DashboardConfig>;

  constructor(eventBus: EventBus) {
    this.logger = new Logger('MonitoringService');
    this.eventBus = eventBus;
    this.metrics = new Map();
    this.alerts = new Map();
    this.dashboards = new Map();
    
    this.initializeDefaultMetrics();
    this.initializeDefaultAlerts();
    this.initializeDefaultDashboards();
  }

  /**
   * Initialize default metrics
   */
  private initializeDefaultMetrics(): void {
    // Application Metrics
    this.metrics.set('api_response_time', {
      name: 'API Response Time',
      type: 'histogram',
      unit: 'milliseconds',
      description: 'API endpoint response times',
      labels: ['service', 'endpoint', 'method', 'status'],
      thresholds: {
        warning: 500,
        critical: 2000
      }
    });

    this.metrics.set('api_requests_total', {
      name: 'API Requests Total',
      type: 'counter',
      unit: 'count',
      description: 'Total number of API requests',
      labels: ['service', 'endpoint', 'method', 'status'],
      thresholds: {
        warning: 10000,
        critical: 50000
      }
    });

    this.metrics.set('error_rate', {
      name: 'Error Rate',
      type: 'gauge',
      unit: 'percentage',
      description: 'Percentage of requests resulting in errors',
      labels: ['service', 'error_type'],
      thresholds: {
        warning: 1,
        critical: 5
      }
    });

    // System Metrics
    this.metrics.set('cpu_usage', {
      name: 'CPU Usage',
      type: 'gauge',
      unit: 'percentage',
      description: 'CPU utilization percentage',
      labels: ['service', 'instance'],
      thresholds: {
        warning: 80,
        critical: 95
      }
    });

    this.metrics.set('memory_usage', {
      name: 'Memory Usage',
      type: 'gauge',
      unit: 'percentage',
      description: 'Memory utilization percentage',
      labels: ['service', 'instance'],
      thresholds: {
        warning: 85,
        critical: 95
      }
    });

    this.metrics.set('disk_usage', {
      name: 'Disk Usage',
      type: 'gauge',
      unit: 'percentage',
      description: 'Disk space utilization percentage',
      labels: ['service', 'instance', 'mount'],
      thresholds: {
        warning: 80,
        critical: 90
      }
    });

    // Database Metrics
    this.metrics.set('database_connections', {
      name: 'Database Connections',
      type: 'gauge',
      unit: 'count',
      description: 'Active database connections',
      labels: ['database', 'pool'],
      thresholds: {
        warning: 80,
        critical: 95
      }
    });

    this.metrics.set('database_query_time', {
      name: 'Database Query Time',
      type: 'histogram',
      unit: 'milliseconds',
      description: 'Database query execution time',
      labels: ['database', 'query_type'],
      thresholds: {
        warning: 100,
        critical: 500
      }
    });

    this.metrics.set('database_slow_queries', {
      name: 'Database Slow Queries',
      type: 'counter',
      unit: 'count',
      description: 'Number of slow database queries',
      labels: ['database', 'query_type'],
      thresholds: {
        warning: 10,
        critical: 50
      }
    });

    // Redis Metrics
    this.metrics.set('redis_connections', {
      name: 'Redis Connections',
      type: 'gauge',
      unit: 'count',
      description: 'Active Redis connections',
      labels: ['redis_instance'],
      thresholds: {
        warning: 80,
        critical: 95
      }
    });

    this.metrics.set('redis_memory_usage', {
      name: 'Redis Memory Usage',
      type: 'gauge',
      unit: 'bytes',
      description: 'Redis memory usage in bytes',
      labels: ['redis_instance'],
      thresholds: {
        warning: 1073741824, // 1GB
        critical: 2147483648 // 2GB
      }
    });

    this.metrics.set('redis_cache_hit_rate', {
      name: 'Redis Cache Hit Rate',
      type: 'gauge',
      unit: 'percentage',
      description: 'Redis cache hit rate percentage',
      labels: ['redis_instance'],
      thresholds: {
        warning: 80,
        critical: 60
      }
    });

    // Streaming Metrics
    this.metrics.set('active_streams', {
      name: 'Active Streams',
      type: 'gauge',
      unit: 'count',
      description: 'Number of active live streams',
      labels: ['quality', 'region'],
      thresholds: {
        warning: 100,
        critical: 500
      }
    });

    this.metrics.set('stream_viewers', {
      name: 'Stream Viewers',
      type: 'gauge',
      unit: 'count',
      description: 'Number of concurrent stream viewers',
      labels: ['stream_id', 'quality'],
      thresholds: {
        warning: 10000,
        critical: 50000
      }
    });

    this.metrics.set('stream_bandwidth', {
      name: 'Stream Bandwidth',
      type: 'gauge',
      unit: 'megabits_per_second',
      description: 'Total streaming bandwidth usage',
      labels: ['stream_id', 'quality'],
      thresholds: {
        warning: 1000,
        critical: 5000
      }
    });

    // Auction Metrics
    this.metrics.set('active_auctions', {
      name: 'Active Auctions',
      type: 'gauge',
      unit: 'count',
      description: 'Number of active auctions',
      labels: ['category', 'status'],
      thresholds: {
        warning: 1000,
        critical: 5000
      }
    });

    this.metrics.set('auction_bids', {
      name: 'Auction Bids',
      type: 'counter',
      unit: 'count',
      description: 'Total number of auction bids',
      labels: ['auction_id', 'bid_type'],
      thresholds: {
        warning: 100000,
        critical: 500000
      }
    });

    this.metrics.set('auction_revenue', {
      name: 'Auction Revenue',
      type: 'counter',
      unit: 'dollars',
      description: 'Total auction revenue',
      labels: ['category', 'currency'],
      thresholds: {
        warning: 1000000,
        critical: 5000000
      }
    });

    // Payment Metrics
    this.metrics.set('payment_transactions', {
      name: 'Payment Transactions',
      type: 'counter',
      unit: 'count',
      description: 'Total payment transactions',
      labels: ['payment_method', 'status'],
      thresholds: {
        warning: 10000,
        critical: 50000
      }
    });

    this.metrics.set('payment_processing_time', {
      name: 'Payment Processing Time',
      type: 'histogram',
      unit: 'milliseconds',
      description: 'Payment processing time',
      labels: ['payment_method'],
      thresholds: {
        warning: 5000,
        critical: 10000
      }
    });

    this.metrics.set('payment_failures', {
      name: 'Payment Failures',
      type: 'counter',
      unit: 'count',
      description: 'Number of failed payments',
      labels: ['payment_method', 'failure_reason'],
      thresholds: {
        warning: 100,
        critical: 500
      }
    });

    // Content Management Metrics
    this.metrics.set('content_items', {
      name: 'Content Items',
      type: 'gauge',
      unit: 'count',
      description: 'Total content items',
      labels: ['content_type', 'status'],
      thresholds: {
        warning: 100000,
        critical: 500000
      }
    });

    this.metrics.set('content_sync_operations', {
      name: 'Content Sync Operations',
      type: 'counter',
      unit: 'count',
      description: 'Content synchronization operations',
      labels: ['sync_type', 'status'],
      thresholds: {
        warning: 1000,
        critical: 5000
      }
    });

    this.metrics.set('personalization_requests', {
      name: 'Personalization Requests',
      type: 'counter',
      unit: 'count',
      description: 'Content personalization requests',
      labels: ['content_type', 'status'],
      thresholds: {
        warning: 50000,
        critical: 200000
      }
    });

    // User Metrics
    this.metrics.set('active_users', {
      name: 'Active Users',
      type: 'gauge',
      unit: 'count',
      description: 'Number of active users',
      labels: ['user_type', 'region'],
      thresholds: {
        warning: 100000,
        critical: 500000
      }
    });

    this.metrics.set('user_registrations', {
      name: 'User Registrations',
      type: 'counter',
      unit: 'count',
      description: 'Number of user registrations',
      labels: ['registration_source'],
      thresholds: {
        warning: 1000,
        critical: 5000
      }
    });

    this.metrics.set('authentication_attempts', {
      name: 'Authentication Attempts',
      type: 'counter',
      unit: 'count',
      description: 'User authentication attempts',
      labels: ['auth_method', 'status'],
      thresholds: {
        warning: 10000,
        critical: 50000
      }
    });
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlerts(): void {
    // High Error Rate Alert
    this.alerts.set('high_error_rate', {
      id: 'high_error_rate',
      name: 'High Error Rate',
      description: 'Alert when error rate exceeds threshold',
      metric: 'error_rate',
      condition: 'greater_than',
      threshold: 5,
      duration: '5m',
      severity: 'critical',
      enabled: true,
      notificationChannels: ['email', 'slack', 'pagerduty'],
      autoResolve: true,
      tags: ['performance', 'availability']
    });

    // High Response Time Alert
    this.alerts.set('high_response_time', {
      id: 'high_response_time',
      name: 'High Response Time',
      description: 'Alert when API response time exceeds threshold',
      metric: 'api_response_time',
      condition: 'greater_than',
      threshold: 2000,
      duration: '3m',
      severity: 'warning',
      enabled: true,
      notificationChannels: ['email', 'slack'],
      autoResolve: true,
      tags: ['performance']
    });

    // High CPU Usage Alert
    this.alerts.set('high_cpu_usage', {
      id: 'high_cpu_usage',
      name: 'High CPU Usage',
      description: 'Alert when CPU usage exceeds threshold',
      metric: 'cpu_usage',
      condition: 'greater_than',
      threshold: 90,
      duration: '10m',
      severity: 'warning',
      enabled: true,
      notificationChannels: ['email', 'slack'],
      autoResolve: true,
      tags: ['infrastructure']
    });

    // High Memory Usage Alert
    this.alerts.set('high_memory_usage', {
      id: 'high_memory_usage',
      name: 'High Memory Usage',
      description: 'Alert when memory usage exceeds threshold',
      metric: 'memory_usage',
      condition: 'greater_than',
      threshold: 90,
      duration: '10m',
      severity: 'critical',
      enabled: true,
      notificationChannels: ['email', 'slack', 'pagerduty'],
      autoResolve: true,
      tags: ['infrastructure']
    });

    // Database Connection Pool Exhaustion Alert
    this.alerts.set('db_connection_pool_exhausted', {
      id: 'db_connection_pool_exhausted',
      name: 'Database Connection Pool Exhausted',
      description: 'Alert when database connection pool is exhausted',
      metric: 'database_connections',
      condition: 'greater_than',
      threshold: 95,
      duration: '2m',
      severity: 'critical',
      enabled: true,
      notificationChannels: ['email', 'slack', 'pagerduty'],
      autoResolve: true,
      tags: ['database', 'infrastructure']
    });

    // High Database Query Time Alert
    this.alerts.set('high_db_query_time', {
      id: 'high_db_query_time',
      name: 'High Database Query Time',
      description: 'Alert when database query time exceeds threshold',
      metric: 'database_query_time',
      condition: 'greater_than',
      threshold: 500,
      duration: '5m',
      severity: 'warning',
      enabled: true,
      notificationChannels: ['email', 'slack'],
      autoResolve: true,
      tags: ['database', 'performance']
    });

    // Redis Memory Usage Alert
    this.alerts.set('high_redis_memory', {
      id: 'high_redis_memory',
      name: 'High Redis Memory Usage',
      description: 'Alert when Redis memory usage exceeds threshold',
      metric: 'redis_memory_usage',
      condition: 'greater_than',
      threshold: 2147483648, // 2GB
      duration: '10m',
      severity: 'warning',
      enabled: true,
      notificationChannels: ['email', 'slack'],
      autoResolve: true,
      tags: ['cache', 'infrastructure']
    });

    // Low Redis Cache Hit Rate Alert
    this.alerts.set('low_redis_cache_hit_rate', {
      id: 'low_redis_cache_hit_rate',
      name: 'Low Redis Cache Hit Rate',
      description: 'Alert when Redis cache hit rate drops below threshold',
      metric: 'redis_cache_hit_rate',
      condition: 'less_than',
      threshold: 60,
      duration: '15m',
      severity: 'warning',
      enabled: true,
      notificationChannels: ['email', 'slack'],
      autoResolve: true,
      tags: ['cache', 'performance']
    });

    // Payment Failure Rate Alert
    this.alerts.set('high_payment_failure_rate', {
      id: 'high_payment_failure_rate',
      name: 'High Payment Failure Rate',
      description: 'Alert when payment failure rate exceeds threshold',
      metric: 'payment_failures',
      condition: 'greater_than',
      threshold: 100,
      duration: '10m',
      severity: 'critical',
      enabled: true,
      notificationChannels: ['email', 'slack', 'pagerduty'],
      autoResolve: true,
      tags: ['payments', 'business']
    });

    // Authentication Failure Rate Alert
    this.alerts.set('high_auth_failure_rate', {
      id: 'high_auth_failure_rate',
      name: 'High Authentication Failure Rate',
      description: 'Alert when authentication failure rate exceeds threshold',
      metric: 'authentication_attempts',
      condition: 'greater_than',
      threshold: 1000,
      duration: '5m',
      severity: 'warning',
      enabled: true,
      notificationChannels: ['email', 'slack'],
      autoResolve: true,
      tags: ['security', 'authentication']
    });
  }

  /**
   * Initialize default dashboards
   */
  private initializeDefaultDashboards(): void {
    // System Overview Dashboard
    this.dashboards.set('system_overview', {
      id: 'system_overview',
      name: 'System Overview',
      description: 'High-level system health and performance metrics',
      panels: [
        {
          id: 'cpu_usage_panel',
          title: 'CPU Usage',
          type: 'graph',
          metric: 'cpu_usage',
          timeRange: '1h',
          refreshInterval: '30s'
        },
        {
          id: 'memory_usage_panel',
          title: 'Memory Usage',
          type: 'graph',
          metric: 'memory_usage',
          timeRange: '1h',
          refreshInterval: '30s'
        },
        {
          id: 'response_time_panel',
          title: 'API Response Time',
          type: 'graph',
          metric: 'api_response_time',
          timeRange: '1h',
          refreshInterval: '30s'
        },
        {
          id: 'error_rate_panel',
          title: 'Error Rate',
          type: 'graph',
          metric: 'error_rate',
          timeRange: '1h',
          refreshInterval: '30s'
        }
      ]
    });

    // Database Performance Dashboard
    this.dashboards.set('database_performance', {
      id: 'database_performance',
      name: 'Database Performance',
      description: 'Database performance and health metrics',
      panels: [
        {
          id: 'db_connections_panel',
          title: 'Database Connections',
          type: 'graph',
          metric: 'database_connections',
          timeRange: '1h',
          refreshInterval: '30s'
        },
        {
          id: 'db_query_time_panel',
          title: 'Database Query Time',
          type: 'graph',
          metric: 'database_query_time',
          timeRange: '1h',
          refreshInterval: '30s'
        },
        {
          id: 'slow_queries_panel',
          title: 'Slow Queries',
          type: 'graph',
          metric: 'database_slow_queries',
          timeRange: '1h',
          refreshInterval: '30s'
        }
      ]
    });

    // Redis Performance Dashboard
    this.dashboards.set('redis_performance', {
      id: 'redis_performance',
      name: 'Redis Performance',
      description: 'Redis cache performance metrics',
      panels: [
        {
          id: 'redis_memory_panel',
          title: 'Redis Memory Usage',
          type: 'graph',
          metric: 'redis_memory_usage',
          timeRange: '1h',
          refreshInterval: '30s'
        },
        {
          id: 'redis_hit_rate_panel',
          title: 'Redis Cache Hit Rate',
          type: 'graph',
          metric: 'redis_cache_hit_rate',
          timeRange: '1h',
          refreshInterval: '30s'
        },
        {
          id: 'redis_connections_panel',
          title: 'Redis Connections',
          type: 'graph',
          metric: 'redis_connections',
          timeRange: '1h',
          refreshInterval: '30s'
        }
      ]
    });

    // Streaming Dashboard
    this.dashboards.set('streaming_analytics', {
      id: 'streaming_analytics',
      name: 'Streaming Analytics',
      description: 'Live streaming performance and analytics',
      panels: [
        {
          id: 'active_streams_panel',
          title: 'Active Streams',
          type: 'graph',
          metric: 'active_streams',
          timeRange: '1h',
          refreshInterval: '30s'
        },
        {
          id: 'stream_viewers_panel',
          title: 'Stream Viewers',
          type: 'graph',
          metric: 'stream_viewers',
          timeRange: '1h',
          refreshInterval: '30s'
        },
        {
          id: 'stream_bandwidth_panel',
          title: 'Stream Bandwidth',
          type: 'graph',
          metric: 'stream_bandwidth',
          timeRange: '1h',
          refreshInterval: '30s'
        }
      ]
    });

    // Auction Dashboard
    this.dashboards.set('auction_analytics', {
      id: 'auction_analytics',
      name: 'Auction Analytics',
      description: 'Auction performance and revenue metrics',
      panels: [
        {
          id: 'active_auctions_panel',
          title: 'Active Auctions',
          type: 'graph',
          metric: 'active_auctions',
          timeRange: '1h',
          refreshInterval: '30s'
        },
        {
          id: 'auction_bids_panel',
          title: 'Auction Bids',
          type: 'graph',
          metric: 'auction_bids',
          timeRange: '1h',
          refreshInterval: '30s'
        },
        {
          id: 'auction_revenue_panel',
          title: 'Auction Revenue',
          type: 'graph',
          metric: 'auction_revenue',
          timeRange: '1h',
          refreshInterval: '30s'
        }
      ]
    });

    // Payment Dashboard
    this.dashboards.set('payment_analytics', {
      id: 'payment_analytics',
      name: 'Payment Analytics',
      description: 'Payment processing and transaction metrics',
      panels: [
        {
          id: 'payment_transactions_panel',
          title: 'Payment Transactions',
          type: 'graph',
          metric: 'payment_transactions',
          timeRange: '1h',
          refreshInterval: '30s'
        },
        {
          id: 'payment_processing_time_panel',
          title: 'Payment Processing Time',
          type: 'graph',
          metric: 'payment_processing_time',
          timeRange: '1h',
          refreshInterval: '30s'
        },
        {
          id: 'payment_failures_panel',
          title: 'Payment Failures',
          type: 'graph',
          metric: 'payment_failures',
          timeRange: '1h',
          refreshInterval: '30s'
        }
      ]
    });

    // User Analytics Dashboard
    this.dashboards.set('user_analytics', {
      id: 'user_analytics',
      name: 'User Analytics',
      description: 'User engagement and authentication metrics',
      panels: [
        {
          id: 'active_users_panel',
          title: 'Active Users',
          type: 'graph',
          metric: 'active_users',
          timeRange: '1h',
          refreshInterval: '30s'
        },
        {
          id: 'user_registrations_panel',
          title: 'User Registrations',
          type: 'graph',
          metric: 'user_registrations',
          timeRange: '1h',
          refreshInterval: '30s'
        },
        {
          id: 'auth_attempts_panel',
          title: 'Authentication Attempts',
          type: 'graph',
          metric: 'authentication_attempts',
          timeRange: '1h',
          refreshInterval: '30s'
        }
      ]
    });

    // Content Management Dashboard
    this.dashboards.set('content_management', {
      id: 'content_management',
      name: 'Content Management',
      description: 'Content management and CrafterCMS metrics',
      panels: [
        {
          id: 'content_items_panel',
          title: 'Content Items',
          type: 'graph',
          metric: 'content_items',
          timeRange: '1h',
          refreshInterval: '30s'
        },
        {
          id: 'content_sync_operations_panel',
          title: 'Content Sync Operations',
          type: 'graph',
          metric: 'content_sync_operations',
          timeRange: '1h',
          refreshInterval: '30s'
        },
        {
          id: 'personalization_requests_panel',
          title: 'Personalization Requests',
          type: 'graph',
          metric: 'personalization_requests',
          timeRange: '1h',
          refreshInterval: '30s'
        }
      ]
    });
  }

  /**
   * Record metric data
   */
  async recordMetric(metricName: string, value: number, labels: Record<string, string> = {}): Promise<void> {
    try {
      const metric = this.metrics.get(metricName);
      if (!metric) {
        this.logger.warn(`Unknown metric: ${metricName}`);
        return;
      }

      const metricData: MetricDataPoint = {
        name: metricName,
        value,
        labels,
        timestamp: new Date().toISOString(),
        metric: metric
      };

      // Check thresholds and trigger alerts if necessary
      await this.checkThresholds(metricData);

      // Publish metric event
      await this.eventBus.publish({
        type: 'metric.recorded',
        source: 'monitoring-service',
        data: metricData,
        timestamp: metricData.timestamp
      });

      this.logger.debug(`Recorded metric: ${metricName} = ${value}`, { labels });

    } catch (error) {
      this.logger.error(`Failed to record metric: ${metricName}`, error);
    }
  }

  /**
   * Check metric thresholds
   */
  private async checkThresholds(metricData: MetricDataPoint): Promise<void> {
    const metric = metricData.metric;
    const value = metricData.value;

    if (!metric.thresholds) {
      return;
    }

    // Check warning threshold
    if (metric.thresholds.warning && value > metric.thresholds.warning) {
      await this.triggerAlert(metricData, 'warning');
    }

    // Check critical threshold
    if (metric.thresholds.critical && value > metric.thresholds.critical) {
      await this.triggerAlert(metricData, 'critical');
    }
  }

  /**
   * Trigger alert
   */
  private async triggerAlert(metricData: MetricDataPoint, severity: 'warning' | 'critical'): Promise<void> {
    const alertData: AlertData = {
      id: `alert_${metricData.name}_${Date.now()}`,
      metric: metricData.name,
      value: metricData.value,
      severity,
      threshold: metricData.metric.thresholds![severity],
      timestamp: metricData.timestamp,
      labels: metricData.labels
    };

    // Find matching alert rules
    const matchingAlerts = Array.from(this.alerts.values()).filter(alert => 
      alert.metric === metricData.name && 
      alert.enabled && 
      alert.severity === severity
    );

    for (const alert of matchingAlerts) {
      await this.processAlert(alert, alertData);
    }
  }

  /**
   * Process alert
   */
  private async processAlert(alert: AlertRule, alertData: AlertData): Promise<void> {
    try {
      this.logger.warn(`Alert triggered: ${alert.name}`, {
        metric: alertData.metric,
        value: alertData.value,
        threshold: alertData.threshold,
        severity: alertData.severity
      });

      // Send notifications
      await this.sendNotifications(alert, alertData);

      // Publish alert event
      await this.eventBus.publish({
        type: 'alert.triggered',
        source: 'monitoring-service',
        data: {
          alertId: alert.id,
          alertName: alert.name,
          metric: alertData.metric,
          value: alertData.value,
          threshold: alertData.threshold,
          severity: alertData.severity,
          timestamp: alertData.timestamp
        },
        timestamp: alertData.timestamp
      });

    } catch (error) {
      this.logger.error(`Failed to process alert: ${alert.name}`, error);
    }
  }

  /**
   * Send notifications
   */
  private async sendNotifications(alert: AlertRule, alertData: AlertData): Promise<void> {
    const notificationPromises: Promise<void>[] = [];

    for (const channel of alert.notificationChannels) {
      switch (channel) {
        case 'email':
          notificationPromises.push(this.sendEmailNotification(alert, alertData));
          break;
        case 'slack':
          notificationPromises.push(this.sendSlackNotification(alert, alertData));
          break;
        case 'pagerduty':
          notificationPromises.push(this.sendPagerDutyNotification(alert, alertData));
          break;
        default:
          this.logger.warn(`Unknown notification channel: ${channel}`);
      }
    }

    await Promise.all(notificationPromises);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: AlertRule, alertData: AlertData): Promise<void> {
    try {
      const subject = `[${alertData.severity.toUpperCase()}] ${alert.name}`;
      const body = `
        Alert: ${alert.name}
        Severity: ${alertData.severity}
        Metric: ${alertData.metric}
        Current Value: ${alertData.value}
        Threshold: ${alertData.threshold}
        Timestamp: ${alertData.timestamp}
        Labels: ${JSON.stringify(alertData.labels)}
      `;

      // In a real implementation, this would integrate with an email service
      this.logger.info(`Email notification sent: ${subject}`, { body });

    } catch (error) {
      this.logger.error('Failed to send email notification', error);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: AlertRule, alertData: AlertData): Promise<void> {
    try {
      const color = alertData.severity === 'critical' ? 'danger' : 'warning';
      const message = {
        attachments: [{
          color,
          title: alert.name,
          fields: [
            { title: 'Severity', value: alertData.severity, short: true },
            { title: 'Metric', value: alertData.metric, short: true },
            { title: 'Current Value', value: alertData.value.toString(), short: true },
            { title: 'Threshold', value: alertData.threshold.toString(), short: true },
            { title: 'Timestamp', value: alertData.timestamp, short: false }
          ]
        }]
      };

      // In a real implementation, this would integrate with Slack API
      this.logger.info('Slack notification sent', { message });

    } catch (error) {
      this.logger.error('Failed to send Slack notification', error);
    }
  }

  /**
   * Send PagerDuty notification
   */
  private async sendPagerDutyNotification(alert: AlertRule, alertData: AlertData): Promise<void> {
    try {
      if (alertData.severity !== 'critical') {
        return; // Only send critical alerts to PagerDuty
      }

      const incident = {
        routing_key: process.env.PAGERDUTY_ROUTING_KEY,
        event_action: 'trigger',
        dedup_key: alertData.id,
        payload: {
          summary: alert.name,
          severity: 'critical',
          source: 'monitoring-service',
          component: alertData.metric,
          group: 'mnbara-platform',
          class: 'performance',
          custom_details: {
            metric: alertData.metric,
            value: alertData.value,
            threshold: alertData.threshold,
            labels: alertData.labels
          }
        }
      };

      // In a real implementation, this would integrate with PagerDuty API
      this.logger.info('PagerDuty notification sent', { incident });

    } catch (error) {
      this.logger.error('Failed to send PagerDuty notification', error);
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(dashboardId: string, timeRange: string = '1h'): Promise<DashboardData> {
    try {
      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard not found: ${dashboardId}`);
      }

      const panelData: PanelData[] = [];

      for (const panel of dashboard.panels) {
        const metricData = await this.getMetricData(panel.metric, timeRange);
        
        panelData.push({
          id: panel.id,
          title: panel.title,
          type: panel.type,
          data: metricData,
          timeRange: timeRange,
          lastUpdated: new Date().toISOString()
        });
      }

      return {
        id: dashboard.id,
        name: dashboard.name,
        description: dashboard.description,
        panels: panelData,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to get dashboard data: ${dashboardId}`, error);
      throw error;
    }
  }

  /**
   * Get metric data
   */
  private async getMetricData(metricName: string, timeRange: string): Promise<MetricTimeSeries[]> {
    // In a real implementation, this would query a time-series database
    // For now, return simulated data
    
    const dataPoints: MetricDataPoint[] = [];
    const now = Date.now();
    const rangeMs = this.parseTimeRange(timeRange);
    const intervalMs = rangeMs / 60; // 60 data points

    for (let i = 0; i < 60; i++) {
      const timestamp = new Date(now - (rangeMs - i * intervalMs));
      const value = this.generateSimulatedValue(metricName, i);
      
      dataPoints.push({
        name: metricName,
        value,
        timestamp: timestamp.toISOString()
      });
    }

    return [{
      metric: metricName,
      dataPoints,
      unit: this.metrics.get(metricName)?.unit || 'count'
    }];
  }

  /**
   * Generate simulated metric value
   */
  private generateSimulatedValue(metricName: string, index: number): number {
    const baseValue = this.getBaseMetricValue(metricName);
    const variation = Math.sin(index * 0.1) * baseValue * 0.2;
    const noise = (Math.random() - 0.5) * baseValue * 0.1;
    
    return Math.max(0, baseValue + variation + noise);
  }

  /**
   * Get base metric value for simulation
   */
  private getBaseMetricValue(metricName: string): number {
    const baseValues: Record<string, number> = {
      'cpu_usage': 50,
      'memory_usage': 60,
      'disk_usage': 40,
      'api_response_time': 200,
      'error_rate': 1,
      'database_connections': 50,
      'database_query_time': 100,
      'redis_memory_usage': 500000000,
      'redis_cache_hit_rate': 85,
      'active_streams': 25,
      'stream_viewers': 5000,
      'stream_bandwidth': 2500,
      'active_auctions': 500,
      'auction_bids': 25000,
      'auction_revenue': 2500000,
      'payment_transactions': 5000,
      'payment_processing_time': 3000,
      'payment_failures': 50,
      'content_items': 50000,
      'content_sync_operations': 2500,
      'personalization_requests': 100000,
      'active_users': 50000,
      'user_registrations': 2500,
      'authentication_attempts': 25000
    };
    
    return baseValues[metricName] || 100;
  }

  /**
   * Parse time range
   */
  private parseTimeRange(timeRange: string): number {
    const rangeMap: Record<string, number> = {
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };
    
    return rangeMap[timeRange] || 60 * 60 * 1000; // Default to 1 hour
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      // Calculate overall health based on recent metrics
      const health: SystemHealth = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {},
        overallScore: 100
      };

      // Simulate health check for each service
      const services = ['plugin-system', 'ebay-live-service', 'craftercms-content-service', 'unified-wallet-service'];
      
      for (const service of services) {
        const serviceHealth = await this.checkServiceHealth(service);
        health.services[service] = serviceHealth;
        
        // Update overall score
        if (serviceHealth.status !== 'healthy') {
          health.overallScore -= 25;
        }
      }

      health.overallScore = Math.max(0, health.overallScore);
      health.status = health.overallScore >= 75 ? 'healthy' : 
                     health.overallScore >= 50 ? 'degraded' : 'unhealthy';

      return health;

    } catch (error) {
      this.logger.error('Failed to get system health', error);
      throw error;
    }
  }

  /**
   * Check individual service health
   */
  private async checkServiceHealth(serviceName: string): Promise<ServiceHealth> {
    try {
      // Simulate service health check
      const status = Math.random() > 0.1 ? 'healthy' : 'degraded';
      const responseTime = Math.random() * 100 + 50; // 50-150ms
      
      return {
        status,
        responseTime,
        uptime: Math.floor(Math.random() * 86400) + 3600, // 1-25 hours
        lastCheck: new Date().toISOString(),
        errorRate: Math.random() * 2, // 0-2%
        cpuUsage: Math.random() * 30 + 20, // 20-50%
        memoryUsage: Math.random() * 40 + 30, // 30-70%
        activeConnections: Math.floor(Math.random() * 100) + 50
      };

    } catch (error) {
      this.logger.error(`Failed to check service health: ${serviceName}`, error);
      return {
        status: 'unhealthy',
        responseTime: 0,
        uptime: 0,
        lastCheck: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Generate monitoring report
   */
  async generateMonitoringReport(timeRange: string = '24h'): Promise<MonitoringReport> {
    try {
      const report: MonitoringReport = {
        timestamp: new Date().toISOString(),
        timeRange,
        systemHealth: await this.getSystemHealth(),
        topAlerts: [],
        performanceSummary: {},
        recommendations: []
      };

      // Get recent alerts
      const recentAlerts = Array.from(this.alerts.values()).filter(alert => alert.enabled);
      report.topAlerts = recentAlerts.slice(0, 5).map(alert => ({
        name: alert.name,
        description: alert.description,
        severity: alert.severity,
        metric: alert.metric,
        threshold: alert.threshold
      }));

      // Generate performance summary
      report.performanceSummary = {
        averageResponseTime: Math.random() * 100 + 100, // 100-200ms
        p95ResponseTime: Math.random() * 200 + 300, // 300-500ms
        errorRate: Math.random() * 2, // 0-2%
        availability: 99.9 - Math.random() * 0.5, // 99.4-99.9%
        throughput: Math.floor(Math.random() * 5000) + 5000 // 5000-10000 RPS
      };

      // Generate recommendations
      report.recommendations = [
        {
          category: 'Performance',
          recommendation: 'Consider scaling up services if response times exceed 500ms',
          priority: 'medium'
        },
        {
          category: 'Reliability',
          recommendation: 'Implement circuit breakers for external service dependencies',
          priority: 'high'
        },
        {
          category: 'Monitoring',
          recommendation: 'Set up distributed tracing for better observability',
          priority: 'low'
        }
      ];

      return report;

    } catch (error) {
      this.logger.error('Failed to generate monitoring report', error);
      throw error;
    }
  }
}

// Types
interface MetricData {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  unit: string;
  description: string;
  labels: string[];
  thresholds?: {
    warning?: number;
    critical?: number;
  };
}

interface MetricDataPoint {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: string;
  metric: MetricData;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals';
  threshold: number;
  duration: string;
  severity: 'warning' | 'critical';
  enabled: boolean;
  notificationChannels: string[];
  autoResolve: boolean;
  tags: string[];
}

interface AlertData {
  id: string;
  metric: string;
  value: number;
  severity: 'warning' | 'critical';
  threshold: number;
  timestamp: string;
  labels: Record<string, string>;
}

interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  panels: DashboardPanel[];
}

interface DashboardPanel {
  id: string;
  title: string;
  type: 'graph' | 'table' | 'stat';
  metric: string;
  timeRange: string;
  refreshInterval: string;
}

interface DashboardData {
  id: string;
  name: string;
  description: string;
  panels: PanelData[];
  generatedAt: string;
}

interface PanelData {
  id: string;
  title: string;
  type: string;
  data: MetricTimeSeries[];
  timeRange: string;
  lastUpdated: string;
}

interface MetricTimeSeries {
  metric: string;
  dataPoints: MetricDataPoint[];
  unit: string;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: Record<string, ServiceHealth>;
  overallScore: number;
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  uptime: number;
  lastCheck: string;
  errorRate?: number;
  cpuUsage?: number;
  memoryUsage?: number;
  activeConnections?: number;
  error?: string;
}

interface MonitoringReport {
  timestamp: string;
  timeRange: string;
  systemHealth: SystemHealth;
  topAlerts: Array<{
    name: string;
    description: string;
    severity: string;
    metric: string;
    threshold: number;
  }>;
  performanceSummary: {
    averageResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
    availability: number;
    throughput: number;
  };
  recommendations: Array<{
    category: string;
    recommendation: string;
    priority: string;
  }>;
}