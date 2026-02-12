import { Request, Response, NextFunction } from 'express';
import { PluginHealthMonitor } from '../monitoring/PluginHealthMonitor';
import { logger } from '../utils/logger';

export class PluginHealthMiddleware {
  private healthMonitor: PluginHealthMonitor;

  constructor(healthMonitor: PluginHealthMonitor) {
    this.healthMonitor = healthMonitor;
  }

  // Middleware to track plugin hook execution
  trackHookExecution(pluginName: string, hookName: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      try {
        // Record that hook execution started
        logger.debug(`Plugin hook started: ${pluginName}.${hookName}`);
        
        // Store tracking info in request for later use
        req.pluginTracking = {
          pluginName,
          hookName,
          startTime,
        };

        next();
      } catch (error) {
        const executionTime = Date.now() - startTime;
        this.healthMonitor.recordHookExecution(pluginName, hookName, false, executionTime);
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.healthMonitor.recordError(pluginName, errorMessage);
        
        logger.error(`Plugin hook failed: ${pluginName}.${hookName}`, { error });
        next(error);
      }
    };
  }

  // Middleware to complete hook execution tracking
  completeHookTracking() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.pluginTracking) {
        return next();
      }

      const { pluginName, hookName, startTime } = req.pluginTracking;
      const executionTime = Date.now() - startTime;
      const success = res.statusCode >= 200 && res.statusCode < 400;

      // Record hook execution
      this.healthMonitor.recordHookExecution(pluginName, hookName, success, executionTime);

      if (!success) {
        this.healthMonitor.recordError(pluginName, `Hook failed with status ${res.statusCode}`);
      }

      logger.debug(`Plugin hook completed: ${pluginName}.${hookName} (${executionTime}ms)`);
      next();
    };
  }

  // Middleware to track plugin API requests
  trackApiRequests(pluginName: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      // Override res.send to capture response
      const originalSend = res.send;
      const self = this;
      res.send = function(data: any) {
        const responseTime = Date.now() - startTime;
        const success = res.statusCode >= 200 && res.statusCode < 400;

        // Record API request
        self.healthMonitor.recordApiRequest(pluginName, success, responseTime);

        if (!success) {
          self.healthMonitor.recordError(pluginName, `API request failed with status ${res.statusCode}`);
        }

        logger.debug(`Plugin API request: ${pluginName} ${req.method} ${req.path} (${responseTime}ms)`);
        
        return originalSend.call(this, data);
      };

      next();
    };
  }

  // Middleware to collect resource usage
  collectResourceUsage(pluginName: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Get memory usage
        const memoryUsage = process.memoryUsage().heapUsed;
        
        // Get CPU usage (simplified)
        const cpuUsage = this.getCpuUsage();

        // Record resource usage
        this.healthMonitor.recordResourceUsage(pluginName, memoryUsage, cpuUsage);

        next();
      } catch (error) {
        logger.error('Failed to collect resource usage', { error });
        next();
      }
    };
  }

  // Middleware to send heartbeat
  sendHeartbeat(pluginName: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        this.healthMonitor.recordHeartbeat(pluginName);
        next();
      } catch (error) {
        logger.error('Failed to send heartbeat', { error });
        next();
      }
    };
  }

  // Middleware to handle plugin errors
  handlePluginErrors(pluginName: string) {
    return (error: any, req: Request, res: Response, next: NextFunction) => {
      try {
        const errorMessage = error.message || 'Unknown error';
        const severity = error.severity || 'error';

        this.healthMonitor.recordError(pluginName, errorMessage, severity);

        // Log the error
        logger.error(`Plugin error: ${pluginName}`, { error });

        next(error);
      } catch (monitoringError) {
        logger.error('Failed to handle plugin error', { monitoringError, originalError: error });
        next(error);
      }
    };
  }

  private getCpuUsage(): number {
    // Simplified CPU usage calculation
    // In a real implementation, you might want to use more sophisticated methods
    const cpuUsage = process.cpuUsage();
    const totalUsage = cpuUsage.user + cpuUsage.system;
    
    // This is a simplified calculation - in production you'd want more accurate metrics
    return Math.min(100, (totalUsage / 1000000) * 10); // Rough estimate
  }
}

// Extend Express Request interface to include plugin tracking
declare global {
  namespace Express {
    interface Request {
      pluginTracking?: {
        pluginName: string;
        hookName: string;
        startTime: number;
      };
    }
  }
}

export const createHealthMiddleware = (healthMonitor: PluginHealthMonitor) => {
  return new PluginHealthMiddleware(healthMonitor);
};