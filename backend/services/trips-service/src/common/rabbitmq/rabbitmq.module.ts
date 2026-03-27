/**
 * RabbitMQ Module
 * Provides RabbitMQ service for event publishing
 */

import { Module, Global } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';

@Global()
@Module({
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}
