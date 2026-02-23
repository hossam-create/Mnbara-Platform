import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { EscrowModule } from './escrow/escrow.module';
import { DisputeModule } from './dispute/dispute.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EscrowModule,
    DisputeModule,
  ],
})
export class AppModule {}
