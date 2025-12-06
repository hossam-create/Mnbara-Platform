import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.pool = new Pool({
      connectionString: this.configService.get<string>('DATABASE_URL'),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    try {
      const client = await this.pool.connect();
      console.log('✅ Database connected successfully');
      client.release();
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
    console.log('Database connection closed');
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries (> 100ms)
      if (duration > 100) {
        console.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error.message);
      console.error('Query:', text);
      throw error;
    }
  }

  async getClient() {
    return this.pool.connect();
  }

  // Helper methods for common operations
  async findOne<T = any>(table: string, conditions: Record<string, any>): Promise<T | null> {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    
    const query = `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`;
    const result = await this.query<T>(query, values);
    
    return result.rows[0] || null;
  }

  async findMany<T = any>(
    table: string,
    conditions?: Record<string, any>,
    options?: { limit?: number; offset?: number; orderBy?: string }
  ): Promise<T[]> {
    let query = `SELECT * FROM ${table}`;
    const values: any[] = [];
    
    if (conditions && Object.keys(conditions).length > 0) {
      const keys = Object.keys(conditions);
      const whereClause = keys.map((key, i) => {
        values.push(conditions[key]);
        return `${key} = $${i + 1}`;
      }).join(' AND ');
      query += ` WHERE ${whereClause}`;
    }
    
    if (options?.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
    }
    
    if (options?.limit) {
      query += ` LIMIT ${options.limit}`;
    }
    
    if (options?.offset) {
      query += ` OFFSET ${options.offset}`;
    }
    
    const result = await this.query<T>(query, values);
    return result.rows;
  }

  async count(table: string, conditions?: Record<string, any>): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${table}`;
    const values: any[] = [];
    
    if (conditions && Object.keys(conditions).length > 0) {
      const keys = Object.keys(conditions);
      const whereClause = keys.map((key, i) => {
        values.push(conditions[key]);
        return `${key} = $${i + 1}`;
      }).join(' AND ');
      query += ` WHERE ${whereClause}`;
    }
    
    const result = await this.query<{ count: string }>(query, values);
    return parseInt(result.rows[0].count, 10);
  }

  async insert<T = any>(table: string, data: Record<string, any>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.query<T>(query, values);
    return result.rows[0];
  }

  async update<T = any>(
    table: string,
    conditions: Record<string, any>,
    data: Record<string, any>
  ): Promise<T[]> {
    const dataKeys = Object.keys(data);
    const dataValues = Object.values(data);
    const conditionKeys = Object.keys(conditions);
    const conditionValues = Object.values(conditions);
    
    const setClause = dataKeys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const whereClause = conditionKeys.map((key, i) => 
      `${key} = $${dataKeys.length + i + 1}`
    ).join(' AND ');
    
    const query = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${whereClause}
      RETURNING *
    `;
    
    const result = await this.query<T>(query, [...dataValues, ...conditionValues]);
    return result.rows;
  }

  async delete(table: string, conditions: Record<string, any>): Promise<number> {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    
    const query = `DELETE FROM ${table} WHERE ${whereClause}`;
    const result = await this.query(query, values);
    
    return result.rowCount || 0;
  }
}
