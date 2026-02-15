import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Types for Performance Monitoring Service
export interface QueryPerformanceLog {
  id: string;
  queryHash: string;
  queryType: string;
  queryText: string;
  executionTimeMs: number;
  rowsAffected?: number;
  rowsReturned?: number;
  databaseName?: string;
  schemaName?: string;
  tableNames: string[];
  connectionId?: string;
  userId?: string;
  businessAccountId?: string;
  usedReplicaId?: string;
  wasRouted: boolean;
  timestamp: Date;
  requestContext?: any;
  indexesUsed: string[];
  isSlowQuery: boolean;
  slowQueryThresholdMs: number;
}

export interface SystemPerformanceMetrics {
  id: string;
  recordedAt: Date;
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  queriesPerSecond: number;
  avgQueryTimeMs: number;
  slowQueriesCount: number;
  replicaLagSeconds?: number;
  replicaStatus?: any;
  cpuUsagePercent?: number;
  memoryUsagePercent?: number;
  diskUsagePercent?: number;
  activeJobs: number;
  pendingJobs: number;
  failedJobs: number;
  flagEvaluationsPerSecond: number;
  activeFlagsCount: number;
  metadata?: any;
}

export interface PerformanceMonitoringRequest {
  queryHash: string;
  queryType: string;
  queryText: string;
  executionTimeMs: number;
  rowsAffected?: number;
  rowsReturned?: number;
  databaseName?: string;
  schemaName?: string;
  tableNames?: string[];
  connectionId?: string;
  userId?: string;
  businessAccountId?: string;
  usedReplicaId?: string;
  requestContext?: any;
  indexesUsed?: string[];
}

export interface SystemMetricsRequest {
  activeConnections?: number;
  idleConnections?: number;
  totalConnections?: number;
  queriesPerSecond?: number;
  avgQueryTimeMs?: number;
  slowQueriesCount?: number;
  replicaLagSeconds?: number;
  replicaStatus?: any;
  cpuUsagePercent?: number;
  memoryUsagePercent?: number;
  diskUsagePercent?: number;
  activeJobs?: number;
  pendingJobs?: number;
  failedJobs?: number;
  flagEvaluationsPerSecond?: number;
  activeFlagsCount?: number;
  metadata?: any;
}

// Validation schemas
const PerformanceMonitoringRequestSchema = z.object({
  queryHash: z.string().min(1).max(64),
  queryType: z.string().min(1).max(50),
  queryText: z.string().min(1),
  executionTimeMs: z.number().min(0),
  rowsAffected: z.number().optional(),
  rowsReturned: z.number().optional(),
  databaseName: z.string().optional(),
  schemaName: z.string().optional(),
  tableNames: z.array(z.string()).optional(),
  connectionId: z.string().optional(),
  userId: z.string().uuid().optional(),
  businessAccountId: z.string().uuid().optional(),
  usedReplicaId: z.string().uuid().optional(),
  requestContext: z.any().optional(),
  indexesUsed: z.array(z.string()).optional()
});

const SystemMetricsRequestSchema = z.object({
  activeConnections: z.number().optional(),
  idleConnections: z.number().optional(),
  totalConnections: z.number().optional(),
  queriesPerSecond: z.number().optional(),
  avgQueryTimeMs: z.number().optional(),
  slowQueriesCount: z.number().optional(),
  replicaLagSeconds: z.number().optional(),
  replicaStatus: z.any().optional(),
  cpuUsagePercent: z.number().optional(),
  memoryUsagePercent: z.number().optional(),
  diskUsagePercent: z.number().optional(),
  activeJobs: z.number().optional(),
  pendingJobs: z.number().optional(),
  failedJobs: z.number().optional(),
  flagEvaluationsPerSecond: z.number().optional(),
  activeFlagsCount: z.number().optional(),
  metadata: z.any().optional()
});

export class PerformanceMonitoringService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Log query performance
   */
  async logQueryPerformance(request: PerformanceMonitoringRequest): Promise<void> {
    try {
      const validated = PerformanceMonitoringRequestSchema.parse(request);

      await this.prisma.$queryRaw`
        SELECT log_query_performance(
          ${validated.queryHash},
          ${validated.queryType},
          ${validated.queryText},
          ${validated.executionTimeMs},
          ${validated.rowsAffected || null},
          ${validated.rowsReturned || null},
          ${validated.databaseName || null},
          ${validated.userId || null},
          ${validated.businessAccountId || null},
          ${validated.usedReplicaId || null},
          ${JSON.stringify(validated.indexesUsed || [])}
        )
      `;
    } catch (error) {
      console.error('Error logging query performance:', error);
      throw new Error('Failed to log query performance');
    }
  }

  /**
   * Get query performance logs
   */
  async getQueryPerformanceLogs(filters: {
    queryType?: string;
    databaseName?: string;
    userId?: string;
    businessAccountId?: string;
    isSlowQuery?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<QueryPerformanceLog[]> {
    try {
      let query = `
        SELECT 
          id, query_hash, query_type, query_text, execution_time_ms,
          rows_affected, rows_returned, database_name, schema_name,
          table_names, connection_id, user_id, business_account_id,
          used_replica_id, was_routed, timestamp, request_context,
          indexes_used, is_slow_query, slow_query_threshold_ms
        FROM query_performance_log
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (filters.queryType) {
        query += ` AND query_type = $${paramIndex++}`;
        params.push(filters.queryType);
      }

      if (filters.databaseName) {
        query += ` AND database_name = $${paramIndex++}`;
        params.push(filters.databaseName);
      }

      if (filters.userId) {
        query += ` AND user_id = $${paramIndex++}`;
        params.push(filters.userId);
      }

      if (filters.businessAccountId) {
        query += ` AND business_account_id = $${paramIndex++}`;
        params.push(filters.businessAccountId);
      }

      if (filters.isSlowQuery !== undefined) {
        query += ` AND is_slow_query = $${paramIndex++}`;
        params.push(filters.isSlowQuery);
      }

      if (filters.startDate) {
        query += ` AND timestamp >= $${paramIndex++}`;
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ` AND timestamp <= $${paramIndex++}`;
        params.push(filters.endDate);
      }

      query += ` ORDER BY timestamp DESC`;

      if (filters.offset) {
        query += ` OFFSET $${paramIndex++}`;
        params.push(filters.offset);
      }

      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      const logs = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      return logs.map(log => ({
        ...log,
        tableNames: typeof log.table_names === 'string' 
          ? JSON.parse(log.table_names) 
          : log.table_names,
        requestContext: typeof log.request_context === 'string' 
          ? JSON.parse(log.request_context) 
          : log.request_context,
        indexesUsed: typeof log.indexes_used === 'string' 
          ? JSON.parse(log.indexes_used) 
          : log.indexes_used
      }));
    } catch (error) {
      console.error('Error getting query performance logs:', error);
      throw new Error('Failed to retrieve query performance logs');
    }
  }

  /**
   * Get slow queries
   */
  async getSlowQueries(filters: {
    queryType?: string;
    databaseName?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<QueryPerformanceLog[]> {
    return this.getQueryPerformanceLogs({
      ...filters,
      isSlowQuery: true
    });
  }

  /**
   * Get query performance summary
   */
  async getQueryPerformanceSummary(filters: {
    queryType?: string;
    databaseName?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<any[]> {
    try {
      let query = `
        SELECT 
          query_type, database_name, query_count, avg_execution_time_ms,
          max_execution_time_ms, p95_execution_time_ms, slow_query_count,
          slow_query_percentage, last_query_at
        FROM mv_query_performance_summary
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (filters.queryType) {
        query += ` AND query_type = $${paramIndex++}`;
        params.push(filters.queryType);
      }

      if (filters.databaseName) {
        query += ` AND database_name = $${paramIndex++}`;
        params.push(filters.databaseName);
      }

      query += ` ORDER BY query_count DESC`;

      const summary = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      return summary;
    } catch (error) {
      console.error('Error getting query performance summary:', error);
      throw new Error('Failed to retrieve query performance summary');
    }
  }

  /**
   * Collect system metrics
   */
  async collectSystemMetrics(request?: SystemMetricsRequest): Promise<void> {
    try {
      const validated = request ? SystemMetricsRequestSchema.parse(request) : {};

      await this.prisma.$queryRaw`SELECT collect_system_metrics()`;
    } catch (error) {
      console.error('Error collecting system metrics:', error);
      throw new Error('Failed to collect system metrics');
    }
  }

  /**
   * Get system performance metrics
   */
  async getSystemPerformanceMetrics(filters: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<SystemPerformanceMetrics[]> {
    try {
      let query = `
        SELECT 
          id, recorded_at, active_connections, idle_connections, total_connections,
          queries_per_second, avg_query_time_ms, slow_queries_count,
          replica_lag_seconds, replica_status, cpu_usage_percent,
          memory_usage_percent, disk_usage_percent, active_jobs,
          pending_jobs, failed_jobs, flag_evaluations_per_second,
          active_flags_count, metadata
        FROM system_performance_metrics
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (filters.startDate) {
        query += ` AND recorded_at >= $${paramIndex++}`;
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ` AND recorded_at <= $${paramIndex++}`;
        params.push(filters.endDate);
      }

      query += ` ORDER BY recorded_at DESC`;

      if (filters.offset) {
        query += ` OFFSET $${paramIndex++}`;
        params.push(filters.offset);
      }

      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      const metrics = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      return metrics.map(metric => ({
        ...metric,
        replicaStatus: typeof metric.replica_status === 'string' 
          ? JSON.parse(metric.replica_status) 
          : metric.replica_status,
        metadata: typeof metric.metadata === 'string' 
          ? JSON.parse(metric.metadata) 
          : metric.metadata
      }));
    } catch (error) {
      console.error('Error getting system performance metrics:', error);
      throw new Error('Failed to retrieve system performance metrics');
    }
  }

  /**
   * Get latest system metrics
   */
  async getLatestSystemMetrics(): Promise<SystemPerformanceMetrics | null> {
    try {
      const metrics = await this.prisma.$queryRaw`
        SELECT 
          id, recorded_at, active_connections, idle_connections, total_connections,
          queries_per_second, avg_query_time_ms, slow_queries_count,
          replica_lag_seconds, replica_status, cpu_usage_percent,
          memory_usage_percent, disk_usage_percent, active_jobs,
          pending_jobs, failed_jobs, flag_evaluations_per_second,
          active_flags_count, metadata
        FROM system_performance_metrics
        ORDER BY recorded_at DESC
        LIMIT 1
      ` as any[];

      if (metrics.length === 0) {
        return null;
      }

      const metric = metrics[0];
      return {
        ...metric,
        replicaStatus: typeof metric.replica_status === 'string' 
          ? JSON.parse(metric.replica_status) 
          : metric.replica_status,
        metadata: typeof metric.metadata === 'string' 
          ? JSON.parse(metric.metadata) 
          : metric.metadata
      };
    } catch (error) {
      console.error('Error getting latest system metrics:', error);
      throw new Error('Failed to retrieve latest system metrics');
    }
  }

  /**
   * Get query patterns analysis
   */
  async getQueryPatternsAnalysis(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<any[]> {
    try {
      let interval = '1 hour';
      if (timeRange === 'day') interval = '1 hour';
      else if (timeRange === 'week') interval = '1 day';
      else if (timeRange === 'month') interval = '1 day';

      const analysis = await this.prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('${interval}', timestamp) as time_bucket,
          query_type,
          COUNT(*) as query_count,
          AVG(execution_time_ms) as avg_execution_time_ms,
          MAX(execution_time_ms) as max_execution_time_ms,
          COUNT(*) FILTER (WHERE is_slow_query = true) as slow_query_count,
          ROUND(
            (COUNT(*) FILTER (WHERE is_slow_query = true) * 100.0 / 
             NULLIF(COUNT(*), 0)), 2
          ) as slow_query_percentage
        FROM query_performance_log
        WHERE timestamp >= NOW() - INTERVAL '1 ${timeRange}'
        GROUP BY time_bucket, query_type
        ORDER BY time_bucket DESC, query_count DESC
      ` as any[];

      return analysis;
    } catch (error) {
      console.error('Error getting query patterns analysis:', error);
      throw new Error('Failed to retrieve query patterns analysis');
    }
  }

  /**
   * Get database performance trends
   */
  async getDatabasePerformanceTrends(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<any[]> {
    try {
      let interval = '1 hour';
      if (timeRange === 'day') interval = '1 hour';
      else if (timeRange === 'week') interval = '1 day';
      else if (timeRange === 'month') interval = '1 day';

      const trends = await this.prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('${interval}', recorded_at) as time_bucket,
          AVG(active_connections) as avg_active_connections,
          AVG(queries_per_second) as avg_queries_per_second,
          AVG(avg_query_time_ms) as avg_query_time_ms,
          AVG(slow_queries_count) as avg_slow_queries_count,
          AVG(cpu_usage_percent) as avg_cpu_usage_percent,
          AVG(memory_usage_percent) as avg_memory_usage_percent,
          AVG(disk_usage_percent) as avg_disk_usage_percent
        FROM system_performance_metrics
        WHERE recorded_at >= NOW() - INTERVAL '1 ${timeRange}'
        GROUP BY time_bucket
        ORDER BY time_bucket DESC
      ` as any[];

      return trends;
    } catch (error) {
      console.error('Error getting database performance trends:', error);
      throw new Error('Failed to retrieve database performance trends');
    }
  }

  /**
   * Get top slow queries
   */
  async getTopSlowQueries(limit: number = 10, timeRange: 'hour' | 'day' | 'week' = 'day'): Promise<any[]> {
    try {
      const queries = await this.prisma.$queryRaw`
        SELECT 
          query_hash,
          query_type,
          database_name,
          COUNT(*) as execution_count,
          AVG(execution_time_ms) as avg_execution_time_ms,
          MAX(execution_time_ms) as max_execution_time_ms,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_execution_time_ms,
          MIN(timestamp) as first_seen,
          MAX(timestamp) as last_seen
        FROM query_performance_log
        WHERE timestamp >= NOW() - INTERVAL '1 ${timeRange}'
        AND is_slow_query = true
        GROUP BY query_hash, query_type, database_name
        ORDER BY avg_execution_time_ms DESC
        LIMIT ${limit}
      ` as any[];

      return queries;
    } catch (error) {
      console.error('Error getting top slow queries:', error);
      throw new Error('Failed to retrieve top slow queries');
    }
  }

  /**
   * Get query performance by user
   */
  async getQueryPerformanceByUser(userId?: string, limit: number = 50): Promise<any[]> {
    try {
      let query = `
        SELECT 
          u.id as user_id,
          u.name as user_name,
          COUNT(*) as query_count,
          AVG(qpl.execution_time_ms) as avg_execution_time_ms,
          MAX(qpl.execution_time_ms) as max_execution_time_ms,
          COUNT(*) FILTER (WHERE qpl.is_slow_query = true) as slow_query_count,
          ROUND(
            (COUNT(*) FILTER (WHERE qpl.is_slow_query = true) * 100.0 / 
             NULLIF(COUNT(*), 0)), 2
          ) as slow_query_percentage
        FROM query_performance_log qpl
        LEFT JOIN users u ON qpl.user_id = u.id
        WHERE qpl.timestamp >= CURRENT_DATE - INTERVAL '7 days'
      `;

      const params: any[] = [];

      if (userId) {
        query += ` AND qpl.user_id = $1`;
        params.push(userId);
      }

      query += `
        GROUP BY u.id, u.name
        ORDER BY query_count DESC
        LIMIT $${params.length + 1}
      `;
      params.push(limit);

      const performance = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      return performance;
    } catch (error) {
      console.error('Error getting query performance by user:', error);
      throw new Error('Failed to retrieve query performance by user');
    }
  }

  /**
   * Get query performance by business account
   */
  async getQueryPerformanceByBusinessAccount(businessAccountId?: string, limit: number = 50): Promise<any[]> {
    try {
      let query = `
        SELECT 
          ba.id as business_account_id,
          ba.name as business_account_name,
          COUNT(*) as query_count,
          AVG(qpl.execution_time_ms) as avg_execution_time_ms,
          MAX(qpl.execution_time_ms) as max_execution_time_ms,
          COUNT(*) FILTER (WHERE qpl.is_slow_query = true) as slow_query_count,
          ROUND(
            (COUNT(*) FILTER (WHERE qpl.is_slow_query = true) * 100.0 / 
             NULLIF(COUNT(*), 0)), 2
          ) as slow_query_percentage
        FROM query_performance_log qpl
        LEFT JOIN business_accounts ba ON qpl.business_account_id = ba.id
        WHERE qpl.timestamp >= CURRENT_DATE - INTERVAL '7 days'
      `;

      const params: any[] = [];

      if (businessAccountId) {
        query += ` AND qpl.business_account_id = $1`;
        params.push(businessAccountId);
      }

      query += `
        GROUP BY ba.id, ba.name
        ORDER BY query_count DESC
        LIMIT $${params.length + 1}
      `;
      params.push(limit);

      const performance = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      return performance;
    } catch (error) {
      console.error('Error getting query performance by business account:', error);
      throw new Error('Failed to retrieve query performance by business account');
    }
  }

  /**
   * Get performance alerts
   */
  async getPerformanceAlerts(): Promise<any[]> {
    try {
      const alerts = await this.prisma.$queryRaw`
        SELECT 
          'slow_queries' as alert_type,
          COUNT(*) as alert_count,
          ROUND(
            (COUNT(*) * 100.0 / 
             (SELECT COUNT(*) FROM query_performance_log WHERE timestamp >= NOW() - INTERVAL '1 hour'))
          , 2) as percentage
        FROM query_performance_log
        WHERE timestamp >= NOW() - INTERVAL '1 hour'
        AND is_slow_query = true
        
        UNION ALL
        
        SELECT 
          'high_cpu' as alert_type,
          COUNT(*) as alert_count,
          ROUND(
            (COUNT(*) * 100.0 / 
             (SELECT COUNT(*) FROM system_performance_metrics WHERE recorded_at >= NOW() - INTERVAL '1 hour'))
          , 2) as percentage
        FROM system_performance_metrics
        WHERE recorded_at >= NOW() - INTERVAL '1 hour'
        AND cpu_usage_percent > 80
        
        UNION ALL
        
        SELECT 
          'high_memory' as alert_type,
          COUNT(*) as alert_count,
          ROUND(
            (COUNT(*) * 100.0 / 
             (SELECT COUNT(*) FROM system_performance_metrics WHERE recorded_at >= NOW() - INTERVAL '1 hour'))
          , 2) as percentage
        FROM system_performance_metrics
        WHERE recorded_at >= NOW() - INTERVAL '1 hour'
        AND memory_usage_percent > 80
        
        UNION ALL
        
        SELECT 
          'replica_lag' as alert_type,
          COUNT(*) as alert_count,
          ROUND(
            (COUNT(*) * 100.0 / 
             (SELECT COUNT(*) FROM system_performance_metrics WHERE recorded_at >= NOW() - INTERVAL '1 hour'))
          , 2) as percentage
        FROM system_performance_metrics
        WHERE recorded_at >= NOW() - INTERVAL '1 hour'
        AND replica_lag_seconds > 10
        
        ORDER BY percentage DESC
      ` as any[];

      return alerts.filter(alert => alert.alert_count > 0);
    } catch (error) {
      console.error('Error getting performance alerts:', error);
      throw new Error('Failed to retrieve performance alerts');
    }
  }

  /**
   * Get performance dashboard data
   */
  async getPerformanceDashboardData(): Promise<any> {
    try {
      const [
        latestMetrics,
        querySummary,
        slowQueries,
        performanceAlerts,
        queryPatterns
      ] = await Promise.all([
        this.getLatestSystemMetrics(),
        this.getQueryPerformanceSummary(),
        this.getSlowQueries({ limit: 5 }),
        this.getPerformanceAlerts(),
        this.getQueryPatternsAnalysis('hour')
      ]);

      return {
        systemMetrics: latestMetrics,
        queryPerformance: querySummary,
        slowQueries: slowQueries.slice(0, 5),
        alerts: performanceAlerts,
        patterns: queryPatterns.slice(0, 24), // Last 24 hours
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting performance dashboard data:', error);
      throw new Error('Failed to retrieve performance dashboard data');
    }
  }

  /**
   * Refresh performance monitoring views
   */
  async refreshPerformanceViews(): Promise<void> {
    try {
      await this.prisma.$queryRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_query_performance_summary`;
    } catch (error) {
      console.error('Error refreshing performance views:', error);
      throw new Error('Failed to refresh performance views');
    }
  }

  /**
   * Clean old performance logs
   */
  async cleanOldPerformanceLogs(retentionDays: number = 30): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw`
        DELETE FROM query_performance_log
        WHERE timestamp < NOW() - INTERVAL '${retentionDays} days'
        RETURNING COUNT(*) as deleted_count
      ` as any[];

      return result[0]?.deleted_count || 0;
    } catch (error) {
      console.error('Error cleaning old performance logs:', error);
      throw new Error('Failed to clean old performance logs');
    }
  }

  /**
   * Clean old system metrics
   */
  async cleanOldSystemMetrics(retentionDays: number = 90): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw`
        DELETE FROM system_performance_metrics
        WHERE recorded_at < NOW() - INTERVAL '${retentionDays} days'
        RETURNING COUNT(*) as deleted_count
      ` as any[];

      return result[0]?.deleted_count || 0;
    } catch (error) {
      console.error('Error cleaning old system metrics:', error);
      throw new Error('Failed to clean old system metrics');
    }
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStatistics(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<any> {
    try {
      const [
        queryStats,
        systemStats,
        alertStats
      ] = await Promise.all([
        this.getQueryPerformanceSummary(),
        this.getSystemPerformanceMetrics({ 
          startDate: new Date(Date.now() - this.getTimeRangeMs(timeRange)),
          limit: 100
        }),
        this.getPerformanceAlerts()
      ]);

      return {
        queryPerformance: queryStats,
        systemMetrics: systemStats,
        alerts: alertStats,
        timeRange,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting performance statistics:', error);
      throw new Error('Failed to retrieve performance statistics');
    }
  }

  private getTimeRangeMs(timeRange: string): number {
    switch (timeRange) {
      case 'hour': return 60 * 60 * 1000;
      case 'day': return 24 * 60 * 60 * 1000;
      case 'week': return 7 * 24 * 60 * 60 * 1000;
      case 'month': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }
}
