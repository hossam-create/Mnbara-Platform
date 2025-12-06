import { Injectable } from '@nestjs/common';
import * as promClient from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly register: promClient.Registry;
  
  // Counters
  private readonly transactionCounter: promClient.Counter;
  private readonly escrowCounter: promClient.Counter;
  private readonly errorCounter: promClient.Counter;
  
  // Gauges
  private readonly activeEscrowsGauge: promClient.Gauge;
  private readonly totalVolumeGauge: promClient.Gauge;
  private readonly gasPreferenceGauge: promClient.Gauge;
  
  // Histograms
  private readonly transactionDuration: promClient.Histogram;
  private readonly blockTimeHistogram: promClient.Histogram;

  constructor() {
    this.register = new promClient.Registry();
    
    // Set default labels
    this.register.setDefaultLabels({
      app: 'mnbara-blockchain',
      environment: process.env.NODE_ENV || 'development'
    });

    // Enable default metrics
    promClient.collectDefaultMetrics({ register: this.register });

    // Initialize custom metrics
    this.transactionCounter = new promClient.Counter({
      name: 'blockchain_transactions_total',
      help: 'Total number of blockchain transactions',
      labelNames: ['contract', 'method', 'status'],
      registers: [this.register]
    });

    this.escrowCounter = new promClient.Counter({
      name: 'auction_escrow_operations_total',
      help: 'Total number of escrow operations',
      labelNames: ['operation', 'status'],
      registers: [this.register]
    });

    this.errorCounter = new promClient.Counter({
      name: 'blockchain_errors_total',
      help: 'Total number of blockchain errors',
      labelNames: ['contract', 'error_type'],
      registers: [this.register]
    });

    this.activeEscrowsGauge = new promClient.Gauge({
      name: 'auction_escrows_active',
      help: 'Number of active escrows',
      registers: [this.register]
    });

    this.totalVolumeGauge = new promClient.Gauge({
      name: 'auction_escrow_volume_total',
      help: 'Total volume locked in escrows (ETH)',
      registers: [this.register]
    });

    this.gasPreferenceGauge = new promClient.Gauge({
      name: 'blockchain_gas_price_gwei',
      help: 'Current gas price in Gwei',
      registers: [this.register]
    });

    this.transactionDuration = new promClient.Histogram({
      name: 'blockchain_transaction_duration_seconds',
      help: 'Blockchain transaction duration in seconds',
      labelNames: ['contract', 'method'],
      buckets: [0.5, 1, 2, 5, 10, 30, 60],
      registers: [this.register]
    });

    this.blockTimeHistogram = new promClient.Histogram({
      name: 'blockchain_block_time_seconds',
      help: 'Time between blocks in seconds',
      buckets: [1, 2, 3, 5, 10, 15, 30],
      registers: [this.register]
    });
  }

  // Record transaction
  recordTransaction(contract: string, method: string, status: 'success' | 'failure') {
    this.transactionCounter.inc({ contract, method, status });
  }

  // Record escrow operation
  recordEscrowOperation(operation: string, status: 'success' | 'failure') {
    this.escrowCounter.inc({ operation, status });
  }

  // Record error
  recordError(contract: string, errorType: string) {
    this.errorCounter.inc({ contract, error_type: errorType });
  }

  // Update active escrows
  updateActiveEscrows(count: number) {
    this.activeEscrowsGauge.set(count);
  }

  // Update total volume
  updateTotalVolume(volume: number) {
    this.totalVolumeGauge.set(volume);
  }

  // Update gas price
  updateGasPrice(gasPriceGwei: number) {
    this.gasPreferenceGauge.set(gasPriceGwei);
  }

  // Record transaction duration
  recordTransactionDuration(contract: string, method: string, durationSeconds: number) {
    this.transactionDuration.observe({ contract, method }, durationSeconds);
  }

  // Record block time
  recordBlockTime(seconds: number) {
    this.blockTimeHistogram.observe(seconds);
  }

  // Get metrics
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  // Get content type
  getContentType(): string {
    return this.register.contentType;
  }

  // Reset metrics
  resetMetrics() {
    this.register.resetMetrics();
  }
}
