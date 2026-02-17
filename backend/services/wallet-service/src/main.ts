import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Mnbara Wallet API')
    .setDescription('Ledger-first wallet service with escrow, transfers, and multi-currency support')
    .setVersion('2.1.0')
    .addBearerAuth()
    .addTag('wallet', 'Wallet management')
    .addTag('ledger', 'Ledger operations')
    .addTag('transfer', 'Fund transfers')
    .addTag('escrow', 'Escrow state machine')
    .addTag('conversion', 'Currency conversion')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3005;
  await app.listen(port);
  
  logger.log(`🚀 Wallet Service running on port ${port}`);
  logger.log(`📚 Swagger docs available at http://localhost:${port}/api`);
  logger.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`💰 Phase: 4.2 - Ledger-First Architecture`);
}

bootstrap();
