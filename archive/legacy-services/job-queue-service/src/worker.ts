import { Worker } from 'bullmq';
import { redisConnection } from './config/redis.config';
import { JobType } from './types/job.types';
import { JobProcessor } from './workers/job-processor';
import { logger } from './utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const processor = new JobProcessor();

// Create workers for each job type
const workers: Worker[] = [];

// Email worker
workers.push(new Worker(JobType.EMAIL, async (job) => {
  return await processor.processEmail(job);
}, { connection: redisConnection, concurrency: 5 }));

// SMS worker
workers.push(new Worker(JobType.SMS, async (job) => {
  return await processor.processSMS(job);
}, { connection: redisConnection, concurrency: 10 }));

// Push notification worker
workers.push(new Worker(JobType.PUSH_NOTIFICATION, async (job) => {
  return await processor.processPushNotification(job);
}, { connection: redisConnection, concurrency: 10 }));

// Image processing worker
workers.push(new Worker(JobType.IMAGE_PROCESSING, async (job) => {
  return await processor.processImageProcessing(job);
}, { connection: redisConnection, concurrency: 3 }));

// Auction reminder worker
workers.push(new Worker(JobType.AUCTION_REMINDER, async (job) => {
  return await processor.processAuctionReminder(job);
}, { connection: redisConnection, concurrency: 5 }));

// Report generation worker
workers.push(new Worker(JobType.REPORT_GENERATION, async (job) => {
  return await processor.processReportGeneration(job);
}, { connection: redisConnection, concurrency: 2 }));

// Data export worker
workers.push(new Worker(JobType.DATA_EXPORT, async (job) => {
  return await processor.processDataExport(job);
}, { connection: redisConnection, concurrency: 2 }));

// Payment processing worker
workers.push(new Worker(JobType.PAYMENT_PROCESSING, async (job) => {
  return await processor.processPaymentProcessing(job);
}, { connection: redisConnection, concurrency: 5 }));

// Order fulfillment worker
workers.push(new Worker(JobType.ORDER_FULFILLMENT, async (job) => {
  return await processor.processOrderFulfillment(job);
}, { connection: redisConnection, concurrency: 5 }));

// Event listeners
workers.forEach(worker => {
  worker.on('completed', (job) => {
    logger.info(`Worker completed job ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Worker failed job ${job?.id}: ${err.message}`);
  });

  worker.on('error', (err) => {
    logger.error(`Worker error: ${err.message}`);
  });
});

logger.info(`Started ${workers.length} workers`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing workers...');
  await Promise.all(workers.map(w => w.close()));
  process.exit(0);
});
