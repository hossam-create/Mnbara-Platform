import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { PaymentModule } from './payment/payment.module';
import { EscrowKenyaModule } from './escrow-kenya/escrow-kenya.module';
import { ManualPayoutModule } from './manual-payout/manual-payout.module';
import { AutomationModule } from './automation/automation.module';
import { DisputeSystemModule } from './dispute-system/dispute-system.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PaymentModule,
    EscrowKenyaModule,
    ManualPayoutModule,
    AutomationModule,
    DisputeSystemModule,
  ],
})
export class AppModule {}
