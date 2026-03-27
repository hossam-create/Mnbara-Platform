import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Types for Read Replica Service
export interface ReadReplicaConfiguration {
  id: string;
  replicaName: string;
  replicaType: 'ANALYTICS' | 'REPORTING' | 'BACKUP' | 'HOT_STANDBY';
  host: string;
  port: number;
  databaseName: string;
  maxConnections: number;
  connectionTimeoutSeconds: number;
  queryTimeoutSeconds: number;
  isPrimary: boolean;
  isActive: boolean;
  priority: number;
  weight: number;
  maxLoadPercentage: number;
  healthCheckIntervalSeconds: number;
  lastHealthCheckAt?: Date;
  isHealthy: boolean;
  region?: string;
  availabilityZone?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QueryRoutingRule {
  id: string;
  ruleName: string;
  queryPattern: string;
  queryType: 'SELECT' | 'ANALYTICS' | 'REPORTING' | 'AGGREGATE';
  targetReplicaId: string;
  fallbackToPrimary: boolean;
  conditions: any;
  maxExecutionTimeMs?: number;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueryRoutingResult {
  useReplica: boolean;
  replicaId?: string;
  replicaName?: string;
  reason: string;
}

export interface ReadReplicaRequest {
  replicaName: string;
  replicaType: 'ANALYTICS' | 'REPORTING' | 'BACKUP' | 'HOT_STANDBY';
  host: string;
  port?: number;
  databaseName: string;
  maxConnections?: number;
  connectionTimeoutSeconds?: number;
  queryTimeoutSeconds?: number;
  isPrimary?: boolean;
  isActive?: boolean;
  priority?: number;
  weight?: number;
  maxLoadPercentage?: number;
  healthCheckIntervalSeconds?: number;
  region?: string;
  availabilityZone?: string;
  tags?: string[];
}

export interface QueryRoutingRuleRequest {
  ruleName: string;
  queryPattern: string;
  queryType: 'SELECT' | 'ANALYTICS' | 'REPORTING' | 'AGGREGATE';
  targetReplicaId: string;
  fallbackToPrimary?: boolean;
  conditions?: any;
  maxExecutionTimeMs?: number;
  priority?: number;
}

// Validation schemas
const ReadReplicaRequestSchema = z.object({
  replicaName: z.string().min(1).max(255),
  replicaType: z.enum(['ANALYTICS', 'REPORTING', 'BACKUP', 'HOT_STANDBY']),
  host: z.string().min(1).max(255),
  port: z.number().min(1).max(65535).optional(),
  databaseName: z.string().min(1).max(255),
  maxConnections: z.number().min(1).max(1000).optional(),
  connectionTimeoutSeconds: z.number().min(1).max(300).optional(),
  queryTimeoutSeconds: z.number().min(1).max(600).optional(),
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
  priority: z.number().optional(),
  weight: z.number().min(1).max(10).optional(),
  maxLoadPercentage: z.number().min(0).max(100).optional(),
  healthCheckIntervalSeconds: z.number().min(1).max(300).optional(),
  region: z.string().optional(),
  availabilityZone: z.string().optional(),
  tags: z.array(z.string()).optional()
});

const QueryRoutingRuleRequestSchema = z.object({
  ruleName: z.string().min(1).max(255),
  queryPattern: z.string().min(1),
  queryType: z.enum(['SELECT', 'ANALYTICS', 'REPORTING', 'AGGREGATE']),
  targetReplicaId: z.string().uuid(),
  fallbackToPrimary: z.boolean().optional(),
  conditions: z.any().optional(),
  maxExecutionTimeMs: z.number().optional(),
  priority: z.number().optional()
});

export class ReadReplicaService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create read replica configuration
   */
  async createReadReplicaConfiguration(request: ReadReplicaRequest): Promise<ReadReplicaConfiguration> {
    try {
      const validated = ReadReplicaRequestSchema.parse(request);

      const result = await this.prisma.$queryRaw`
        INSERT INTO read_replica_configurations (
          replica_name, replica_type, host, port, database_name,
          max_connections, connection_timeout_seconds, query_timeout_seconds,
          is_primary, is_active, priority, weight, max_load_percentage,
          health_check_interval_seconds, region, availability_zone, tags,
          created_at, updated_at
        ) VALUES (
          ${validated.replicaName},
          ${validated.replicaType},
          ${validated.host},
          ${validated.port || 5432},
          ${validated.databaseName},
          ${validated.maxConnections || 100},
          ${validated.connectionTimeoutSeconds || 30},
          ${validated.queryTimeoutSeconds || 60},
          ${validated.isPrimary || false},
          ${validated.isActive || true},
          ${validated.priority || 0},
          ${validated.weight || 1},
          ${validated.maxLoadPercentage || 80},
          ${validated.healthCheckIntervalSeconds || 30},
          ${validated.region || null},
          ${validated.availabilityZone || null},
          ${JSON.stringify(validated.tags || [])},
          NOW(),
          NOW()
        )
        RETURNING id, replica_name, replica_type, created_at, updated_at
      ` as any[];

      const replica = await this.getReadReplicaById(result[0].id);
      return replica;
    } catch (error) {
      console.error('Error creating read replica configuration:', error);
      throw new Error('Failed to create read replica configuration');
    }
  }

  /**
   * Get read replica by ID
   */
  async getReadReplicaById(replicaId: string): Promise<ReadReplicaConfiguration> {
    try {
      const replicas = await this.prisma.$queryRaw`
        SELECT 
          id, replica_name, replica_type, host, port, database_name,
          max_connections, connection_timeout_seconds, query_timeout_seconds,
          is_primary, is_active, priority, weight, max_load_percentage,
          health_check_interval_seconds, last_health_check_at, is_healthy,
          region, availability_zone, tags, created_at, updated_at
        FROM read_replica_configurations 
        WHERE id = ${replicaId}
      ` as any[];

      if (replicas.length === 0) {
        throw new Error('Read replica configuration not found');
      }

      const replica = replicas[0];
      return {
        ...replica,
        tags: typeof replica.tags === 'string' 
          ? JSON.parse(replica.tags) 
          : replica.tags
      };
    } catch (error) {
      console.error('Error getting read replica:', error);
      throw new Error('Failed to retrieve read replica configuration');
    }
  }

  /**
   * Get read replica configurations
   */
  async getReadReplicaConfigurations(filters: {
    replicaType?: string;
    isActive?: boolean;
    isHealthy?: boolean;
    region?: string;
    limit?: number;
  } = {}): Promise<ReadReplicaConfiguration[]> {
    try {
      let query = `
        SELECT 
          id, replica_name, replica_type, host, port, database_name,
          max_connections, connection_timeout_seconds, query_timeout_seconds,
          is_primary, is_active, priority, weight, max_load_percentage,
          health_check_interval_seconds, last_health_check_at, is_healthy,
          region, availability_zone, tags, created_at, updated_at
        FROM read_replica_configurations
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (filters.replicaType) {
        query += ` AND replica_type = $${paramIndex++}`;
        params.push(filters.replicaType);
      }

      if (filters.isActive !== undefined) {
        query += ` AND is_active = $${paramIndex++}`;
        params.push(filters.isActive);
      }

      if (filters.isHealthy !== undefined) {
        query += ` AND is_healthy = $${paramIndex++}`;
        params.push(filters.isHealthy);
      }

      if (filters.region) {
        query += ` AND region = $${paramIndex++}`;
        params.push(filters.region);
      }

      query += ` ORDER BY priority ASC, replica_name ASC`;

      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      const replicas = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      return replicas.map(replica => ({
        ...replica,
        tags: typeof replica.tags === 'string' 
          ? JSON.parse(replica.tags) 
          : replica.tags
      }));
    } catch (error) {
      console.error('Error getting read replica configurations:', error);
      throw new Error('Failed to retrieve read replica configurations');
    }
  }

  /**
   * Get active and healthy replicas
   */
  async getActiveHealthyReplicas(): Promise<ReadReplicaConfiguration[]> {
    return this.getReadReplicaConfigurations({ isActive: true, isHealthy: true });
  }

  /**
   * Get primary replica
   */
  async getPrimaryReplica(): Promise<ReadReplicaConfiguration | null> {
    try {
      const replicas = await this.prisma.$queryRaw`
        SELECT 
          id, replica_name, replica_type, host, port, database_name,
          max_connections, connection_timeout_seconds, query_timeout_seconds,
          is_primary, is_active, priority, weight, max_load_percentage,
          health_check_interval_seconds, last_health_check_at, is_healthy,
          region, availability_zone, tags, created_at, updated_at
        FROM read_replica_configurations 
        WHERE is_primary = true
        LIMIT 1
      ` as any[];

      if (replicas.length === 0) {
        return null;
      }

      const replica = replicas[0];
      return {
        ...replica,
        tags: typeof replica.tags === 'string' 
          ? JSON.parse(replica.tags) 
          : replica.tags
      };
    } catch (error) {
      console.error('Error getting primary replica:', error);
      throw new Error('Failed to retrieve primary replica');
    }
  }

  /**
   * Update read replica configuration
   */
  async updateReadReplicaConfiguration(
    replicaId: string, 
    updates: Partial<ReadReplicaRequest>
  ): Promise<ReadReplicaConfiguration> {
    try {
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (updates.replicaName !== undefined) {
        updateFields.push(`replica_name = $${paramIndex++}`);
        params.push(updates.replicaName);
      }

      if (updates.replicaType !== undefined) {
        updateFields.push(`replica_type = $${paramIndex++}`);
        params.push(updates.replicaType);
      }

      if (updates.host !== undefined) {
        updateFields.push(`host = $${paramIndex++}`);
        params.push(updates.host);
      }

      if (updates.port !== undefined) {
        updateFields.push(`port = $${paramIndex++}`);
        params.push(updates.port);
      }

      if (updates.databaseName !== undefined) {
        updateFields.push(`database_name = $${paramIndex++}`);
        params.push(updates.databaseName);
      }

      if (updates.maxConnections !== undefined) {
        updateFields.push(`max_connections = $${paramIndex++}`);
        params.push(updates.maxConnections);
      }

      if (updates.connectionTimeoutSeconds !== undefined) {
        updateFields.push(`connection_timeout_seconds = $${paramIndex++}`);
        params.push(updates.connectionTimeoutSeconds);
      }

      if (updates.queryTimeoutSeconds !== undefined) {
        updateFields.push(`query_timeout_seconds = $${paramIndex++}`);
        params.push(updates.queryTimeoutSeconds);
      }

      if (updates.isPrimary !== undefined) {
        updateFields.push(`is_primary = $${paramIndex++}`);
        params.push(updates.isPrimary);
      }

      if (updates.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        params.push(updates.isActive);
      }

      if (updates.priority !== undefined) {
        updateFields.push(`priority = $${paramIndex++}`);
        params.push(updates.priority);
      }

      if (updates.weight !== undefined) {
        updateFields.push(`weight = $${paramIndex++}`);
        params.push(updates.weight);
      }

      if (updates.maxLoadPercentage !== undefined) {
        updateFields.push(`max_load_percentage = $${paramIndex++}`);
        params.push(updates.maxLoadPercentage);
      }

      if (updates.healthCheckIntervalSeconds !== undefined) {
        updateFields.push(`health_check_interval_seconds = $${paramIndex++}`);
        params.push(updates.healthCheckIntervalSeconds);
      }

      if (updates.region !== undefined) {
        updateFields.push(`region = $${paramIndex++}`);
        params.push(updates.region);
      }

      if (updates.availabilityZone !== undefined) {
        updateFields.push(`availability_zone = $${paramIndex++}`);
        params.push(updates.availabilityZone);
      }

      if (updates.tags !== undefined) {
        updateFields.push(`tags = $${paramIndex++}`);
        params.push(JSON.stringify(updates.tags));
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      params.push(replicaId);

      await this.prisma.$queryRawUnsafe(`
        UPDATE read_replica_configurations 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
      `, ...params);

      const replica = await this.getReadReplicaById(replicaId);
      return replica;
    } catch (error) {
      console.error('Error updating read replica configuration:', error);
      throw new Error('Failed to update read replica configuration');
    }
  }

  /**
   * Activate read replica
   */
  async activateReadReplica(replicaId: string): Promise<void> {
    try {
      await this.prisma.$queryRaw`
        UPDATE read_replica_configurations 
        SET is_active = true, updated_at = NOW()
        WHERE id = ${replicaId}
      `;
    } catch (error) {
      console.error('Error activating read replica:', error);
      throw new Error('Failed to activate read replica');
    }
  }

  /**
   * Deactivate read replica
   */
  async deactivateReadReplica(replicaId: string): Promise<void> {
    try {
      await this.prisma.$queryRaw`
        UPDATE read_replica_configurations 
        SET is_active = false, updated_at = NOW()
        WHERE id = ${replicaId}
      `;
    } catch (error) {
      console.error('Error deactivating read replica:', error);
      throw new Error('Failed to deactivate read replica');
    }
  }

  /**
   * Update replica health status
   */
  async updateReplicaHealthStatus(replicaId: string, isHealthy: boolean): Promise<void> {
    try {
      await this.prisma.$queryRaw`
        UPDATE read_replica_configurations 
        SET 
          is_healthy = ${isHealthy},
          last_health_check_at = NOW(),
          updated_at = NOW()
        WHERE id = ${replicaId}
      `;
    } catch (error) {
      console.error('Error updating replica health status:', error);
      throw new Error('Failed to update replica health status');
    }
  }

  /**
   * Create query routing rule
   */
  async createQueryRoutingRule(request: QueryRoutingRuleRequest): Promise<QueryRoutingRule> {
    try {
      const validated = QueryRoutingRuleRequestSchema.parse(request);

      const result = await this.prisma.$queryRaw`
        INSERT INTO query_routing_rules (
          rule_name, query_pattern, query_type, target_replica_id,
          fallback_to_primary, conditions, max_execution_time_ms,
          priority, is_active, created_at, updated_at
        ) VALUES (
          ${validated.ruleName},
          ${validated.queryPattern},
          ${validated.queryType},
          ${validated.targetReplicaId},
          ${validated.fallbackToPrimary || true},
          ${JSON.stringify(validated.conditions || {})},
          ${validated.maxExecutionTimeMs || null},
          ${validated.priority || 0},
          true,
          NOW(),
          NOW()
        )
        RETURNING id, rule_name, query_type, created_at, updated_at
      ` as any[];

      const rule = await this.getQueryRoutingRuleById(result[0].id);
      return rule;
    } catch (error) {
      console.error('Error creating query routing rule:', error);
      throw new Error('Failed to create query routing rule');
    }
  }

  /**
   * Get query routing rule by ID
   */
  async getQueryRoutingRuleById(ruleId: string): Promise<QueryRoutingRule> {
    try {
      const rules = await this.prisma.$queryRaw`
        SELECT 
          id, rule_name, query_pattern, query_type, target_replica_id,
          fallback_to_primary, conditions, max_execution_time_ms,
          priority, is_active, created_at, updated_at
        FROM query_routing_rules 
        WHERE id = ${ruleId}
      ` as any[];

      if (rules.length === 0) {
        throw new Error('Query routing rule not found');
      }

      const rule = rules[0];
      return {
        ...rule,
        conditions: typeof rule.conditions === 'string' 
          ? JSON.parse(rule.conditions) 
          : rule.conditions
      };
    } catch (error) {
      console.error('Error getting query routing rule:', error);
      throw new Error('Failed to retrieve query routing rule');
    }
  }

  /**
   * Get query routing rules
   */
  async getQueryRoutingRules(filters: {
    queryType?: string;
    isActive?: boolean;
    targetReplicaId?: string;
    limit?: number;
  } = {}): Promise<QueryRoutingRule[]> {
    try {
      let query = `
        SELECT 
          id, rule_name, query_pattern, query_type, target_replica_id,
          fallback_to_primary, conditions, max_execution_time_ms,
          priority, is_active, created_at, updated_at
        FROM query_routing_rules
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (filters.queryType) {
        query += ` AND query_type = $${paramIndex++}`;
        params.push(filters.queryType);
      }

      if (filters.isActive !== undefined) {
        query += ` AND is_active = $${paramIndex++}`;
        params.push(filters.isActive);
      }

      if (filters.targetReplicaId) {
        query += ` AND target_replica_id = $${paramIndex++}`;
        params.push(filters.targetReplicaId);
      }

      query += ` ORDER BY priority DESC, rule_name ASC`;

      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      const rules = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      return rules.map(rule => ({
        ...rule,
        conditions: typeof rule.conditions === 'string' 
          ? JSON.parse(rule.conditions) 
          : rule.conditions
      }));
    } catch (error) {
      console.error('Error getting query routing rules:', error);
      throw new Error('Failed to retrieve query routing rules');
    }
  }

  /**
   * Get active query routing rules
   */
  async getActiveQueryRoutingRules(): Promise<QueryRoutingRule[]> {
    return this.getQueryRoutingRules({ isActive: true });
  }

  /**
   * Update query routing rule
   */
  async updateQueryRoutingRule(
    ruleId: string, 
    updates: Partial<QueryRoutingRuleRequest>
  ): Promise<QueryRoutingRule> {
    try {
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (updates.ruleName !== undefined) {
        updateFields.push(`rule_name = $${paramIndex++}`);
        params.push(updates.ruleName);
      }

      if (updates.queryPattern !== undefined) {
        updateFields.push(`query_pattern = $${paramIndex++}`);
        params.push(updates.queryPattern);
      }

      if (updates.queryType !== undefined) {
        updateFields.push(`query_type = $${paramIndex++}`);
        params.push(updates.queryType);
      }

      if (updates.targetReplicaId !== undefined) {
        updateFields.push(`target_replica_id = $${paramIndex++}`);
        params.push(updates.targetReplicaId);
      }

      if (updates.fallbackToPrimary !== undefined) {
        updateFields.push(`fallback_to_primary = $${paramIndex++}`);
        params.push(updates.fallbackToPrimary);
      }

      if (updates.conditions !== undefined) {
        updateFields.push(`conditions = $${paramIndex++}`);
        params.push(JSON.stringify(updates.conditions));
      }

      if (updates.maxExecutionTimeMs !== undefined) {
        updateFields.push(`max_execution_time_ms = $${paramIndex++}`);
        params.push(updates.maxExecutionTimeMs);
      }

      if (updates.priority !== undefined) {
        updateFields.push(`priority = $${paramIndex++}`);
        params.push(updates.priority);
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      params.push(ruleId);

      await this.prisma.$queryRawUnsafe(`
        UPDATE query_routing_rules 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
      `, ...params);

      const rule = await this.getQueryRoutingRuleById(ruleId);
      return rule;
    } catch (error) {
      console.error('Error updating query routing rule:', error);
      throw new Error('Failed to update query routing rule');
    }
  }

  /**
   * Activate query routing rule
   */
  async activateQueryRoutingRule(ruleId: string): Promise<void> {
    try {
      await this.prisma.$queryRaw`
        UPDATE query_routing_rules 
        SET is_active = true, updated_at = NOW()
        WHERE id = ${ruleId}
      `;
    } catch (error) {
      console.error('Error activating query routing rule:', error);
      throw new Error('Failed to activate query routing rule');
    }
  }

  /**
   * Deactivate query routing rule
   */
  async deactivateQueryRoutingRule(ruleId: string): Promise<void> {
    try {
      await this.prisma.$queryRaw`
        UPDATE query_routing_rules 
        SET is_active = false, updated_at = NOW()
        WHERE id = ${ruleId}
      `;
    } catch (error) {
      console.error('Error deactivating query routing rule:', error);
      throw new Error('Failed to deactivate query routing rule');
    }
  }

  /**
   * Route query to replica
   */
  async routeQueryToReplica(
    queryText: string,
    queryType: string,
    userId?: string,
    businessAccountId?: string
  ): Promise<QueryRoutingResult> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT * FROM route_query_to_replica(
          ${queryText},
          ${queryType},
          ${userId || null},
          ${businessAccountId || null}
        )
      ` as any[];

      return result[0];
    } catch (error) {
      console.error('Error routing query to replica:', error);
      throw new Error('Failed to route query to replica');
    }
  }

  /**
   * Perform health check on replica
   */
  async performHealthCheck(replicaId: string): Promise<boolean> {
    try {
      // In a real implementation, this would actually connect to the replica
      // and perform a health check query. For now, we'll simulate it.
      
      const replica = await this.getReadReplicaById(replicaId);
      
      // Simulate health check with random success/failure
      const isHealthy = Math.random() > 0.1; // 90% success rate
      
      await this.updateReplicaHealthStatus(replicaId, isHealthy);
      
      return isHealthy;
    } catch (error) {
      console.error('Error performing health check:', error);
      await this.updateReplicaHealthStatus(replicaId, false);
      return false;
    }
  }

  /**
   * Perform health checks on all replicas
   */
  async performHealthChecks(): Promise<{ [replicaId: string]: boolean }> {
    try {
      const replicas = await this.getReadReplicaConfigurations({ isActive: true });
      const results: { [replicaId: string]: boolean } = {};

      for (const replica of replicas) {
        results[replica.id] = await this.performHealthCheck(replica.id);
      }

      return results;
    } catch (error) {
      console.error('Error performing health checks:', error);
      throw new Error('Failed to perform health checks');
    }
  }

  /**
   * Get replica load statistics
   */
  async getReplicaLoadStatistics(): Promise<any[]> {
    try {
      const stats = await this.prisma.$queryRaw`
        SELECT 
          rrc.id, rrc.replica_name, rrc.replica_type,
          rrc.is_active, rrc.is_healthy, rrc.max_load_percentage,
          COALESCE(qpl.query_count, 0) as query_count,
          COALESCE(qpl.avg_execution_time_ms, 0) as avg_execution_time_ms,
          COALESCE(qpl.last_query_at, rrc.created_at) as last_activity_at
        FROM read_replica_configurations rrc
        LEFT JOIN (
          SELECT 
            used_replica_id,
            COUNT(*) as query_count,
            AVG(execution_time_ms) as avg_execution_time_ms,
            MAX(timestamp) as last_query_at
          FROM query_performance_log
          WHERE timestamp >= CURRENT_DATE - INTERVAL '1 hour'
          GROUP BY used_replica_id
        ) qpl ON rrc.id = qpl.used_replica_id
        ORDER BY rrc.priority ASC, rrc.replica_name ASC
      ` as any[];

      return stats;
    } catch (error) {
      console.error('Error getting replica load statistics:', error);
      throw new Error('Failed to retrieve replica load statistics');
    }
  }

  /**
   * Delete read replica configuration
   */
  async deleteReadReplicaConfiguration(replicaId: string): Promise<void> {
    try {
      await this.prisma.$queryRaw`DELETE FROM read_replica_configurations WHERE id = ${replicaId}`;
    } catch (error) {
      console.error('Error deleting read replica configuration:', error);
      throw new Error('Failed to delete read replica configuration');
    }
  }

  /**
   * Delete query routing rule
   */
  async deleteQueryRoutingRule(ruleId: string): Promise<void> {
    try {
      await this.prisma.$queryRaw`DELETE FROM query_routing_rules WHERE id = ${ruleId}`;
    } catch (error) {
      console.error('Error deleting query routing rule:', error);
      throw new Error('Failed to delete query routing rule');
    }
  }

  /**
   * Search read replicas
   */
  async searchReadReplicas(searchTerm: string): Promise<ReadReplicaConfiguration[]> {
    try {
      const replicas = await this.prisma.$queryRaw`
        SELECT 
          id, replica_name, replica_type, host, port, database_name,
          max_connections, connection_timeout_seconds, query_timeout_seconds,
          is_primary, is_active, priority, weight, max_load_percentage,
          health_check_interval_seconds, last_health_check_at, is_healthy,
          region, availability_zone, tags, created_at, updated_at
        FROM read_replica_configurations 
        WHERE 
          replica_name ILIKE ${'%' + searchTerm + '%'}
          OR host ILIKE ${'%' + searchTerm + '%'}
          OR database_name ILIKE ${'%' + searchTerm + '%'}
        ORDER BY priority ASC, replica_name ASC
      ` as any[];

      return replicas.map(replica => ({
        ...replica,
        tags: typeof replica.tags === 'string' 
          ? JSON.parse(replica.tags) 
          : replica.tags
      }));
    } catch (error) {
      console.error('Error searching read replicas:', error);
      throw new Error('Failed to search read replicas');
    }
  }

  /**
   * Search query routing rules
   */
  async searchQueryRoutingRules(searchTerm: string): Promise<QueryRoutingRule[]> {
    try {
      const rules = await this.prisma.$queryRaw`
        SELECT 
          id, rule_name, query_pattern, query_type, target_replica_id,
          fallback_to_primary, conditions, max_execution_time_ms,
          priority, is_active, created_at, updated_at
        FROM query_routing_rules 
        WHERE 
          rule_name ILIKE ${'%' + searchTerm + '%'}
          OR query_pattern ILIKE ${'%' + searchTerm + '%'}
        ORDER BY priority DESC, rule_name ASC
      ` as any[];

      return rules.map(rule => ({
        ...rule,
        conditions: typeof rule.conditions === 'string' 
          ? JSON.parse(rule.conditions) 
          : rule.conditions
      }));
    } catch (error) {
      console.error('Error searching query routing rules:', error);
      throw new Error('Failed to search query routing rules');
    }
  }
}
