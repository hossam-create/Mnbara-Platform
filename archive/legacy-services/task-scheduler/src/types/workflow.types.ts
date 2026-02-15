// Workflow Types - Inspired by xyOps Workflows

export interface Workflow {
  id: string;
  title: string;
  description?: string;
  enabled: boolean;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  x: number;  // Position on canvas
  y: number;
  data: NodeData;
}

export enum NodeType {
  TRIGGER = 'trigger',
  TASK = 'task',
  CONTROLLER = 'controller',
  ACTION = 'action'
}

export interface NodeData {
  // Common
  title?: string;
  
  // Trigger node
  trigger?: {
    type: 'manual' | 'schedule' | 'webhook';
    schedule?: {
      hours?: number[];
      minutes?: number[];
    };
  };
  
  // Task node
  task?: {
    plugin: string;
    params: Record<string, any>;
  };
  
  // Controller node
  controller?: {
    type: 'split' | 'join' | 'repeat' | 'decision' | 'wait';
    // Split
    splitPath?: string;  // e.g., 'data.items'
    // Repeat
    repeatCount?: number;
    // Decision
    condition?: string;  // JEXL expression
    // Wait
    waitDuration?: number;  // seconds
  };
  
  // Action node
  action?: {
    type: 'email' | 'webhook' | 'notification';
    params: Record<string, any>;
  };
}

export interface WorkflowConnection {
  id: string;
  source: string;  // Node ID
  dest: string;    // Node ID
  condition?: ConnectionCondition;
}

export enum ConnectionCondition {
  ALWAYS = 'always',
  SUCCESS = 'success',
  ERROR = 'error',
  CONTINUE = 'continue'
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  result?: any;
  error?: string;
  subJobs: string[];  // Task execution IDs
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

// DTOs
export interface CreateWorkflowDto {
  title: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  enabled?: boolean;
}

export interface UpdateWorkflowDto {
  title?: string;
  description?: string;
  nodes?: WorkflowNode[];
  connections?: WorkflowConnection[];
  enabled?: boolean;
}

export interface RunWorkflowDto {
  workflowId: string;
  input?: any;  // Initial input data
}
