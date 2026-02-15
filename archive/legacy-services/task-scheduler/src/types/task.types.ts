// Task Scheduler Types - Inspired by xyOps

export interface Task {
  id: string;
  title: string;
  description?: string;
  plugin: string;
  params: Record<string, any>;
  enabled: boolean;
  triggers: Trigger[];
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trigger {
  type: 'manual' | 'schedule' | 'interval' | 'webhook';
  enabled: boolean;
  
  // Schedule (Cron-like)
  hours?: number[];      // 0-23
  minutes?: number[];    // 0-59
  days?: number[];       // 1-31
  months?: number[];     // 1-12
  weekdays?: number[];   // 0-6 (0 = Sunday)
  
  // Interval
  interval?: number;     // minutes
  
  // Webhook
  webhookUrl?: string;
  webhookSecret?: string;
}

export interface TaskExecution {
  id: string;
  taskId: string;
  status: ExecutionStatus;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  result?: any;
  error?: string;
  logs?: string;
  triggeredBy?: string;
  createdAt: Date;
}

export enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  ABORTED = 'ABORTED'
}

export interface Plugin {
  name: string;
  description: string;
  execute: (params: any, context: ExecutionContext) => Promise<PluginResult>;
}

export interface ExecutionContext {
  taskId: string;
  executionId: string;
  triggeredBy: string;
  logger: Logger;
}

export interface PluginResult {
  success: boolean;
  data?: any;
  error?: string;
  logs?: string[];
}

export interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
}

// DTOs
export interface CreateTaskDto {
  title: string;
  description?: string;
  plugin: string;
  params: Record<string, any>;
  triggers: Trigger[];
  enabled?: boolean;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  params?: Record<string, any>;
  triggers?: Trigger[];
  enabled?: boolean;
}

export interface RunTaskDto {
  taskId: string;
  params?: Record<string, any>;  // Override params
}
