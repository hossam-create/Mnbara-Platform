import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Types for Async Job Service
export interface AsyncJob {
  id: string;
  jobType: string;
  jobCategory: string;
  payload: any;
  parameters: any;
  priority: number;
  scheduledAt: Date;
  maxAttempts: number;
  timeoutSeconds: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  attempts: number;
  lastAttemptAt?: Date;
  completedAt?: Date;
  result?: any;
  errorMessage?: string;
  errorDetails?: any;
  startedAt?: Date;
  durationSeconds?: number;
  createdBy?: string;
  businessAccountId?: string;
  correlationId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AsyncJobRequest {
  jobType: string;
  jobCategory: string;
  payload?: any;
  parameters?: any;
  priority?: number;
  scheduledAt?: Date;
  maxAttempts?: number;
  timeoutSeconds?: number;
  businessAccountId?: string;
  correlationId?: string;
  tags?: string[];
}

export interface HeavyReportJobRequest {
  reportType: string;
  businessAccountId: string;
  periodId?: string;
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  reportFormat?: string;
  includeCharts?: boolean;
  includeNarratives?: boolean;
  includeComparisons?: boolean;
  language?: string;
  priority?: number;
}

export interface AsyncJobDependency {
  id: string;
  jobId: string;
  dependsOnJobId: string;
  dependencyType: 'SUCCESS' | 'COMPLETION' | 'FAILURE';
  createdAt: Date;
}

export interface JobProcessingResult {
  success: boolean;
  result?: any;
  error?: string;
  durationMs: number;
}

// Validation schemas
const AsyncJobRequestSchema = z.object({
  jobType: z.string().min(1).max(100),
  jobCategory: z.string().min(1).max(50),
  payload: z.any().optional(),
  parameters: z.any().optional(),
  priority: z.number().optional(),
  scheduledAt: z.date().optional(),
  maxAttempts: z.number().min(1).max(10).optional(),
  timeoutSeconds: z.number().min(1).max(3600).optional(),
  businessAccountId: z.string().uuid().optional(),
  correlationId: z.string().optional(),
  tags: z.array(z.string()).optional()
});

const HeavyReportJobRequestSchema = z.object({
  reportType: z.string().min(1).max(100),
  businessAccountId: z.string().uuid(),
  periodId: z.string().uuid().optional(),
  dateRangeStart: z.date().optional(),
  dateRangeEnd: z.date().optional(),
  reportFormat: z.enum(['JSON', 'PDF', 'EXCEL', 'CSV']).optional(),
  includeCharts: z.boolean().optional(),
  includeNarratives: z.boolean().optional(),
  includeComparisons: z.boolean().optional(),
  language: z.string().optional(),
  priority: z.number().optional()
});

export class AsyncJobService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create async job
   */
  async createAsyncJob(request: AsyncJobRequest, createdBy?: string): Promise<AsyncJob> {
    try {
      const validated = AsyncJobRequestSchema.parse(request);

      const jobId = await this.prisma.$queryRaw`
        SELECT create_async_job(
          ${validated.jobType},
          ${validated.jobCategory},
          ${JSON.stringify(validated.payload || {})},
          ${JSON.stringify(validated.parameters || {})},
          ${validated.priority || 0},
          ${validated.scheduledAt || new Date()},
          ${validated.businessAccountId || null},
          ${createdBy || null},
          ${validated.correlationId || null}
        ) as job_id
      ` as any[];

      const job = await this.getAsyncJobById(jobId[0].job_id);
      return job;
    } catch (error) {
      console.error('Error creating async job:', error);
      throw new Error('Failed to create async job');
    }
  }

  /**
   * Create heavy report job
   */
  async createHeavyReportJob(request: HeavyReportJobRequest, createdBy?: string): Promise<AsyncJob> {
    try {
      const validated = HeavyReportJobRequestSchema.parse(request);

      const jobId = await this.prisma.$queryRaw`
        SELECT create_heavy_report_job(
          ${validated.reportType},
          ${validated.businessAccountId},
          ${validated.periodId || null},
          ${validated.dateRangeStart || null},
          ${validated.dateRangeEnd || null},
          ${validated.reportFormat || 'JSON'},
          ${validated.includeCharts || false},
          ${validated.includeNarratives || false},
          ${validated.includeComparisons || false},
          ${validated.language || 'en'},
          ${validated.priority || 0},
          ${createdBy || null}
        ) as job_id
      ` as any[];

      const job = await this.getAsyncJobById(jobId[0].job_id);
      return job;
    } catch (error) {
      console.error('Error creating heavy report job:', error);
      throw new Error('Failed to create heavy report job');
    }
  }

  /**
   * Get async job by ID
   */
  async getAsyncJobById(jobId: string): Promise<AsyncJob> {
    try {
      const jobs = await this.prisma.$queryRaw`
        SELECT 
          id, job_type, job_category, payload, parameters,
          priority, scheduled_at, max_attempts, timeout_seconds,
          status, attempts, last_attempt_at, completed_at,
          result, error_message, error_details, started_at,
          duration_seconds, created_by, business_account_id,
          correlation_id, tags, created_at, updated_at
        FROM async_jobs 
        WHERE id = ${jobId}
      ` as any[];

      if (jobs.length === 0) {
        throw new Error('Async job not found');
      }

      const job = jobs[0];
      return {
        ...job,
        payload: typeof job.payload === 'string' 
          ? JSON.parse(job.payload) 
          : job.payload,
        parameters: typeof job.parameters === 'string' 
          ? JSON.parse(job.parameters) 
          : job.parameters,
        result: typeof job.result === 'string' 
          ? JSON.parse(job.result) 
          : job.result,
        errorDetails: typeof job.error_details === 'string' 
          ? JSON.parse(job.error_details) 
          : job.error_details,
        tags: typeof job.tags === 'string' 
          ? JSON.parse(job.tags) 
          : job.tags
      };
    } catch (error) {
      console.error('Error getting async job:', error);
      throw new Error('Failed to retrieve async job');
    }
  }

  /**
   * Get async jobs
   */
  async getAsyncJobs(filters: {
    status?: string;
    jobType?: string;
    jobCategory?: string;
    businessAccountId?: string;
    correlationId?: string;
    createdBy?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<AsyncJob[]> {
    try {
      let query = `
        SELECT 
          id, job_type, job_category, payload, parameters,
          priority, scheduled_at, max_attempts, timeout_seconds,
          status, attempts, last_attempt_at, completed_at,
          result, error_message, error_details, started_at,
          duration_seconds, created_by, business_account_id,
          correlation_id, tags, created_at, updated_at
        FROM async_jobs
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (filters.status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(filters.status);
      }

      if (filters.jobType) {
        query += ` AND job_type = $${paramIndex++}`;
        params.push(filters.jobType);
      }

      if (filters.jobCategory) {
        query += ` AND job_category = $${paramIndex++}`;
        params.push(filters.jobCategory);
      }

      if (filters.businessAccountId) {
        query += ` AND business_account_id = $${paramIndex++}`;
        params.push(filters.businessAccountId);
      }

      if (filters.correlationId) {
        query += ` AND correlation_id = $${paramIndex++}`;
        params.push(filters.correlationId);
      }

      if (filters.createdBy) {
        query += ` AND created_by = $${paramIndex++}`;
        params.push(filters.createdBy);
      }

      query += ` ORDER BY priority DESC, created_at DESC`;

      if (filters.offset) {
        query += ` OFFSET $${paramIndex++}`;
        params.push(filters.offset);
      }

      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      const jobs = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      return jobs.map(job => ({
        ...job,
        payload: typeof job.payload === 'string' 
          ? JSON.parse(job.payload) 
          : job.payload,
        parameters: typeof job.parameters === 'string' 
          ? JSON.parse(job.parameters) 
          : job.parameters,
        result: typeof job.result === 'string' 
          ? JSON.parse(job.result) 
          : job.result,
        errorDetails: typeof job.error_details === 'string' 
          ? JSON.parse(job.error_details) 
          : job.error_details,
        tags: typeof job.tags === 'string' 
          ? JSON.parse(job.tags) 
          : job.tags
      }));
    } catch (error) {
      console.error('Error getting async jobs:', error);
      throw new Error('Failed to retrieve async jobs');
    }
  }

  /**
   * Get pending jobs
   */
  async getPendingJobs(limit: number = 50): Promise<AsyncJob[]> {
    return this.getAsyncJobs({ status: 'PENDING', limit });
  }

  /**
   * Get running jobs
   */
  async getRunningJobs(limit: number = 50): Promise<AsyncJob[]> {
    return this.getAsyncJobs({ status: 'RUNNING', limit });
  }

  /**
   * Get jobs by correlation ID
   */
  async getJobsByCorrelationId(correlationId: string): Promise<AsyncJob[]> {
    return this.getAsyncJobs({ correlationId });
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string, 
    status: string, 
    result?: any, 
    errorMessage?: string, 
    errorDetails?: any
  ): Promise<void> {
    try {
      const updateFields: string[] = ['status = $2', 'updated_at = NOW()'];
      const params: any[] = [jobId, status];
      let paramIndex = 3;

      if (result !== undefined) {
        updateFields.push(`result = $${paramIndex++}`);
        params.push(JSON.stringify(result));
      }

      if (errorMessage !== undefined) {
        updateFields.push(`error_message = $${paramIndex++}`);
        params.push(errorMessage);
      }

      if (errorDetails !== undefined) {
        updateFields.push(`error_details = $${paramIndex++}`);
        params.push(JSON.stringify(errorDetails));
      }

      if (status === 'COMPLETED') {
        updateFields.push(`completed_at = NOW()`);
      }

      await this.prisma.$queryRawUnsafe(`
        UPDATE async_jobs 
        SET ${updateFields.join(', ')}
        WHERE id = $1
      `, ...params);
    } catch (error) {
      console.error('Error updating job status:', error);
      throw new Error('Failed to update job status');
    }
  }

  /**
   * Start job processing
   */
  async startJob(jobId: string): Promise<void> {
    try {
      await this.prisma.$queryRaw`
        UPDATE async_jobs 
        SET 
          status = 'RUNNING',
          started_at = NOW(),
          last_attempt_at = NOW(),
          attempts = attempts + 1,
          updated_at = NOW()
        WHERE id = ${jobId}
      `;
    } catch (error) {
      console.error('Error starting job:', error);
      throw new Error('Failed to start job');
    }
  }

  /**
   * Complete job
   */
  async completeJob(jobId: string, result: any): Promise<void> {
    try {
      const job = await this.getAsyncJobById(jobId);
      const duration = job.startedAt 
        ? Math.floor((Date.now() - job.startedAt.getTime()) / 1000)
        : 0;

      await this.prisma.$queryRaw`
        UPDATE async_jobs 
        SET 
          status = 'COMPLETED',
          result = ${JSON.stringify(result)},
          completed_at = NOW(),
          duration_seconds = ${duration},
          updated_at = NOW()
        WHERE id = ${jobId}
      `;
    } catch (error) {
      console.error('Error completing job:', error);
      throw new Error('Failed to complete job');
    }
  }

  /**
   * Fail job
   */
  async failJob(jobId: string, errorMessage: string, errorDetails?: any): Promise<void> {
    try {
      const job = await this.getAsyncJobById(jobId);
      const duration = job.startedAt 
        ? Math.floor((Date.now() - job.startedAt.getTime()) / 1000)
        : 0;

      await this.prisma.$queryRaw`
        UPDATE async_jobs 
        SET 
          status = CASE 
            WHEN attempts >= max_attempts THEN 'FAILED'
            ELSE 'PENDING'
          END,
          error_message = ${errorMessage},
          error_details = ${JSON.stringify(errorDetails || {})},
          duration_seconds = ${duration},
          updated_at = NOW()
        WHERE id = ${jobId}
      `;
    } catch (error) {
      console.error('Error failing job:', error);
      throw new Error('Failed to fail job');
    }
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId: string): Promise<void> {
    try {
      await this.prisma.$queryRaw`
        UPDATE async_jobs 
        SET 
          status = 'CANCELLED',
          completed_at = NOW(),
          updated_at = NOW()
        WHERE id = ${jobId}
      `;
    } catch (error) {
      console.error('Error cancelling job:', error);
      throw new Error('Failed to cancel job');
    }
  }

  /**
   * Create job dependency
   */
  async createJobDependency(
    jobId: string, 
    dependsOnJobId: string, 
    dependencyType: 'SUCCESS' | 'COMPLETION' | 'FAILURE' = 'SUCCESS'
  ): Promise<void> {
    try {
      await this.prisma.$queryRaw`
        INSERT INTO async_job_dependencies (job_id, depends_on_job_id, dependency_type)
        VALUES (${jobId}, ${dependsOnJobId}, ${dependencyType})
      `;
    } catch (error) {
      console.error('Error creating job dependency:', error);
      throw new Error('Failed to create job dependency');
    }
  }

  /**
   * Get job dependencies
   */
  async getJobDependencies(jobId: string): Promise<AsyncJobDependency[]> {
    try {
      const dependencies = await this.prisma.$queryRaw`
        SELECT id, job_id, depends_on_job_id, dependency_type, created_at
        FROM async_job_dependencies
        WHERE job_id = ${jobId}
        ORDER BY created_at ASC
      ` as any[];

      return dependencies;
    } catch (error) {
      console.error('Error getting job dependencies:', error);
      throw new Error('Failed to retrieve job dependencies');
    }
  }

  /**
   * Check if job can run (all dependencies satisfied)
   */
  async canJobRun(jobId: string): Promise<boolean> {
    try {
      const dependencies = await this.getJobDependencies(jobId);
      
      for (const dependency of dependencies) {
        const dependentJob = await this.getAsyncJobById(dependency.dependsOnJobId);
        
        switch (dependency.dependencyType) {
          case 'SUCCESS':
            if (dependentJob.status !== 'COMPLETED') {
              return false;
            }
            break;
          case 'COMPLETION':
            if (!['COMPLETED', 'FAILED', 'CANCELLED'].includes(dependentJob.status)) {
              return false;
            }
            break;
          case 'FAILURE':
            if (dependentJob.status !== 'FAILED') {
              return false;
            }
            break;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking if job can run:', error);
      return false;
    }
  }

  /**
   * Get job performance statistics
   */
  async getJobPerformanceStatistics(filters: {
    jobType?: string;
    jobCategory?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<any[]> {
    try {
      let query = `
        SELECT 
          job_type, job_category, status,
          job_count, avg_duration_seconds, max_duration_seconds,
          avg_attempts, failed_count, failure_rate_percentage,
          last_job_at
        FROM mv_async_job_performance
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (filters.jobType) {
        query += ` AND job_type = $${paramIndex++}`;
        params.push(filters.jobType);
      }

      if (filters.jobCategory) {
        query += ` AND job_category = $${paramIndex++}`;
        params.push(filters.jobCategory);
      }

      query += ` ORDER BY job_count DESC`;

      const stats = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      return stats;
    } catch (error) {
      console.error('Error getting job performance statistics:', error);
      throw new Error('Failed to retrieve job performance statistics');
    }
  }

  /**
   * Get heavy report jobs
   */
  async getHeavyReportJobs(filters: {
    businessAccountId?: string;
    reportType?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    try {
      let query = `
        SELECT 
          aj.id, aj.job_type, aj.status, aj.created_at, aj.completed_at,
          hrj.report_type, hrj.report_format, hrj.business_account_id,
          hrj.period_id, hrj.date_range_start, hrj.date_range_end,
          hrj.include_charts, hrj.include_narratives, hrj.include_comparisons,
          hrj.language, hrj.output_path, hrj.output_size_bytes,
          hrj.download_url, hrj.records_processed, hrj.processing_time_ms
        FROM async_jobs aj
        JOIN heavy_report_jobs hrj ON aj.id = hrj.job_id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (filters.businessAccountId) {
        query += ` AND hrj.business_account_id = $${paramIndex++}`;
        params.push(filters.businessAccountId);
      }

      if (filters.reportType) {
        query += ` AND hrj.report_type = $${paramIndex++}`;
        params.push(filters.reportType);
      }

      if (filters.status) {
        query += ` AND aj.status = $${paramIndex++}`;
        params.push(filters.status);
      }

      query += ` ORDER BY aj.created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      const jobs = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      return jobs;
    } catch (error) {
      console.error('Error getting heavy report jobs:', error);
      throw new Error('Failed to retrieve heavy report jobs');
    }
  }

  /**
   * Process job (template method for job processing)
   */
  async processJob(jobId: string): Promise<JobProcessingResult> {
    const startTime = Date.now();
    
    try {
      const job = await this.getAsyncJobById(jobId);
      
      // Check if job can run (dependencies satisfied)
      if (!(await this.canJobRun(jobId))) {
        return {
          success: false,
          error: 'Job dependencies not satisfied',
          durationMs: Date.now() - startTime
        };
      }

      // Start the job
      await this.startJob(jobId);

      // Process based on job type
      let result: any;
      
      switch (job.jobType) {
        case 'HEAVY_REPORT_GENERATION':
          result = await this.processHeavyReportJob(jobId);
          break;
        case 'DATA_EXPORT':
          result = await this.processDataExportJob(jobId);
          break;
        case 'AI_ANALYSIS':
          result = await this.processAIAnalysisJob(jobId);
          break;
        default:
          throw new Error(`Unknown job type: ${job.jobType}`);
      }

      // Complete the job
      await this.completeJob(jobId, result);

      return {
        success: true,
        result,
        durationMs: Date.now() - startTime
      };
    } catch (error) {
      await this.failJob(jobId, error.message, { stack: error.stack });
      return {
        success: false,
        error: error.message,
        durationMs: Date.now() - startTime
      };
    }
  }

  /**
   * Process heavy report job
   */
  private async processHeavyReportJob(jobId: string): Promise<any> {
    const job = await this.getAsyncJobById(jobId);
    const reportJob = await this.getHeavyReportJobs({ businessAccountId: job.businessAccountId });
    
    // Simulate heavy report processing
    // In real implementation, this would generate actual reports
    const result = {
      reportId: `report_${jobId}`,
      reportType: job.payload.reportType,
      generatedAt: new Date(),
      recordCount: Math.floor(Math.random() * 10000) + 1000,
      downloadUrl: `/api/reports/download/${jobId}`,
      processingTime: Math.floor(Math.random() * 5000) + 1000
    };

    // Update heavy report job record
    await this.prisma.$queryRaw`
      UPDATE heavy_report_jobs 
      SET 
        output_path = ${result.downloadUrl},
        records_processed = ${result.recordCount},
        processing_time_ms = ${result.processingTime}
      WHERE job_id = ${jobId}
    `;

    return result;
  }

  /**
   * Process data export job
   */
  private async processDataExportJob(jobId: string): Promise<any> {
    const job = await this.getAsyncJobById(jobId);
    
    // Simulate data export processing
    const result = {
      exportId: `export_${jobId}`,
      exportType: job.payload.exportType,
      generatedAt: new Date(),
      recordCount: Math.floor(Math.random() * 50000) + 5000,
      downloadUrl: `/api/exports/download/${jobId}`,
      fileSize: Math.floor(Math.random() * 10000000) + 1000000
    };

    return result;
  }

  /**
   * Process AI analysis job
   */
  private async processAIAnalysisJob(jobId: string): Promise<any> {
    const job = await this.getAsyncJobById(jobId);
    
    // Simulate AI analysis processing
    const result = {
      analysisId: `analysis_${jobId}`,
      analysisType: job.payload.analysisType,
      generatedAt: new Date(),
      insights: [
        { type: 'trend', description: 'Revenue trending upward by 15%' },
        { type: 'risk', description: 'High variance in expense categories' },
        { type: 'opportunity', description: 'Potential for cost optimization in operations' }
      ],
      confidence: 0.85,
      processingTime: Math.floor(Math.random() * 3000) + 500
    };

    return result;
  }

  /**
   * Refresh async job performance views
   */
  async refreshAsyncJobViews(): Promise<void> {
    try {
      await this.prisma.$queryRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_async_job_performance`;
    } catch (error) {
      console.error('Error refreshing async job views:', error);
      throw new Error('Failed to refresh async job views');
    }
  }

  /**
   * Delete job
   */
  async deleteJob(jobId: string): Promise<void> {
    try {
      await this.prisma.$queryRaw`DELETE FROM async_jobs WHERE id = ${jobId}`;
    } catch (error) {
      console.error('Error deleting job:', error);
      throw new Error('Failed to delete job');
    }
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId: string): Promise<void> {
    try {
      await this.prisma.$queryRaw`
        UPDATE async_jobs 
        SET 
          status = 'PENDING',
          error_message = NULL,
          error_details = NULL,
          updated_at = NOW()
        WHERE id = ${jobId}
      `;
    } catch (error) {
      console.error('Error retrying job:', error);
      throw new Error('Failed to retry job');
    }
  }
}
