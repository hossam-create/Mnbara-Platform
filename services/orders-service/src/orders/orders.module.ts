import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { EmailService } from '../common/email/email.service';
import { EscrowClient } from '../common/payment/escrow.client';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, EmailService, EscrowClient],
  exports: [OrdersService],
})
export class OrdersModule {}
