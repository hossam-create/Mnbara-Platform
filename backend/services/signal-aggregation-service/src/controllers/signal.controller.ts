import { Request, Response } from 'express';
import { SignalAggregatorService } from '../services/signal-aggregator.service';
import { TimeBucket } from '../types/signal.types';
import { Logger } from '../utils/logger';

export class SignalController {
  private aggregator: SignalAggregatorService;
  private logger: Logger;

  constructor() {
    this.aggregator = new SignalAggregatorService();
    this.logger = new Logger('SignalController');
  }

  // READ-ONLY endpoint: Get signals for specific corridor and time bucket
  public async getSignals(req: Request, res: Response): Promise<void> {
    try {
      const { corridor, timeBucket } = req.params;
      const { start, end } = req.query;
      
      // Validate time bucket
      if (timeBucket !== 'hour' && timeBucket !== 'day') {
        res.status(400).json({ 
          error: 'Invalid time bucket. Must be "hour" or "day"' 
        });
        return;
      }

      // Parse dates (with validation)
      const startDate = start ? new Date(start as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = end ? new Date(end as string) : new Date();

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({ 
          error: 'Invalid date format. Use ISO 8601 format' 
        });
        return;
      }

      const bucket: TimeBucket = {
        start: startDate,
        end: endDate,
        bucketType: timeBucket as 'hour' | 'day'
      };

      this.logger.info(`Fetching signals for corridor: ${corridor}, bucket: ${timeBucket}`);
      
      // Read-only aggregation
      const signals = await this.aggregator.aggregateSignals(bucket, corridor);
      
      res.json({
        success: true,
        data: signals,
        metadata: {
          generatedAt: new Date().toISOString(),
          timeRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          }
        }
      });

    } catch (error) {
      this.logger.error('Error fetching signals', { error });
      res.status(500).json({ 
        error: 'Internal server error during signal aggregation' 
      });
    }
  }

  // READ-ONLY endpoint: Get current thresholds (for transparency)
  public getThresholds(req: Request, res: Response): void {
    try {
      const thresholds = this.aggregator.getThresholds();
      
      res.json({
        success: true,
        data: thresholds,
        metadata: {
          generatedAt: new Date().toISOString(),
          note: 'These thresholds are advisory only and do not trigger automated actions'
        }
      });

    } catch (error) {
      this.logger.error('Error fetching thresholds', { error });
      res.status(500).json({ 
        error: 'Internal server error fetching thresholds' 
      });
    }
  }

  // READ-ONLY endpoint: Health check
  public healthCheck(req: Request, res: Response): void {
    res.json({
      status: 'healthy',
      service: 'signal-aggregation-service',
      timestamp: new Date().toISOString(),
      capabilities: [
        'read-only signal aggregation',
        'advisory status reporting',
        'no automated enforcement'
      ]
    });
  }

  // READ-ONLY endpoint: Service information
  public getServiceInfo(req: Request, res: Response): void {
    res.json({
      name: 'Signal Aggregation Service',
      version: '1.0.0',
      description: 'Read-only monitoring service for post-launch signal aggregation',
      constraints: [
        'No automated actions',
        'No scoring mutation',
        'No ranking changes',
        'Deterministic outputs only',
        'Advisory analytics only',
        'Full audit trace maintained'
      ],
      signalsTracked: [
        'Intent volume per corridor',
        'Drop-off points analysis',
        'Trust friction indicators',
        'Confirmation abandonment rate',
        'Manual override frequency'
      ]
    });
  }
}