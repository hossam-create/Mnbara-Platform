import { NestFactory } from '@nestjs/core';
import { CategoryModule } from './category.module';

async function bootstrap() {
  const app = await NestFactory.create(CategoryModule);
  
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT || 3001);
  console.log(`Category service is running on port ${process.env.PORT || 3001}`);
}

bootstrap();