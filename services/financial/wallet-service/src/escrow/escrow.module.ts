import { Module } from '@nestjs/common';
import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';
import { TransferModule } from '../transfer/transfer.module';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [TransferModule, PrismaModule],
  controllers: [EscrowController],
  providers: [EscrowService],
  exports: [EscrowService], // Export for use in other modules
})
export class EscrowModule {}