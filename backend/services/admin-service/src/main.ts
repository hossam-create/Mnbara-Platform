import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerService } from './services/logger.service';
import { ErrorTrackingService } from './services/error-tracking.service';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new LoggerService(),
  });

  // Get services
  const logger = app.get(LoggerService);
  const errorTracking = app.get(ErrorTrackingService);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Compression
  app.use(compression());

  // Global prefix
  app.setGlobalPrefix('api');

  // Start listening
  const port = process.env.PORT || 3015;
  await app.listen(port);

  logger.log(`🚀 Mnbara Backend started on port ${port}`, 'Bootstrap');
  logger.log(`📊 Metrics available at http://localhost:${port}/metrics`, 'Bootstrap');
  logger.log('🔌 WebSocket server on port 3001', 'Bootstrap');
  logger.log('🔐 Security middleware enabled', 'Bootstrap');
  logger.log('📝 Logging to ./logs directory', 'Bootstrap');
  logger.log(`🐛 Sentry error tracking enabled: ${!!process.env.SENTRY_DSN}`, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
